from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Set, Tuple
import re
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    User,
    Account,
    Transaction,
    Category,
    Budget,
    RecurringTransaction,
    TransactionType,
    TransactionStatus,
    CategoryType,
)
from app.features.readiness.schemas import (
    ReadinessTier,
    InsightType,
    InsightStatus,
    AccountCoverageItem,
    MissingPeriodGap,
    SupportingTransaction,
    DataReadinessReport,
    SpendLeakInsight,
    SpendLeakAnalysisResponse,
)


ZERO = Decimal("0.00")


def _clean_merchant_name(desc: Optional[str]) -> str:
    if not desc:
        return "Unknown Merchant"
    # Remove common transaction noise like dates, IDs, POS refs, UPI handles
    cleaned = desc.strip()
    cleaned = re.sub(r"(?i)\b(pos|upi|neft|rtgs|imps|ach|txn|ref|id|card|direct debit|bill payment)\b", "", cleaned)
    cleaned = re.sub(r"[\d\-_/\\#@:]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned if len(cleaned) >= 3 else desc.strip()


class ReadinessService:
    def __init__(self, db: AsyncSession, owner_id: str):
        self.db = db
        self.owner_id = owner_id

    async def _get_user(self) -> Optional[User]:
        # If owner_id is an integer string, fetch by id; else fetch by email or first user
        try:
            uid = int(self.owner_id)
            user = await self.db.get(User, uid)
            if user:
                return user
        except ValueError:
            pass
        
        result = await self.db.execute(select(User).where(User.email == self.owner_id))
        user = result.scalar_one_or_none()
        if user:
            return user
        
        # Fallback to first user in db if owner_id is string identifier
        res = await self.db.execute(select(User).limit(1))
        return res.scalar_one_or_none()

    async def get_readiness_report(self) -> DataReadinessReport:
        user = await self._get_user()
        now = datetime.utcnow()
        account_age_days = (now.date() - user.created_at.date()).days if user and user.created_at else 0
        account_age_days = max(0, account_age_days)

        # Accounts
        acc_result = await self.db.execute(
            select(Account).where(Account.owner_id == self.owner_id)
        )
        all_accounts = list(acc_result.scalars().all())
        active_accounts = [a for a in all_accounts if a.is_active]
        inactive_accounts = [a for a in all_accounts if not a.is_active]

        # Eligible Transactions (completed only, owned by user)
        tx_query = select(Transaction).where(
            and_(
                Transaction.owner_id == self.owner_id,
                Transaction.status == TransactionStatus.COMPLETED,
            )
        ).order_by(Transaction.transaction_date.asc())
        tx_result = await self.db.execute(tx_query)
        eligible_txns = list(tx_result.scalars().all())

        total_eligible = len(eligible_txns)
        manual_count = sum(1 for t in eligible_txns if getattr(t, "source", "manual") == "manual")
        imported_count = sum(1 for t in eligible_txns if getattr(t, "source", "manual") == "statement_import")
        seed_count = sum(1 for t in eligible_txns if getattr(t, "source", "manual") == "seed_demo")
        provider_count = sum(1 for t in eligible_txns if getattr(t, "source", "manual") == "provider_sync")

        is_demo = False
        if user and user.email == "demo@finroq.com":
            is_demo = True
        elif total_eligible > 0 and seed_count == total_eligible:
            is_demo = True

        # Account coverage items
        tx_by_account: Dict[int, List[Transaction]] = {}
        for t in eligible_txns:
            tx_by_account.setdefault(t.account_id, []).append(t)

        accounts_included: List[AccountCoverageItem] = []
        for a in active_accounts:
            a_txs = tx_by_account.get(a.id, [])
            earliest_a = min((t.transaction_date for t in a_txs), default=None)
            latest_a = max((t.transaction_date for t in a_txs), default=None)
            accounts_included.append(
                AccountCoverageItem(
                    account_id=a.id,
                    account_name=a.name,
                    account_type=a.account_type.value if hasattr(a.account_type, "value") else str(a.account_type),
                    currency=a.currency,
                    is_active=True,
                    transaction_count=len(a_txs),
                    earliest_transaction_date=earliest_a,
                    latest_transaction_date=latest_a,
                )
            )

        accounts_excluded: List[AccountCoverageItem] = []
        for a in inactive_accounts:
            a_txs = tx_by_account.get(a.id, [])
            earliest_a = min((t.transaction_date for t in a_txs), default=None)
            latest_a = max((t.transaction_date for t in a_txs), default=None)
            accounts_excluded.append(
                AccountCoverageItem(
                    account_id=a.id,
                    account_name=a.name,
                    account_type=a.account_type.value if hasattr(a.account_type, "value") else str(a.account_type),
                    currency=a.currency,
                    is_active=False,
                    transaction_count=len(a_txs),
                    earliest_transaction_date=earliest_a,
                    latest_transaction_date=latest_a,
                )
            )

        # Empty data handling
        if total_eligible == 0:
            return DataReadinessReport(
                account_age_days=account_age_days,
                available_history_days=0,
                observed_active_days=0,
                calendar_days_in_window=0,
                earliest_transaction_date=None,
                latest_transaction_date=None,
                data_freshness_days=None,
                manual_transactions_count=0,
                imported_transactions_count=0,
                seed_transactions_count=0,
                provider_sync_transactions_count=0,
                total_eligible_transactions=0,
                verified_coverage_status="no_history",
                verified_coverage_notes="No eligible completed transactions exist in FINROQ for this account.",
                statement_coverage_start=None,
                statement_coverage_end=None,
                provider_sync_start=None,
                provider_last_sync=None,
                is_synthetic_demo_data=is_demo,
                accounts_included=accounts_included,
                accounts_excluded=accounts_excluded,
                missing_periods=[],
                readiness_tier=ReadinessTier.LIMITED_EVIDENCE,
                readiness_headline="No Transaction History Available",
                readiness_explanation="The detector requires actual transaction activity before evaluating recurring plans or potential spend leaks.",
                recommended_action="Add transactions manually or import a bank statement CSV to enable spend leak analysis.",
            )

        # Dates & Activity
        earliest_dt = eligible_txns[0].transaction_date
        latest_dt = max(t.transaction_date for t in eligible_txns)
        available_history_days = max(1, (latest_dt.date() - earliest_dt.date()).days + 1)
        
        distinct_dates = set(t.transaction_date.date() for t in eligible_txns)
        observed_active_days = len(distinct_dates)
        data_freshness_days = max(0, (now.date() - latest_dt.date()).days)

        # Missing periods / gaps > 45 days
        sorted_dates = sorted(list(distinct_dates))
        missing_periods: List[MissingPeriodGap] = []
        for i in range(len(sorted_dates) - 1):
            d1 = sorted_dates[i]
            d2 = sorted_dates[i + 1]
            gap = (d2 - d1).days
            if gap > 45:
                missing_periods.append(
                    MissingPeriodGap(
                        start_date=datetime.combine(d1, datetime.min.time()),
                        end_date=datetime.combine(d2, datetime.min.time()),
                        gap_days=gap,
                        description=f"Coverage gap of {gap} consecutive days with no recorded transactions between {d1.strftime('%b %d, %Y')} and {d2.strftime('%b %d, %Y')}.",
                    )
                )

        # Statement coverage
        stmt_txs = [t for t in eligible_txns if getattr(t, "source", "manual") == "statement_import"]
        statement_start = min((t.transaction_date for t in stmt_txs), default=None)
        statement_end = max((t.transaction_date for t in stmt_txs), default=None)

        if imported_count > 0:
            verified_coverage_status = "verified_statement"
            verified_coverage_notes = (
                f"Imported statement coverage: {statement_start.strftime('%Y-%m-%d')} to {statement_end.strftime('%Y-%m-%d')} "
                f"({imported_count} records). Note: statement completeness is bounded to the imported file."
            )
        else:
            verified_coverage_status = "unverified_self_reported"
            verified_coverage_notes = "Data comprises manually recorded or seed transactions without automated provider synchronization."

        # Readiness Tier evaluation
        if available_history_days < 7:
            readiness_tier = ReadinessTier.LIMITED_EVIDENCE
            readiness_headline = "Limited Evidence (< 7 Days History)"
            readiness_explanation = (
                f"History spans {available_history_days} calendar days with {observed_active_days} active days. "
                "Recurring subscription cadences cannot be statistically confirmed."
            )
            recommended_action = "Import at least 30 to 90 days of account statements to establish recurring spending baselines."
        elif available_history_days < 30:
            readiness_tier = ReadinessTier.PRELIMINARY
            readiness_headline = "Preliminary Observations (7–29 Days History)"
            readiness_explanation = (
                f"History spans {available_history_days} calendar days with {observed_active_days} active days. "
                "High-frequency recurring charges can be tentatively flagged, but monthly cadences remain unverified."
            )
            recommended_action = "Import statement history covering earlier months to unlock provisional trend confidence."
        elif available_history_days < 90:
            readiness_tier = ReadinessTier.PROVISIONAL
            readiness_headline = "Provisional Trends (30–89 Days History)"
            readiness_explanation = (
                f"History spans {available_history_days} calendar days with {observed_active_days} active days. "
                "Monthly recurring plans and category variances can be identified with provisional confidence."
            )
            recommended_action = "Extend history past 90 days to verify seasonal and annual spending stability."
        else:
            readiness_tier = ReadinessTier.SUFFICIENTLY_SUPPORTED
            readiness_headline = "Sufficient Historical Coverage (90+ Days)"
            readiness_explanation = (
                f"History spans {available_history_days} calendar days with {observed_active_days} active days. "
                "Robust historical baseline available for recurring pattern detection and comparative analysis."
            )
            recommended_action = "Keep coverage current by importing fresh monthly statements."

        return DataReadinessReport(
            account_age_days=account_age_days,
            available_history_days=available_history_days,
            observed_active_days=observed_active_days,
            calendar_days_in_window=available_history_days,
            earliest_transaction_date=earliest_dt,
            latest_transaction_date=latest_dt,
            data_freshness_days=data_freshness_days,
            manual_transactions_count=manual_count,
            imported_transactions_count=imported_count,
            seed_transactions_count=seed_count,
            provider_sync_transactions_count=provider_count,
            total_eligible_transactions=total_eligible,
            verified_coverage_status=verified_coverage_status,
            verified_coverage_notes=verified_coverage_notes,
            statement_coverage_start=statement_start,
            statement_coverage_end=statement_end,
            provider_sync_start=None,
            provider_last_sync=None,
            is_synthetic_demo_data=is_demo,
            accounts_included=accounts_included,
            accounts_excluded=accounts_excluded,
            missing_periods=missing_periods,
            readiness_tier=readiness_tier,
            readiness_headline=readiness_headline,
            readiness_explanation=readiness_explanation,
            recommended_action=recommended_action,
        )

    async def detect_leaks(self) -> SpendLeakAnalysisResponse:
        report = await self.get_readiness_report()
        insights: List[SpendLeakInsight] = []

        # If 0 transactions, return clean report with 0 leaks
        if report.total_eligible_transactions == 0:
            return SpendLeakAnalysisResponse(
                readiness=report,
                insights=[],
                total_monthly_leak=ZERO,
                total_annual_leak=ZERO,
                recoverable_monthly_estimate=ZERO,
                recoverable_annual_estimate=ZERO,
                disclaimer="No financial transactions available to analyze. Connect or import statements to discover spending leaks. Potential savings are uncommitted estimates and not guaranteed money recovered.",
            )

        # Get expense transactions only, excluding transfers and refunds
        expense_query = select(Transaction).where(
            and_(
                Transaction.owner_id == self.owner_id,
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.transaction_type == TransactionType.EXPENSE,
                Transaction.related_transaction_id.is_(None),  # Not a refund
            )
        ).order_by(Transaction.transaction_date.asc())
        expense_result = await self.db.execute(expense_query)
        expense_txns = list(expense_result.scalars().all())

        # -------------------------------------------------------------
        # Insight Type 1: Annual Subscription Observation Window Limitation
        # Requirement: "Annual subscription detection requires an appropriate observation window or other explicit evidence.
        # If sufficient history is unavailable, state that the detector cannot yet assess annual recurrence reliably."
        # -------------------------------------------------------------
        if report.available_history_days < 365:
            insights.append(
                SpendLeakInsight(
                    id="limit-annual-subscription-coverage",
                    insight_type=InsightType.ANNUAL_SUBSCRIPTION_EVALUATION,
                    status=InsightStatus.INSUFFICIENT_EVIDENCE,
                    title="Annual Subscriptions Cannot Be Reliably Assessed",
                    description=(
                        f"Current available history covers {report.available_history_days} calendar days. "
                        "Assessing annual memberships (e.g. yearly software, insurance premiums, domain renewals) "
                        "requires an observation window of at least 365 days."
                    ),
                    severity="low",
                    analysis_start_date=report.earliest_transaction_date,
                    analysis_end_date=report.latest_transaction_date,
                    relevant_transaction_count=report.total_eligible_transactions,
                    supporting_transactions=[],
                    evidence_summary=f"Observation window is {report.available_history_days} days (minimum required: 365 days).",
                    calculation_method="Annual window comparison against 365-day statutory threshold.",
                    assumptions="Annual recurrence assumes 12-month billing cadence.",
                    limitations="Detector suppresses speculative annual leak flags until sufficient annual history is established.",
                    recommended_action="Import statements covering the prior 12 months to audit yearly recurring commitments.",
                    potential_monthly_savings=ZERO,
                    projected_annual_savings=ZERO,
                    is_savings_projected=False,
                )
            )

        # -------------------------------------------------------------
        # Insight Type 2: Recurring Subscriptions & Dormant Plans
        # Requirement:
        # - Look for repeated transactions using merchant identity, description, amount tolerance, dates.
        # - Do not label a payment as a confirmed subscription based on one transaction.
        # - Distinguish detected recurring patterns from confirmed subscriptions.
        # -------------------------------------------------------------
        # Fetch confirmed recurring transactions in db to distinguish
        rec_res = await self.db.execute(
            select(RecurringTransaction).where(RecurringTransaction.owner_id == self.owner_id)
        )
        confirmed_recs = list(rec_res.scalars().all())

        # Group expense transactions by merchant/service name
        merchant_groups: Dict[str, List[Transaction]] = {}
        for t in expense_txns:
            name = _clean_merchant_name(t.description)
            merchant_groups.setdefault(name.lower(), []).append(t)

        now = datetime.utcnow()
        for m_key, txs in merchant_groups.items():
            txs_sorted = sorted(txs, key=lambda x: x.transaction_date)
            n_txs = len(txs_sorted)
            display_name = txs_sorted[-1].description or m_key.title()

            # SINGLE TRANSACTION: Must NEVER be treated as a confirmed subscription!
            if n_txs == 1:
                # If amount > 100 or common subscription keyword, flag strictly as INSUFFICIENT EVIDENCE
                is_sub_keyword = any(kw in (txs_sorted[0].description or "").lower() for kw in ["netflix", "spotify", "gym", "prime", "adobe", "cloud", "membership", "sub"])
                if is_sub_keyword:
                    insights.append(
                        SpendLeakInsight(
                            id=f"single-candidate-{txs_sorted[0].id}",
                            insight_type=InsightType.RECURRING_SUBSCRIPTION,
                            status=InsightStatus.INSUFFICIENT_EVIDENCE,
                            title=f"Potential Recurring Charge Unconfirmed: {display_name}",
                            description=(
                                f"Single payment of {txs_sorted[0].amount} observed on {txs_sorted[0].transaction_date.strftime('%b %d, %Y')}. "
                                "A single isolated payment cannot confirm an ongoing subscription without subsequent billing evidence."
                            ),
                            severity="low",
                            analysis_start_date=txs_sorted[0].transaction_date,
                            analysis_end_date=txs_sorted[0].transaction_date,
                            relevant_transaction_count=1,
                            supporting_transactions=[
                                SupportingTransaction(
                                    id=txs_sorted[0].id,
                                    transaction_date=txs_sorted[0].transaction_date,
                                    amount=txs_sorted[0].amount,
                                    description=txs_sorted[0].description,
                                    source=getattr(txs_sorted[0], "source", "manual"),
                                )
                            ],
                            evidence_summary=f"1 payment of {txs_sorted[0].amount} recorded. Insufficient repetitions to confirm cadence.",
                            calculation_method="Singular transaction observation; recurrence hypothesis rejected until repetition observed.",
                            assumptions="Requires at least 2 distinct billing cycles to establish cadence.",
                            limitations="Cannot determine whether transaction was a one-time purchase or recurring mandate.",
                            recommended_action="Wait for next billing cycle or check statement to confirm recurrence.",
                            potential_monthly_savings=ZERO,
                            projected_annual_savings=ZERO,
                            is_savings_projected=False,
                        )
                    )
                continue

            # MULTIPLE TRANSACTIONS (N >= 2): Check intervals and amounts
            amounts = [t.amount for t in txs_sorted]
            avg_amount = sum(amounts) / Decimal(n_txs)
            amount_variance_max = max(abs(a - avg_amount) for a in amounts)
            is_amount_consistent = (amount_variance_max / avg_amount) <= Decimal("0.10")  # ±10% tolerance

            # Compute intervals in days between consecutive transactions
            intervals = [
                (txs_sorted[i+1].transaction_date.date() - txs_sorted[i].transaction_date.date()).days
                for i in range(n_txs - 1)
            ]
            median_interval = sorted(intervals)[len(intervals) // 2] if intervals else 0

            # Detect cadence: monthly (~25-35 days), weekly (~6-9 days), or daily (~1-2 days)
            is_monthly = 24 <= median_interval <= 36
            is_weekly = 5 <= median_interval <= 10
            is_daily = 1 <= median_interval <= 2

            if (is_monthly or is_weekly) and is_amount_consistent:
                latest_amount = txs_sorted[-1].amount
                latest_date = txs_sorted[-1].transaction_date
                days_since_latest = (now.date() - latest_date.date()).days

                # Determine monthly cost
                monthly_cost = latest_amount if is_monthly else (latest_amount * Decimal("4.33"))
                annual_cost = monthly_cost * Decimal("12.00")

                # Check if this matches a confirmed user subscription
                is_user_confirmed = any(
                    (cr.description or "").lower() in display_name.lower() or display_name.lower() in (cr.description or "").lower()
                    for cr in confirmed_recs
                )

                # Confidence tier
                if report.readiness_tier == ReadinessTier.LIMITED_EVIDENCE:
                    status = InsightStatus.PRELIMINARY
                elif report.readiness_tier == ReadinessTier.PRELIMINARY:
                    status = InsightStatus.PRELIMINARY
                elif report.readiness_tier == ReadinessTier.PROVISIONAL:
                    status = InsightStatus.PROVISIONAL if n_txs < 3 else InsightStatus.SUFFICIENTLY_SUPPORTED
                else:
                    status = InsightStatus.SUFFICIENTLY_SUPPORTED if n_txs >= 3 else InsightStatus.PROVISIONAL

                # Check dormancy: if monthly plan has had no activity for > 45 days, or user hasn't recorded new charge
                is_dormant = days_since_latest > 45

                support_items = [
                    SupportingTransaction(
                        id=t.id,
                        transaction_date=t.transaction_date,
                        amount=t.amount,
                        description=t.description,
                        source=getattr(t, "source", "manual"),
                    )
                    for t in txs_sorted[-5:]  # last 5 txs
                ]

                cadence_label = "Monthly" if is_monthly else "Weekly"
                sub_type = InsightType.DORMANT_RECURRING if is_dormant else InsightType.RECURRING_SUBSCRIPTION
                title_prefix = "[Dormant Mandate]" if is_dormant else ("[Pattern Detected]" if not is_user_confirmed else "[Confirmed Subscription]")

                insights.append(
                    SpendLeakInsight(
                        id=f"recurring-{txs_sorted[-1].id}",
                        insight_type=sub_type,
                        status=status,
                        title=f"{title_prefix} {display_name}",
                        description=(
                            f"Detected {n_txs} recurring {cadence_label.lower()} charges averaging {round(avg_amount, 2)}. "
                            + (f"No activity for {days_since_latest} days; potential dormant leak." if is_dormant else "Active recurring outflow.")
                        ),
                        severity="high" if is_dormant or monthly_cost > Decimal("1000") else "medium",
                        analysis_start_date=txs_sorted[0].transaction_date,
                        analysis_end_date=latest_date,
                        relevant_transaction_count=n_txs,
                        supporting_transactions=support_items,
                        evidence_summary=(
                            f"{n_txs} charges observed with median interval of {median_interval} days "
                            f"(amount variance ±{round(amount_variance_max, 2)}). First seen {txs_sorted[0].transaction_date.strftime('%b %d, %Y')}, "
                            f"latest seen {latest_date.strftime('%b %d, %Y')}."
                        ),
                        calculation_method=f"Cadence frequency analysis ({cadence_label}) with ±10% amount clustering.",
                        assumptions=(
                            f"Assumes ongoing {cadence_label.lower()} charge of {round(monthly_cost, 2)}/month. "
                            "Projected savings assume plan cancellation without early termination penalties."
                        ),
                        limitations=(
                            "Analysis based on transaction records only. Does not inspect third-party app login activity."
                        ),
                        recommended_action=(
                            f"Review active status with {display_name} and cancel if no longer providing value."
                        ),
                        potential_monthly_savings=round(monthly_cost, 2),
                        projected_annual_savings=round(annual_cost, 2),
                        is_savings_projected=True,
                    )
                )

        # -------------------------------------------------------------
        # Insight Type 3: Duplicate Same-Day Charges (Leakage)
        # Requirement: Identify underlying transactions and explain why flagged.
        # -------------------------------------------------------------
        date_amount_map: Dict[Tuple[date, Decimal, str], List[Transaction]] = {}
        for t in expense_txns:
            m_name = _clean_merchant_name(t.description).lower()
            key = (t.transaction_date.date(), t.amount, m_name)
            date_amount_map.setdefault(key, []).append(t)

        for (tx_date, tx_amount, m_name), dup_txs in date_amount_map.items():
            if len(dup_txs) >= 2:
                # Duplicate charge on same day!
                insights.append(
                    SpendLeakInsight(
                        id=f"dup-{dup_txs[0].id}-{dup_txs[1].id}",
                        insight_type=InsightType.DUPLICATE_CHARGE_LEAKAGE,
                        status=InsightStatus.SUFFICIENTLY_SUPPORTED,
                        title=f"Potential Duplicate Billing: {dup_txs[0].description}",
                        description=(
                            f"{len(dup_txs)} identical charges of {tx_amount} recorded on {tx_date.strftime('%b %d, %Y')}. "
                            "May represent an accidental double-swipe or duplicate POS authorization."
                        ),
                        severity="high",
                        analysis_start_date=dup_txs[0].transaction_date,
                        analysis_end_date=dup_txs[-1].transaction_date,
                        relevant_transaction_count=len(dup_txs),
                        supporting_transactions=[
                            SupportingTransaction(
                                id=t.id,
                                transaction_date=t.transaction_date,
                                amount=t.amount,
                                description=t.description,
                                source=getattr(t, "source", "manual"),
                            )
                            for t in dup_txs
                        ],
                        evidence_summary=f"{len(dup_txs)} identical transactions of {tx_amount} on {tx_date.strftime('%Y-%m-%d')}.",
                        calculation_method="Exact match on date, amount, and merchant descriptor.",
                        assumptions="Assumes one charge was legitimate and remaining charges were unintentional duplicates.",
                        limitations="Some services legitimately bill multiple times in one day if multiple orders were placed.",
                        recommended_action="Check merchant receipt or request dispute/chargeback for accidental double debit.",
                        potential_monthly_savings=round(tx_amount * (len(dup_txs) - 1), 2),
                        projected_annual_savings=round(tx_amount * (len(dup_txs) - 1), 2),
                        is_savings_projected=False,  # One-time recovered expense
                    )
                )

        # -------------------------------------------------------------
        # Insight Type 4: Excessive Category Spending
        # Requirement:
        # - Show observed spending, date range, transaction count, comparison baseline.
        # - Do not claim category is unusually expensive without baseline, valid category data, and sufficient evidence.
        # -------------------------------------------------------------
        if report.available_history_days >= 30:
            # Check monthly budgets
            curr_year = now.year
            curr_month = now.month
            budget_res = await self.db.execute(
                select(Budget).where(
                    and_(
                        Budget.owner_id == self.owner_id,
                        Budget.budget_year == curr_year,
                        Budget.budget_month == curr_month,
                    )
                )
            )
            budgets = list(budget_res.scalars().all())

            # Category spending this month
            start_of_month = datetime(curr_year, curr_month, 1)
            cat_totals: Dict[int, Decimal] = {}
            cat_counts: Dict[int, int] = {}
            for t in expense_txns:
                if t.transaction_date >= start_of_month and t.category_id:
                    cat_totals[t.category_id] = cat_totals.get(t.category_id, ZERO) + t.amount
                    cat_counts[t.category_id] = cat_counts.get(t.category_id, 0) + 1

            for b in budgets:
                cat_spend = cat_totals.get(b.category_id, ZERO)
                count = cat_counts.get(b.category_id, 0)
                if cat_spend > b.allocated_amount and b.allocated_amount > ZERO and count >= 2:
                    over_amount = cat_spend - b.allocated_amount
                    pct_over = round(((cat_spend - b.allocated_amount) / b.allocated_amount) * Decimal("100"), 1)
                    cat_obj = await self.db.get(Category, b.category_id)
                    cat_name = cat_obj.name if cat_obj else f"Category #{b.category_id}"

                    insights.append(
                        SpendLeakInsight(
                            id=f"excess-cat-{b.category_id}",
                            insight_type=InsightType.EXCESSIVE_CATEGORY_SPEND,
                            status=InsightStatus.SUFFICIENTLY_SUPPORTED if report.available_history_days >= 90 else InsightStatus.PROVISIONAL,
                            title=f"Budget Overrun Baseline: {cat_name}",
                            description=(
                                f"Observed spending of {cat_spend} exceeds allocated monthly budget baseline of {b.allocated_amount} "
                                f"by {over_amount} ({pct_over}% overrun)."
                            ),
                            severity="medium",
                            analysis_start_date=start_of_month,
                            analysis_end_date=now,
                            relevant_transaction_count=count,
                            supporting_transactions=[],
                            evidence_summary=f"{count} transactions totaling {cat_spend} vs allocated baseline of {b.allocated_amount}.",
                            calculation_method="Comparison of actual eligible category debits against explicit user budget target.",
                            assumptions="Assumes allocated budget is current monthly spend ceiling.",
                            limitations="Overrun may represent scheduled one-time expenses or emergency outlays.",
                            recommended_action=f"Trim discretionary allocations in {cat_name} to return within allocated ceiling.",
                            potential_monthly_savings=round(over_amount, 2),
                            projected_annual_savings=round(over_amount * Decimal("12.00"), 2),
                            is_savings_projected=True,
                        )
                    )

        # Totals
        total_monthly_leak = sum(i.potential_monthly_savings for i in insights if i.insight_type in [InsightType.RECURRING_SUBSCRIPTION, InsightType.DORMANT_RECURRING])
        total_annual_leak = sum(i.projected_annual_savings for i in insights if i.insight_type in [InsightType.RECURRING_SUBSCRIPTION, InsightType.DORMANT_RECURRING])
        recoverable_monthly = total_monthly_leak
        recoverable_annual = total_annual_leak

        return SpendLeakAnalysisResponse(
            readiness=report,
            insights=insights,
            total_monthly_leak=round(total_monthly_leak, 2),
            total_annual_leak=round(total_annual_leak, 2),
            recoverable_monthly_estimate=round(recoverable_monthly, 2),
            recoverable_annual_estimate=round(recoverable_annual, 2),
            disclaimer="All savings figures are uncommitted mathematical projections based on recurring plan interception. Actual realized savings depend on confirmed merchant cancellation and avoidance of replacement expenditures.",
        )
