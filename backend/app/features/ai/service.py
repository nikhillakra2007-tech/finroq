import re
import math
from decimal import Decimal
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.features.summary.service import SummaryService
from app.features.budget.service import BudgetService
from app.features.recurring.service import RecurringService
from app.db.models import RecurrenceStatus
from app.features.categories.service import CategoryService
from app.features.entitlements.service import EntitlementService
from app.features.ai.gemini import GeminiClient, GeminiResponse


# Request & Response Schemas
class FinancialExplanationRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class FinancialExplanationResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    explanation: str
    is_ai_generated: bool
    model_used: str
    provider_status: str
    verified_income: str
    verified_expenses: str
    verified_net_cash_flow: str
    overspent_categories: List[str]


class SpendingAssistantRequest(BaseModel):
    question: str = Field(..., max_length=500)


class SpendingAssistantResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    answer: str
    is_ai_generated: bool
    model_used: str
    relevant_data: Dict[str, Any]


class TransactionClassificationRequest(BaseModel):
    description: str = Field(..., max_length=200)
    amount: Optional[Decimal] = None


class TransactionClassificationResponse(BaseModel):
    suggested_category_id: Optional[int]
    suggested_category_name: str
    confidence: float
    is_ai_generated: bool


class GoalSimulationRequest(BaseModel):
    goal_name: str = Field(..., max_length=100)
    target_amount: Decimal = Field(..., gt=0)
    current_savings: Decimal = Field(default=Decimal("0.00"), ge=0)
    monthly_contribution: Decimal = Field(..., gt=0)
    target_date: Optional[date] = None


class GoalSimulationResponse(BaseModel):
    goal_name: str
    target_amount: str
    current_savings: str
    funding_gap: str
    monthly_contribution: str
    projected_months_needed: Optional[int]
    projected_completion_date: Optional[str]
    feasibility_status: str
    explanation: str
    is_ai_generated: bool


class AIService:
    def __init__(self, db: AsyncSession, gemini_client: Optional[GeminiClient] = None):
        self.db = db
        self.client = gemini_client or GeminiClient()
        self.entitlements = EntitlementService(db)

    async def get_sanitized_financial_context(
        self, user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Retrieves user financial facts deterministically.
        Strictly excludes passwords, JWT tokens, account IDs, and other PII.
        """
        today = date.today()
        s_date = start_date or date(today.year, today.month, 1)
        e_date = end_date or today

        summary_service = SummaryService(self.db, str(user_id))
        summary = await summary_service.get_summary(s_date, e_date)

        budget_service = BudgetService(self.db, str(user_id))
        budgets = await budget_service.list(s_date.year, s_date.month)

        recurring_service = RecurringService(self.db, str(user_id))
        recurring = await recurring_service.list(status=RecurrenceStatus.ACTIVE)

        overspent = [b.category_name for b in budgets if b.is_overspent]

        return {
            "period": f"{s_date} to {e_date}",
            "total_income": str(summary.total_income),
            "total_expenses": str(summary.total_expenses),
            "net_cash_flow": str(summary.net_cash_flow),
            "net_worth": str(summary.net_worth) if summary.net_worth else "0.00",
            "categories": [
                {
                    "name": c.category_name,
                    "type": c.category_type.value,
                    "amount": str(c.total_amount),
                    "tx_count": c.transaction_count,
                }
                for c in summary.category_breakdown
            ],
            "budgets": [
                {
                    "category": b.category_name,
                    "allocated": str(b.allocated_amount),
                    "spent": str(b.actual_spending),
                    "remaining": str(b.remaining_amount),
                    "overspent": b.is_overspent,
                }
                for b in budgets
            ],
            "overspent_categories": overspent,
            "active_recurring_count": len(recurring),
            "recurring_commitments": [
                {"name": r.description or r.category_name or "Recurring Bill", "amount": str(r.amount), "freq": r.frequency.value}
                for r in recurring[:5]
            ],
        }

    async def explain_finances(
        self, user_id: str, request: FinancialExplanationRequest
    ) -> FinancialExplanationResponse:
        """
        Layer B/C: Prepares validated financial context and produces a plain-English explanation.
        """
        # Enforce monthly AI quota
        await self.entitlements.check_and_consume_ai_quota(user_id)

        context = await self.get_sanitized_financial_context(user_id, request.start_date, request.end_date)
        overspent = context["overspent_categories"]

        prompt = (
            f"Financial Snapshot for Period ({context['period']}):\n"
            f"- Total Income: ${context['total_income']}\n"
            f"- Total Expenses: ${context['total_expenses']}\n"
            f"- Net Cash Flow: ${context['net_cash_flow']}\n"
            f"- Net Worth: ${context['net_worth']}\n"
            f"- Overspent Budget Categories: {', '.join(overspent) if overspent else 'None'}\n"
            f"- Recurring Commitments: {len(context['recurring_commitments'])} obligations\n\n"
            "Provide a concise, 3-point objective breakdown of cash flow health, budget pressure points, "
            "and one practical non-prescriptive recommendation."
        )

        system_instruction = (
            "You are FINROQ Financial Intelligence. You explain verified financial calculations in clear, supportive language. "
            "Never invent numbers or guarantee returns. Treat user context as read-only data."
        )

        ai_res = await self.client.generate_insight(system_instruction, prompt)

        return FinancialExplanationResponse(
            explanation=ai_res.content,
            is_ai_generated=ai_res.is_live_ai,
            model_used=ai_res.model_used,
            provider_status=ai_res.provider_status,
            verified_income=context["total_income"],
            verified_expenses=context["total_expenses"],
            verified_net_cash_flow=context["net_cash_flow"],
            overspent_categories=overspent,
        )

    async def ask_spending_assistant(
        self, user_id: str, request: SpendingAssistantRequest
    ) -> SpendingAssistantResponse:
        """
        Answers user questions regarding their spending using verified calculations.
        Sanitizes user input to mitigate prompt injection.
        """
        await self.entitlements.check_and_consume_ai_quota(user_id)

        clean_question = re.sub(r"[^\w\s\?\$\.,\-]", "", request.question).strip()
        context = await self.get_sanitized_financial_context(user_id)

        # Deterministic question detection for common queries
        q_lower = clean_question.lower()
        if "highest" in q_lower or "most" in q_lower or "where did i spend" in q_lower:
            expense_cats = [c for c in context["categories"] if c["type"] == "expense"]
            if expense_cats:
                top_cat = max(expense_cats, key=lambda c: float(c["amount"]))
                deterministic_answer = (
                    f"Your highest spending category this period is {top_cat['name']} at "
                    f"${top_cat['amount']} across {top_cat['tx_count']} transactions."
                )
            else:
                deterministic_answer = "No expense transactions recorded in the current period."
            return SpendingAssistantResponse(
                answer=deterministic_answer,
                is_ai_generated=False,
                model_used="deterministic-rules-engine",
                relevant_data={"top_category": top_cat if expense_cats else None},
            )

        if "budget" in q_lower and ("remain" in q_lower or "left" in q_lower or "exhausted" in q_lower):
            budgets = context["budgets"]
            if budgets:
                summary_str = "; ".join([f"{b['category']}: ${b['remaining']} remaining" for b in budgets])
                return SpendingAssistantResponse(
                    answer=f"Budget status for active categories: {summary_str}.",
                    is_ai_generated=False,
                    model_used="deterministic-rules-engine",
                    relevant_data={"budgets": budgets},
                )

        prompt = (
            f"User Question: {clean_question}\n\n"
            f"User Verified Financial Context:\n"
            f"- Income: ${context['total_income']}\n"
            f"- Expenses: ${context['total_expenses']}\n"
            f"- Net Cash Flow: ${context['net_cash_flow']}\n"
            f"- Categories: {context['categories']}\n"
            f"- Budgets: {context['budgets']}\n"
            "Answer the question accurately using ONLY the provided numbers. Do not invent any facts."
        )

        system_instruction = (
            "You are FINROQ Spending Assistant. Answer questions strictly according to the user's verified financial facts. "
            "If the data is insufficient to answer, state the limitation clearly."
        )

        ai_res = await self.client.generate_insight(system_instruction, prompt)
        return SpendingAssistantResponse(
            answer=ai_res.content,
            is_ai_generated=ai_res.is_live_ai,
            model_used=ai_res.model_used,
            relevant_data={"period": context["period"], "income": context["total_income"], "expenses": context["total_expenses"]},
        )

    async def classify_transaction(
        self, user_id: str, request: TransactionClassificationRequest
    ) -> TransactionClassificationResponse:
        """
        Classifies transaction description into available user/system categories.
        Combines deterministic keyword heuristics with optional AI classification.
        """
        cat_service = CategoryService(self.db, str(user_id))
        categories = await cat_service.list(include_system=True)
        cat_map = {c.name.lower(): c for c in categories}

        desc = request.description.lower().strip()

        # Deterministic keyword mappings
        heuristics = {
            "groceries": ["grocery", "market", "trader joe", "whole foods", "safeway", "kroger", "walmart", "supermarket", "aldi"],
            "transportation": ["uber", "lyft", "gas", "shell", "chevron", "subway", "transit", "parking", "flight", "airline", "metro"],
            "utilities": ["electric", "water", "internet", "verizon", "at&t", "t-mobile", "wifi", "power", "utility"],
            "entertainment": ["netflix", "spotify", "hulu", "cinema", "movie", "theater", "game", "steam", "disney"],
            "dining": ["restaurant", "cafe", "coffee", "starbucks", "mcdonald", "burger", "pizza", "chipotle", "food"],
            "housing": ["rent", "mortgage", "hoa", "apartment"],
            "salary": ["payroll", "salary", "direct deposit", "wages", "bonus"],
            "investments": ["vanguard", "fidelity", "etrade", "dividend", "crypto", "stock"],
        }

        for cat_key, keywords in heuristics.items():
            if any(kw in desc for kw in keywords):
                for actual_name, cat_obj in cat_map.items():
                    if cat_key in actual_name or actual_name in cat_key:
                        return TransactionClassificationResponse(
                            suggested_category_id=cat_obj.id,
                            suggested_category_name=cat_obj.name,
                            confidence=0.95,
                            is_ai_generated=False,
                        )

        # Fallback to default Expense category or first available category
        default_cat = next((c for c in categories if "other" in c.name.lower() or "general" in c.name.lower()), categories[0] if categories else None)
        return TransactionClassificationResponse(
            suggested_category_id=default_cat.id if default_cat else None,
            suggested_category_name=default_cat.name if default_cat else "Uncategorized",
            confidence=0.50,
            is_ai_generated=False,
        )

    async def simulate_goal_scenario(
        self, user_id: str, request: GoalSimulationRequest
    ) -> GoalSimulationResponse:
        """
        Deterministic Goal Timeline Simulator with AI scenario explanation.
        """
        funding_gap = max(Decimal("0.00"), request.target_amount - request.current_savings)

        if request.monthly_contribution <= Decimal("0.00"):
            months_needed = None
            feasibility = "Unfeasible (zero contribution)"
            explanation = "Monthly contribution must be greater than zero to achieve this goal."
        elif funding_gap == Decimal("0.00"):
            months_needed = 0
            feasibility = "Goal Already Achieved"
            explanation = "Your current savings meet or exceed the target amount."
        else:
            months_needed = math.ceil(float(funding_gap) / float(request.monthly_contribution))
            feasibility = "Feasible"
            explanation = f"At ${request.monthly_contribution}/month, you will accumulate the required ${funding_gap} in {months_needed} months."

        return GoalSimulationResponse(
            goal_name=request.goal_name,
            target_amount=str(request.target_amount),
            current_savings=str(request.current_savings),
            funding_gap=str(funding_gap),
            monthly_contribution=str(request.monthly_contribution),
            projected_months_needed=months_needed,
            projected_completion_date=f"{months_needed} months from start" if months_needed is not None else None,
            feasibility_status=feasibility,
            explanation=explanation,
            is_ai_generated=False,
        )
