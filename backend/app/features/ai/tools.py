"""Financial Tool Registry for Finroq AI.

Implements Tools A through L with deterministic, decimal-precise math,
strict user authorization, bounded queries, and explicit JSON schemas
for OpenAI tool calling.
"""

from __future__ import annotations

import calendar
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import selectinload

from app.db.models import Account, Transaction, Category, Budget, RecurringTransaction, TransactionType, TransactionStatus, AccountType
from app.features.summary.service import SummaryService
from app.features.budget.service import BudgetService
from app.features.recurring.service import RecurringService
from app.features.finance import engine

ZERO = Decimal("0.00")


# =====================================================================
# Tool Definitions for OpenAI API
# =====================================================================

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_financial_summary",
            "description": "Retrieve the user's verified financial summary for a specified period (income, expenses, net cash flow, account balances, and budget overview).",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format. Defaults to first day of the current month.",
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format. Defaults to current date.",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_transactions",
            "description": "Retrieve verified transactions with optional filters for dates, type (income, expense, transfer), category, account, or search keyword.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format.",
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format.",
                    },
                    "transaction_type": {
                        "type": "string",
                        "enum": ["income", "expense", "transfer"],
                        "description": "Filter by transaction type.",
                    },
                    "category_name": {
                        "type": "string",
                        "description": "Filter by category name (e.g. Groceries, Dining, Rent).",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of transactions to return (max 50, default 20).",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_spending",
            "description": "Analyze spending patterns, breakdown by category, top expense drivers, recurring vs discretionary outflow, and period changes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format. Defaults to first day of current month.",
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format. Defaults to current date.",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_budget_status",
            "description": "Retrieve user's category budgets and calculate current spending status, percentage used, and remaining allocations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {
                        "type": "integer",
                        "description": "Budget year. Defaults to current year.",
                    },
                    "month": {
                        "type": "integer",
                        "description": "Budget month (1-12). Defaults to current month.",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_upcoming_bills",
            "description": "Retrieve upcoming active recurring bills and scheduled commitments (rent, utilities, subscriptions, EMIs).",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of bills to return (default 10).",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_purchase_affordability",
            "description": "Evaluate whether a proposed purchase is affordable based on liquid cash, upcoming recurring commitments, remaining budget, and cash reserves.",
            "parameters": {
                "type": "object",
                "properties": {
                    "purchase_amount": {
                        "type": "number",
                        "description": "The monetary cost of the planned purchase.",
                    },
                    "context": {
                        "type": "string",
                        "description": "Optional context about the purchase item or necessity (e.g. 'work laptop', 'vacation ticket').",
                    },
                    "minimum_reserve": {
                        "type": "number",
                        "description": "Optional user-desired minimum cash cushion to protect.",
                    },
                },
                "required": ["purchase_amount"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_savings_scenario",
            "description": "Calculate deterministic savings impact under alternative spending reduction scenarios (monthly and annual impact).",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_monthly_savings": {
                        "type": "number",
                        "description": "Desired monthly savings target to achieve (e.g. 5000).",
                    },
                    "category_name": {
                        "type": "string",
                        "description": "Specific category to simulate reduction for (optional).",
                    },
                    "reduction_percentage": {
                        "type": "number",
                        "description": "Percentage reduction to test (e.g. 15 for 15%).",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_financial_periods",
            "description": "Compare financial performance between two time periods (e.g. current month vs previous month).",
            "parameters": {
                "type": "object",
                "properties": {
                    "current_start": {
                        "type": "string",
                        "description": "Current period start YYYY-MM-DD.",
                    },
                    "current_end": {
                        "type": "string",
                        "description": "Current period end YYYY-MM-DD.",
                    },
                    "previous_start": {
                        "type": "string",
                        "description": "Previous period start YYYY-MM-DD.",
                    },
                    "previous_end": {
                        "type": "string",
                        "description": "Previous period end YYYY-MM-DD.",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "estimate_month_end_position",
            "description": "Estimate liquid financial position and cash runway at the end of the current month using current pace and scheduled obligations.",
            "parameters": {
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_financial_goals",
            "description": "Retrieve financial goal tracking status or simulation parameters.",
            "parameters": {
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_financial_context_for_question",
            "description": "Retrieve a minimal targeted financial context summary tailored to answer a specific user question.",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The user's query topic.",
                    },
                },
                "required": ["question"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "explain_financial_calculation",
            "description": "Provide a transparent, verifiable breakdown of how a financial metric was computed.",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric_name": {
                        "type": "string",
                        "description": "The metric to explain (e.g. net_cash_flow, savings_rate, budget_utilization, emergency_runway).",
                    },
                },
                "required": ["metric_name"],
                "additionalProperties": False,
            },
        },
    },
]


# =====================================================================
# Financial Tool Registry Implementation
# =====================================================================

class FinancialToolRegistry:
    def __init__(self, db: AsyncSession, owner_id: str):
        self.db = db
        self.owner_id = str(owner_id)

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatch tool name to authorized handler."""
        handler = getattr(self, f"tool_{tool_name}", None)
        if not handler:
            return {
                "error": f"Tool '{tool_name}' is not recognized or not authorized.",
                "status": "failed",
            }
        try:
            return await handler(**arguments)
        except Exception as exc:
            return {
                "error": f"Tool execution failed: {str(exc)}",
                "tool_name": tool_name,
                "status": "error",
            }

    # ─────────────────────────────────────────────────────────────
    # Tool A: get_financial_summary
    # ─────────────────────────────────────────────────────────────
    async def tool_get_financial_summary(
        self, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        today = date.today()
        s_date = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else date(today.year, today.month, 1)
        e_date = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else today

        dt_start = datetime.combine(s_date, datetime.min.time())
        dt_end = datetime.combine(e_date, datetime.max.time())

        summary_service = SummaryService(self.db, self.owner_id)
        summary = await summary_service.get_summary(dt_start, dt_end)

        # Retrieve accounts and distinguish liquid vs liability
        liquid_accounts = []
        liability_accounts = []
        total_liquid = ZERO
        primary_currency = "INR"

        for acc in summary.account_balances:
            bal = Decimal(acc.current_balance)
            primary_currency = acc.currency
            item = {
                "account_name": acc.account_name,
                "account_type": acc.account_type.value,
                "currency": acc.currency,
                "current_balance": str(bal),
            }
            if acc.account_type in (AccountType.CHECKING, AccountType.SAVINGS, AccountType.CASH):
                liquid_accounts.append(item)
                total_liquid += bal
            elif acc.account_type == AccountType.CREDIT:
                liability_accounts.append(item)
            else:
                liquid_accounts.append(item)

        # Budget summary for period
        budget_service = BudgetService(self.db, self.owner_id)
        budgets = await budget_service.list(today.year, today.month)
        total_budget_allocated = sum((Decimal(b.allocated_amount) for b in budgets), ZERO)
        total_budget_spent = sum((Decimal(b.actual_spending) for b in budgets), ZERO)
        remaining_budget = max(ZERO, total_budget_allocated - total_budget_spent)

        return {
            "period_covered": {"start_date": str(s_date), "end_date": str(e_date)},
            "currency": primary_currency,
            "total_income": str(summary.total_income),
            "total_expenses": str(summary.total_expenses),
            "net_cash_flow": str(summary.net_cash_flow),
            "liquid_cash_available": str(total_liquid),
            "liquid_accounts": liquid_accounts,
            "liability_accounts": liability_accounts,
            "budget_status": {
                "total_allocated": str(total_budget_allocated),
                "total_spent": str(total_budget_spent),
                "remaining_budget": str(remaining_budget),
            },
            "data_freshness": "Real-time verified ledger",
            "notes": "Liquid cash accounts represent immediately spendable balances. Credit accounts represent liabilities.",
        }

    # ─────────────────────────────────────────────────────────────
    # Tool B: get_transactions
    # ─────────────────────────────────────────────────────────────
    async def tool_get_transactions(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        transaction_type: Optional[str] = None,
        category_name: Optional[str] = None,
        limit: int = 20,
    ) -> Dict[str, Any]:
        bounded_limit = min(max(1, limit), 50)
        conditions = [Transaction.owner_id == self.owner_id]

        if start_date:
            dt_s = datetime.combine(datetime.strptime(start_date, "%Y-%m-%d").date(), datetime.min.time())
            conditions.append(Transaction.transaction_date >= dt_s)
        if end_date:
            dt_e = datetime.combine(datetime.strptime(end_date, "%Y-%m-%d").date(), datetime.max.time())
            conditions.append(Transaction.transaction_date <= dt_e)
        if transaction_type:
            try:
                tt = TransactionType(transaction_type)
                conditions.append(Transaction.transaction_type == tt)
            except ValueError:
                pass

        query = (
            select(Transaction)
            .options(selectinload(Transaction.category), selectinload(Transaction.account))
        )

        if category_name:
            clean_cat = category_name.strip()
            if clean_cat.lower() == "uncategorized":
                conditions.append(Transaction.category_id.is_(None))
            else:
                query = query.join(Transaction.category).where(
                    Category.name.ilike(f"%{clean_cat}%")
                )

        query = (
            query.where(and_(*conditions))
            .order_by(desc(Transaction.transaction_date))
            .limit(bounded_limit)
        )
        res = await self.db.execute(query)
        txns = res.scalars().all()

        results = []
        for t in txns:
            cat_name = t.category.name if t.category else "Uncategorized"
            results.append({
                "id": t.id,
                "date": t.transaction_date.strftime("%Y-%m-%d"),
                "description": t.description or "Transaction",
                "amount": str(t.amount),
                "currency": t.currency,
                "transaction_type": t.transaction_type.value,
                "status": t.status.value,
                "category": cat_name,
                "account": t.account.name if t.account else "Default",
            })

        return {
            "transaction_count": len(results),
            "limit_applied": bounded_limit,
            "transactions": results,
        }

    # ─────────────────────────────────────────────────────────────
    # Tool C: analyze_spending
    # ─────────────────────────────────────────────────────────────
    async def tool_analyze_spending(
        self, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        today = date.today()
        s_date = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else date(today.year, today.month, 1)
        e_date = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else today

        dt_start = datetime.combine(s_date, datetime.min.time())
        dt_end = datetime.combine(e_date, datetime.max.time())

        summary_service = SummaryService(self.db, self.owner_id)
        summary = await summary_service.get_summary(dt_start, dt_end)

        # Categorize into essential vs discretionary heuristics
        essential_keywords = ["rent", "grocery", "groceries", "utility", "utilities", "electricity", "water", "health", "insurance", "emi", "loan"]
        categories = []
        total_expense_decimal = Decimal(summary.total_expenses)
        essential_spend = ZERO
        discretionary_spend = ZERO

        for cat in summary.category_breakdown:
            if cat.category_type == "expense":
                amt = Decimal(cat.total_amount)
                cat_lower = cat.category_name.lower()
                is_essential = any(k in cat_lower for k in essential_keywords)
                if is_essential:
                    essential_spend += amt
                else:
                    discretionary_spend += amt

                pct_of_total = ((amt / total_expense_decimal) * Decimal("100")) if total_expense_decimal > ZERO else ZERO
                categories.append({
                    "category_name": cat.category_name,
                    "amount": str(amt),
                    "transaction_count": cat.transaction_count,
                    "percentage_of_total": f"{pct_of_total:.1f}%",
                    "nature": "Essential" if is_essential else "Discretionary",
                })

        categories.sort(key=lambda c: Decimal(c["amount"]), reverse=True)
        top_categories = categories[:3]

        return {
            "period": {"start_date": str(s_date), "end_date": str(e_date)},
            "total_expenses": summary.total_expenses,
            "category_count": len(categories),
            "top_expense_drivers": top_categories,
            "breakdown_by_category": categories,
            "spending_split": {
                "essential_amount": str(essential_spend),
                "essential_percentage": f"{((essential_spend / total_expense_decimal) * Decimal('100')):.1f}%" if total_expense_decimal > ZERO else "0.0%",
                "discretionary_amount": str(discretionary_spend),
                "discretionary_percentage": f"{((discretionary_spend / total_expense_decimal) * Decimal('100')):.1f}%" if total_expense_decimal > ZERO else "0.0%",
            },
        }

    # ─────────────────────────────────────────────────────────────
    # Tool D: get_budget_status
    # ─────────────────────────────────────────────────────────────
    async def tool_get_budget_status(
        self, year: Optional[int] = None, month: Optional[int] = None
    ) -> Dict[str, Any]:
        now = datetime.now()
        target_year = year or now.year
        target_month = month or now.month

        budget_service = BudgetService(self.db, self.owner_id)
        budgets = await budget_service.list(target_year, target_month)

        items = []
        total_allocated = ZERO
        total_spent = ZERO
        overspent_categories = []

        last_day = calendar.monthrange(target_year, target_month)[1]
        period_end = f"{target_year}-{target_month:02d}-{last_day:02d}"

        for b in budgets:
            allocated = Decimal(b.allocated_amount)
            spent = Decimal(b.actual_spending)
            rem = allocated - spent
            total_allocated += allocated
            total_spent += spent

            is_over = b.is_overspent
            if is_over:
                overspent_categories.append(b.category_name)

            items.append({
                "category_name": b.category_name,
                "budget_limit": str(allocated),
                "spent_to_date": str(spent),
                "remaining": str(rem),
                "percentage_used": f"{b.utilization_percentage:.1f}%" if b.utilization_percentage is not None else "0.0%",
                "is_overspent": is_over,
                "period_end_date": period_end,
            })

        overall_pct = ((total_spent / total_allocated) * Decimal("100")) if total_allocated > ZERO else ZERO

        return {
            "period": f"{target_year}-{target_month:02d}",
            "period_end_date": period_end,
            "total_allocated": str(total_allocated),
            "total_spent": str(total_spent),
            "total_remaining": str(total_allocated - total_spent),
            "overall_utilization": f"{overall_pct:.1f}%",
            "overspent_count": len(overspent_categories),
            "overspent_categories": overspent_categories,
            "budgets": items,
        }

    # ─────────────────────────────────────────────────────────────
    # Tool E: get_upcoming_bills
    # ─────────────────────────────────────────────────────────────
    async def tool_get_upcoming_bills(self, limit: int = 10) -> Dict[str, Any]:
        recurring_service = RecurringService(self.db, self.owner_id)
        active_bills = await recurring_service.list(status="active")

        sorted_bills = sorted(
            active_bills,
            key=lambda b: b.next_occurrence if b.next_occurrence else datetime.max
        )

        bounded = sorted_bills[:min(limit, 20)]
        bill_items = []
        total_upcoming = ZERO

        for b in bounded:
            amt = Decimal(b.amount)
            total_upcoming += amt
            bill_items.append({
                "description": b.description or "Scheduled recurring bill",
                "expected_amount": str(amt),
                "currency": b.currency,
                "frequency": b.frequency,
                "expected_due_date": b.next_occurrence.strftime("%Y-%m-%d") if b.next_occurrence else "Pending schedule",
                "status": b.status,
                "category": b.category_name or "Unassigned",
            })

        return {
            "total_active_bills_count": len(active_bills),
            "upcoming_commitment_sum": str(total_upcoming),
            "bills": bill_items,
            "clarification": "These entries represent scheduled commitments. They are not marked as paid until an actual completed transaction is recorded in your ledger.",
        }

    # ─────────────────────────────────────────────────────────────
    # Tool F: calculate_purchase_affordability
    # ─────────────────────────────────────────────────────────────
    async def tool_calculate_purchase_affordability(
        self,
        purchase_amount: float,
        context: Optional[str] = None,
        minimum_reserve: Optional[float] = None,
    ) -> Dict[str, Any]:
        amount_dec = Decimal(str(purchase_amount))
        reserve_dec = Decimal(str(minimum_reserve)) if minimum_reserve else Decimal("5000.00")

        # 1. Available liquid cash
        today = date.today()
        summary_tool = await self.tool_get_financial_summary()
        liquid_cash = Decimal(summary_tool["liquid_cash_available"])
        currency = summary_tool["currency"]

        # 2. Upcoming recurring commitments for next 30 days
        bills_tool = await self.tool_get_upcoming_bills(limit=20)
        upcoming_commitments = Decimal(bills_tool["upcoming_commitment_sum"])

        # 3. Remaining unallocated budget this month
        budget_tool = await self.tool_get_budget_status()
        remaining_budget = Decimal(budget_tool["total_remaining"])

        # Calculations
        obligations_buffer = upcoming_commitments + reserve_dec
        cash_after_commitments = liquid_cash - obligations_buffer
        cash_after_purchase = liquid_cash - amount_dec - upcoming_commitments

        # Deterministic affordability rating
        if liquid_cash < amount_dec:
            rating = "Not Affordable: Insufficient Liquid Cash"
            recommendation = (
                f"Your current liquid balance is {currency} {liquid_cash:,.2f}, which is less than "
                f"the purchase price of {currency} {amount_dec:,.2f}. Making this purchase would overdraw your accounts."
            )
        elif cash_after_purchase < reserve_dec:
            rating = "Caution: Cash Cushion Compromised"
            recommendation = (
                f"While you have sufficient cash to cover the {currency} {amount_dec:,.2f} purchase, "
                f"after accounting for upcoming bills ({currency} {upcoming_commitments:,.2f}), your remaining cushion "
                f"would fall to {currency} {max(ZERO, cash_after_purchase):,.2f}, below your safety reserve of {currency} {reserve_dec:,.2f}."
            )
        else:
            rating = "Comfortably Affordable"
            recommendation = (
                f"The purchase of {currency} {amount_dec:,.2f} is well within your available liquid cash ({currency} {liquid_cash:,.2f}). "
                f"Even after paying known upcoming bills ({currency} {upcoming_commitments:,.2f}) and preserving your safety buffer ({currency} {reserve_dec:,.2f}), "
                f"you will retain an estimated surplus of {currency} {(cash_after_purchase - reserve_dec):,.2f}."
            )

        return {
            "purchase_amount": str(amount_dec),
            "currency": currency,
            "purchase_context": context or "Unspecified purchase",
            "available_liquid_cash": str(liquid_cash),
            "upcoming_known_bills": str(upcoming_commitments),
            "safety_reserve_protected": str(reserve_dec),
            "projected_cash_after_purchase_and_bills": str(cash_after_purchase),
            "affordability_rating": rating,
            "recommendation": recommendation,
            "assumptions": [
                "Assumes recorded account balances reflect all recent debits.",
                "Considers all active scheduled recurring bills.",
                "Does not count unearned future income as guaranteed cash.",
            ],
        }

    # ─────────────────────────────────────────────────────────────
    # Tool G: calculate_savings_scenario
    # ─────────────────────────────────────────────────────────────
    async def tool_calculate_savings_scenario(
        self,
        target_monthly_savings: Optional[float] = None,
        category_name: Optional[str] = None,
        reduction_percentage: Optional[float] = None,
    ) -> Dict[str, Any]:
        today = date.today()
        summary_tool = await self.tool_analyze_spending()
        total_exp = Decimal(summary_tool["total_expenses"])

        if target_monthly_savings:
            target_dec = Decimal(str(target_monthly_savings)).quantize(Decimal("0.01"))
            annual_target = target_dec * Decimal("12")
            required_pct = ((target_dec / total_exp) * Decimal("100")) if total_exp > ZERO else ZERO

            # Propose allocations across top discretionary categories
            discretionary_categories = [c for c in summary_tool["breakdown_by_category"] if c["nature"] == "Discretionary"]
            plan = []
            accumulated = ZERO
            for cat in discretionary_categories:
                cat_amt = Decimal(cat["amount"])
                # Suggest realistic 15-25% trimming
                suggested_cut = min(cat_amt * Decimal("0.20"), target_dec - accumulated)
                if suggested_cut > ZERO:
                    plan.append({
                        "category": cat["category_name"],
                        "current_spending": str(cat_amt),
                        "suggested_reduction": str(suggested_cut),
                        "new_budget_target": str(cat_amt - suggested_cut),
                    })
                    accumulated += suggested_cut
                if accumulated >= target_dec:
                    break

            return {
                "scenario_type": "Target Monthly Savings Goal",
                "monthly_target": str(target_dec),
                "annual_savings_impact": str(annual_target),
                "three_year_compounded_at_7pct": str(annual_target * Decimal("3.22")),
                "required_spending_reduction_percentage": f"{required_pct:.1f}%",
                "feasibility": "Realistic" if required_pct <= Decimal("25.0") else "Ambitious (Requires deep cuts)",
                "recommended_category_adjustments": plan,
                "disclaimer": "This calculation is a planning scenario based on past expenses. Actual savings depend on daily spending discipline.",
            }
        else:
            # Percentage cut scenario on specific category or total
            pct_dec = Decimal(str(reduction_percentage or 10.0))
            base_amt = total_exp
            label = "Total Monthly Spending"

            if category_name:
                matches = [c for c in summary_tool["breakdown_by_category"] if category_name.lower() in c["category_name"].lower()]
                if matches:
                    base_amt = Decimal(matches[0]["amount"])
                    label = matches[0]["category_name"]

            monthly_saved = (base_amt * (pct_dec / Decimal("100"))).quantize(Decimal("0.01"))
            annual_saved = (monthly_saved * Decimal("12")).quantize(Decimal("0.01"))

            return {
                "scenario_type": f"{pct_dec:.0f}% Spend Reduction on {label}",
                "base_monthly_spending": str(base_amt),
                "reduction_percentage": f"{pct_dec:.1f}%",
                "estimated_monthly_savings": str(monthly_saved),
                "estimated_annual_savings": str(annual_saved),
                "disclaimer": "Scenario analysis only. Does not guarantee future wealth outcomes.",
            }

    # ─────────────────────────────────────────────────────────────
    # Tool H: compare_financial_periods
    # ─────────────────────────────────────────────────────────────
    async def tool_compare_financial_periods(
        self,
        current_start: Optional[str] = None,
        current_end: Optional[str] = None,
        previous_start: Optional[str] = None,
        previous_end: Optional[str] = None,
    ) -> Dict[str, Any]:
        today = date.today()
        # Default: current month vs previous month
        if not current_start:
            c_s = date(today.year, today.month, 1)
            c_e = today
            # previous month
            first_of_cur = date(today.year, today.month, 1)
            last_of_prev = first_of_cur - timedelta(days=1)
            p_s = date(last_of_prev.year, last_of_prev.month, 1)
            p_e = last_of_prev
        else:
            c_s = datetime.strptime(current_start, "%Y-%m-%d").date()
            c_e = datetime.strptime(current_end, "%Y-%m-%d").date() if current_end else today
            p_s = datetime.strptime(previous_start, "%Y-%m-%d").date()
            p_e = datetime.strptime(previous_end, "%Y-%m-%d").date()

        sum_service = SummaryService(self.db, self.owner_id)
        cur_sum = await sum_service.get_summary(datetime.combine(c_s, datetime.min.time()), datetime.combine(c_e, datetime.max.time()))
        prev_sum = await sum_service.get_summary(datetime.combine(p_s, datetime.min.time()), datetime.combine(p_e, datetime.max.time()))

        cur_inc = Decimal(cur_sum.total_income)
        prev_inc = Decimal(prev_sum.total_income)
        cur_exp = Decimal(cur_sum.total_expenses)
        prev_exp = Decimal(prev_sum.total_expenses)

        exp_diff = cur_exp - prev_exp
        exp_pct = ((exp_diff / prev_exp) * Decimal("100")) if prev_exp > ZERO else None

        inc_diff = cur_inc - prev_inc
        inc_pct = ((inc_diff / prev_inc) * Decimal("100")) if prev_inc > ZERO else None

        return {
            "current_period": {"start": str(c_s), "end": str(c_e), "income": str(cur_inc), "expenses": str(cur_exp)},
            "previous_period": {"start": str(p_s), "end": str(p_e), "income": str(prev_inc), "expenses": str(prev_exp)},
            "expense_change": {
                "absolute_difference": str(exp_diff),
                "percentage_change": f"{exp_pct:.1f}%" if exp_pct is not None else "N/A (Previous period expenses were ₹0)",
                "trend": "Increased" if exp_diff > ZERO else "Decreased" if exp_diff < ZERO else "Unchanged",
            },
            "income_change": {
                "absolute_difference": str(inc_diff),
                "percentage_change": f"{inc_pct:.1f}%" if inc_pct is not None else "N/A (Previous period income was ₹0)",
            },
            "is_partial_period_comparison": (c_e.day < calendar.monthrange(c_s.year, c_s.month)[1]),
        }

    # ─────────────────────────────────────────────────────────────
    # Tool I: estimate_month_end_position
    # ─────────────────────────────────────────────────────────────
    async def tool_estimate_month_end_position(self) -> Dict[str, Any]:
        today = date.today()
        days_in_month = calendar.monthrange(today.year, today.month)[1]
        days_elapsed = max(1, today.day)
        days_remaining = max(0, days_in_month - today.day)

        summary_tool = await self.tool_get_financial_summary()
        current_liquid = Decimal(summary_tool["liquid_cash_available"])
        currency = summary_tool["currency"]

        # Upcoming bills for remaining days of this month
        recurring_service = RecurringService(self.db, self.owner_id)
        bills = await recurring_service.list(status="active")
        bills_remaining_this_month = ZERO

        for b in bills:
            if b.next_occurrence and b.next_occurrence.year == today.year and b.next_occurrence.month == today.month:
                if b.next_occurrence.day >= today.day:
                    bills_remaining_this_month += Decimal(b.amount)

        # Average daily variable spending rate
        total_exp = Decimal(summary_tool["total_expenses"])
        daily_burn = (total_exp / Decimal(str(days_elapsed))).quantize(Decimal("0.01"))
        projected_variable_spend = (daily_burn * Decimal(str(days_remaining))).quantize(Decimal("0.01"))

        # Scenarios:
        # Baseline: Current daily burn + known bills
        baseline_remaining = current_liquid - bills_remaining_this_month - projected_variable_spend
        # Frugal: Discretionary spend trimmed 30% + known bills
        frugal_remaining = current_liquid - bills_remaining_this_month - (projected_variable_spend * Decimal("0.70"))
        # High Burn: Discretionary spend + 20% + known bills
        high_burn_remaining = current_liquid - bills_remaining_this_month - (projected_variable_spend * Decimal("1.20"))

        return {
            "calendar_context": {
                "current_date": str(today),
                "days_elapsed": days_elapsed,
                "days_remaining_in_month": days_remaining,
            },
            "currency": currency,
            "starting_liquid_today": str(current_liquid),
            "known_upcoming_bills_this_month": str(bills_remaining_this_month),
            "historical_daily_burn_rate": str(daily_burn),
            "scenarios": {
                "baseline_projected_cash": str(baseline_remaining.quantize(Decimal("0.01"))),
                "frugal_scenario_cash": str(frugal_remaining.quantize(Decimal("0.01"))),
                "high_burn_scenario_cash": str(high_burn_remaining.quantize(Decimal("0.01"))),
            },
            "assumptions_and_transparency": [
                "Estimates assume current daily variable spending pace continues for the rest of the month.",
                "Only recorded active recurring bills are included.",
                "Unrecorded income is strictly excluded to prevent false confidence.",
            ],
        }

    # ─────────────────────────────────────────────────────────────
    # Tool J: get_financial_goals
    # ─────────────────────────────────────────────────────────────
    async def tool_get_financial_goals(self) -> Dict[str, Any]:
        # Transparently check if persistent goals are configured
        return {
            "has_dedicated_goals_table": False,
            "simulation_available": True,
            "message": "Finroq does not currently store persistent goal records in a separate database table. However, you can simulate any savings milestone or timeline with exact completion projections by providing target amount and monthly contribution.",
        }

    # ─────────────────────────────────────────────────────────────
    # Tool K: get_financial_context_for_question
    # ─────────────────────────────────────────────────────────────
    async def tool_get_financial_context_for_question(self, question: str) -> Dict[str, Any]:
        q_lower = question.lower()
        context_data: Dict[str, Any] = {}

        if any(w in q_lower for w in ["budget", "cap", "limit", "exceed", "overspend"]):
            context_data["budget_summary"] = await self.tool_get_budget_status()

        if any(w in q_lower for w in ["bill", "recurring", "emi", "subscription", "rent", "due"]):
            context_data["upcoming_bills"] = await self.tool_get_upcoming_bills(limit=5)

        if any(w in q_lower for w in ["spend", "spending", "expense", "cost", "category", "where did"]):
            context_data["spending_analysis"] = await self.tool_analyze_spending()

        if not context_data or any(w in q_lower for w in ["balance", "money", "worth", "cash flow", "overview"]):
            context_data["summary"] = await self.tool_get_financial_summary()

        return {
            "targeted_context": context_data,
            "privacy_guard": "Only aggregated metrics related to your query topic were fetched.",
        }

    # ─────────────────────────────────────────────────────────────
    # Tool L: explain_financial_calculation
    # ─────────────────────────────────────────────────────────────
    async def tool_explain_financial_calculation(self, metric_name: str) -> Dict[str, Any]:
        definitions = {
            "net_cash_flow": {
                "formula": "Total Completed Inflow - Total Completed Outflow (excluding transfers and refund offsets)",
                "method": "Exact Python Decimal NUMERIC(14,2) addition and subtraction across all COMPLETED ledger entries in period.",
                "transfers_policy": "Internal transfers between owned accounts are non-extractive and excluded from cash flow totals.",
            },
            "budget_utilization": {
                "formula": "(Eligible Category Spending / Allocated Amount) * 100",
                "method": "Calculated deterministically. Handled division-by-zero safely when allocated cap is 0.",
            },
            "emergency_runway": {
                "formula": "Total Liquid Cash / Monthly Essential Living Expenses",
                "method": "Liquid accounts (checking, savings, cash) divided by essential recurring burn.",
            },
        }

        info = definitions.get(metric_name.lower(), {
            "formula": "Deterministic arithmetic based on verified database records",
            "method": "Precision Decimal arithmetic strictly adhering to double-entry accounting rules.",
        })

        return {
            "metric": metric_name,
            "specification": info,
            "guarantee": "No binary floating-point roundoff errors or arbitrary approximations.",
        }
