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
    SpendLeakFindingRecord,
)
from app.features.readiness.schemas import (
    ReadinessTier,
    InsightType,
    InsightStatus,
    FindingLifecycleStatus,
    AccountCoverageItem,
    MissingPeriodGap,
    SupportingTransaction,
    DataReadinessReport,
    SpendLeakInsight,
    SpendLeakSummaryStats,
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
        self.owner_id = str(owner_id)

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
        now = datetime.utcnow()

        # If 0 transactions, return clean report with 0 leaks
        if report.total_eligible_transactions == 0:
            return SpendLeakAnalysisResponse(
                readiness=report,
                insights=[],
                total_monthly_leak=ZERO,
                total_annual_leak=ZERO,
                recoverable_monthly_estimate=ZERO,
                recoverable_annual_estimate=ZERO,
                summary_stats=SpendLeakSummaryStats(),
                disclaimer="No financial transactions available to analyze. Connect or import statements to discover spending leaks. Potential savings are uncommitted estimates and not guaranteed money recovered.",
            )

        # Load existing persistent review records for user to preserve lifecycle decisions
        existing_records_res = await self.db.execute(
            select(SpendLeakFindingRecord).where(SpendLeakFindingRecord.owner_id == self.owner_id)
        )
        stored_records = {r.finding_key: r for r in existing_records_res.scalars().all()}

        # Fetch expense transactions only, excluding transfers and refunds
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
        # Insight Type: Annual Subscription Observation Window Limitation
        # -------------------------------------------------------------
        if report.available_history_days < 365:
            annual_key = "limit-annual-subscription-coverage"
            existing_annual = stored_records.get(annual_key)
            lifecycle = FindingLifecycleStatus(existing_annual.status) if existing_annual else FindingLifecycleStatus.NEW

            insights.append(
                SpendLeakInsight(
                    id=annual_key,
                    insight_type=InsightType.ANNUAL_SUBSCRIPTION_EVALUATION,
                    status=InsightStatus.INSUFFICIENT_EVIDENCE,
                    lifecycle_status=lifecycle,
                    user_notes=existing_annual.user_notes if existing_annual else None,
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
        # Fetch confirmed recurring transactions in db to cross-check
        # -------------------------------------------------------------
        rec_res = await self.db.execute(
            select(RecurringTransaction).where(RecurringTransaction.owner_id == self.owner_id)
        )
        confirmed_recs = list(rec_res.scalars().all())

        # Currency isolation: group expense transactions by currency first!
        currency_groups: Dict[str, List[Transaction]] = {}
        for t in expense_txns:
            cur = (t.currency or "INR").upper()
            currency_groups.setdefault(cur, []).append(t)

        for cur, cur_txns in currency_groups.items():
            merchant_groups: Dict[str, List[Transaction]] = {}
            for t in cur_txns:
                name = _clean_merchant_name(t.description)
                merchant_groups.setdefault(name.lower(), []).append(t)

            for m_key, txs in merchant_groups.items():
                txs_sorted = sorted(txs, key=lambda x: x.transaction_date)
                n_txs = len(txs_sorted)
                display_name = txs_sorted[-1].description or m_key.title()

                # SINGLE TRANSACTION: Must NEVER be treated as a confirmed subscription!
                if n_txs == 1:
                    is_sub_keyword = any(
                        kw in (txs_sorted[0].description or "").lower()
                        for kw in ["netflix", "spotify", "gym", "prime", "adobe", "cloud", "membership", "sub"]
                    )
                    if is_sub_keyword:
                        single_key = f"single-candidate-{txs_sorted[0].id}"
                        stored = stored_records.get(single_key)
                        lifecycle = FindingLifecycleStatus(stored.status) if stored else FindingLifecycleStatus.NEW

                        insights.append(
                            SpendLeakInsight(
                                id=single_key,
                                insight_type=InsightType.RECURRING_SUBSCRIPTION,
                                status=InsightStatus.INSUFFICIENT_EVIDENCE,
                                lifecycle_status=lifecycle,
                                user_notes=stored.user_notes if stored else None,
                                currency=cur,
                                title=f"Potential Recurring Charge Unconfirmed: {display_name}",
                                description=(
                                    f"Single payment of {txs_sorted[0].amount} {cur} observed on {txs_sorted[0].transaction_date.strftime('%b %d, %Y')}. "
                                    "A single isolated payment cannot confirm an ongoing subscription without subsequent billing evidence."
                                ),
                                severity="low",
                                analysis_start_date=txs_sorted[0].transaction_date,
                                analysis_end_date=txs_sorted[0].transaction_date,
                                first_observed_date=txs_sorted[0].transaction_date,
                                last_observed_date=txs_sorted[0].transaction_date,
                                relevant_transaction_count=1,
                                supporting_transactions=[
                                    SupportingTransaction(
                                        id=txs_sorted[0].id,
                                        transaction_date=txs_sorted[0].transaction_date,
                                        amount=txs_sorted[0].amount,
                                        currency=cur,
                                        description=txs_sorted[0].description,
                                        source=getattr(txs_sorted[0], "source", "manual"),
                                    )
                                ],
                                evidence_summary=f"1 payment of {txs_sorted[0].amount} {cur} recorded. Insufficient repetitions to confirm cadence.",
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

                # MULTIPLE TRANSACTIONS (N >= 2): Cadence and Intervals
                intervals = [
                    (txs_sorted[i+1].transaction_date.date() - txs_sorted[i].transaction_date.date()).days
                    for i in range(n_txs - 1)
                ]
                median_interval = sorted(intervals)[len(intervals) // 2] if intervals else 0

                is_weekly = 5 <= median_interval <= 10
                is_monthly = 24 <= median_interval <= 36
                is_quarterly = 80 <= median_interval <= 105
                is_annual = 340 <= median_interval <= 390

                # Amounts
                amounts = [t.amount for t in txs_sorted]
                avg_amount = sum(amounts) / Decimal(n_txs)
                latest_amount = txs_sorted[-1].amount
                latest_date = txs_sorted[-1].transaction_date
                earliest_date = txs_sorted[0].transaction_date
                days_since_latest = (now.date() - latest_date.date()).days

                # -------------------------------------------------------------
                # Detection 2A: Recurring Subscriptions & Dormancy
                # -------------------------------------------------------------
                if is_weekly or is_monthly or is_quarterly or is_annual:
                    if is_weekly:
                        cadence_label = "Weekly"
                        monthly_cost = latest_amount * Decimal("4.33")
                        dormancy_threshold = 21
                    elif is_monthly:
                        cadence_label = "Monthly"
                        monthly_cost = latest_amount
                        dormancy_threshold = 45
                    elif is_quarterly:
                        cadence_label = "Quarterly"
                        monthly_cost = round(latest_amount / Decimal("3.00"), 2)
                        dormancy_threshold = 120
                    else:
                        cadence_label = "Annual"
                        monthly_cost = round(latest_amount / Decimal("12.00"), 2)
                        dormancy_threshold = 400

                    annual_cost = round(monthly_cost * Decimal("12.00"), 2)

                    # Confidence tier based on observations and history
                    if report.readiness_tier in [ReadinessTier.LIMITED_EVIDENCE, ReadinessTier.PRELIMINARY]:
                        status = InsightStatus.PRELIMINARY
                    elif report.readiness_tier == ReadinessTier.PROVISIONAL:
                        status = InsightStatus.PROVISIONAL if n_txs < 3 else InsightStatus.SUFFICIENTLY_SUPPORTED
                    else:
                        status = InsightStatus.SUFFICIENTLY_SUPPORTED if n_txs >= 3 else InsightStatus.PROVISIONAL

                    is_user_confirmed = any(
                        (cr.description or "").lower() in display_name.lower() or display_name.lower() in (cr.description or "").lower()
                        for cr in confirmed_recs
                    )

                    is_dormant = days_since_latest > dormancy_threshold
                    sub_type = InsightType.DORMANT_RECURRING if is_dormant else InsightType.RECURRING_SUBSCRIPTION
                    title_prefix = "[Dormant Mandate]" if is_dormant else ("[Pattern Detected]" if not is_user_confirmed else "[Confirmed Subscription]")

                    rec_key = f"recurring-{txs_sorted[-1].id}"
                    stored = stored_records.get(rec_key)
                    lifecycle = FindingLifecycleStatus(stored.status) if stored else FindingLifecycleStatus.NEW

                    support_items = [
                        SupportingTransaction(
                            id=t.id,
                            transaction_date=t.transaction_date,
                            amount=t.amount,
                            currency=cur,
                            description=t.description,
                            source=getattr(t, "source", "manual"),
                        )
                        for t in txs_sorted[-5:]
                    ]

                    insights.append(
                        SpendLeakInsight(
                            id=rec_key,
                            insight_type=sub_type,
                            status=status,
                            lifecycle_status=lifecycle,
                            user_notes=stored.user_notes if stored else None,
                            currency=cur,
                            title=f"{title_prefix} {display_name}",
                            description=(
                                f"Detected {n_txs} recurring {cadence_label.lower()} charges averaging {round(avg_amount, 2)} {cur}. "
                                + (f"No activity for {days_since_latest} days; potential dormant leak." if is_dormant else "Active recurring outflow.")
                            ),
                            severity="high" if is_dormant or monthly_cost > Decimal("1000") else "medium",
                            analysis_start_date=earliest_date,
                            analysis_end_date=latest_date,
                            first_observed_date=earliest_date,
                            last_observed_date=latest_date,
                            relevant_transaction_count=n_txs,
                            supporting_transactions=support_items,
                            evidence_summary=(
                                f"{n_txs} charges observed with median interval of {median_interval} days. "
                                f"First seen {earliest_date.strftime('%b %d, %Y')}, latest seen {latest_date.strftime('%b %d, %Y')}."
                            ),
                            calculation_method=f"Cadence frequency analysis ({cadence_label}) across {n_txs} chronological records.",
                            assumptions=(
                                f"Assumes ongoing {cadence_label.lower()} charge of {round(monthly_cost, 2)} {cur}/month. "
                                "Projected savings assume plan cancellation without early termination penalties."
                            ),
                            limitations="Analysis based on transaction records only. Does not inspect third-party app login activity.",
                            recommended_action=f"Review active status with {display_name} and cancel if no longer providing value.",
                            potential_monthly_savings=round(monthly_cost, 2),
                            projected_annual_savings=round(annual_cost, 2),
                            is_savings_projected=True,
                        )
                    )

                # -------------------------------------------------------------
                # Detection 2B: Unexpected Price Increases (Inflation)
                # -------------------------------------------------------------
                if (is_monthly or is_weekly or is_quarterly) and n_txs >= 2:
                    prior_amount = txs_sorted[-2].amount
                    if latest_amount > prior_amount and prior_amount > ZERO:
                        price_diff = latest_amount - prior_amount
                        pct_increase = round((price_diff / prior_amount) * Decimal("100"), 1)

                        # Flag if increase is at least 5% and not an interval switch
                        if pct_increase >= Decimal("5.0"):
                            inflation_key = f"inflation-{txs_sorted[-1].id}-{txs_sorted[-2].id}"
                            stored_inf = stored_records.get(inflation_key)
                            lifecycle_inf = FindingLifecycleStatus(stored_inf.status) if stored_inf else FindingLifecycleStatus.NEW

                            # Monthly incremental cost
                            inc_monthly = price_diff if is_monthly else (price_diff * Decimal("4.33") if is_weekly else round(price_diff / Decimal("3.0"), 2))
                            inc_annual = round(inc_monthly * Decimal("12.00"), 2)

                            insights.append(
                                SpendLeakInsight(
                                    id=inflation_key,
                                    insight_type=InsightType.RECURRING_COST_INFLATION,
                                    status=InsightStatus.SUFFICIENTLY_SUPPORTED if n_txs >= 3 else InsightStatus.PROVISIONAL,
                                    lifecycle_status=lifecycle_inf,
                                    user_notes=stored_inf.user_notes if stored_inf else None,
                                    currency=cur,
                                    title=f"Price Increase Detected: {display_name}",
                                    description=(
                                        f"Recurring billing increased from {prior_amount} {cur} to {latest_amount} {cur} "
                                        f"(+{price_diff} {cur}, +{pct_increase}%) on {latest_date.strftime('%b %d, %Y')}."
                                    ),
                                    severity="high" if pct_increase >= Decimal("20.0") or inc_monthly > Decimal("200") else "medium",
                                    analysis_start_date=txs_sorted[-2].transaction_date,
                                    analysis_end_date=latest_date,
                                    first_observed_date=txs_sorted[-2].transaction_date,
                                    last_observed_date=latest_date,
                                    relevant_transaction_count=2,
                                    supporting_transactions=[
                                        SupportingTransaction(
                                            id=txs_sorted[-2].id,
                                            transaction_date=txs_sorted[-2].transaction_date,
                                            amount=txs_sorted[-2].amount,
                                            currency=cur,
                                            description=txs_sorted[-2].description,
                                            source=getattr(txs_sorted[-2], "source", "manual"),
                                        ),
                                        SupportingTransaction(
                                            id=txs_sorted[-1].id,
                                            transaction_date=txs_sorted[-1].transaction_date,
                                            amount=txs_sorted[-1].amount,
                                            currency=cur,
                                            description=txs_sorted[-1].description,
                                            source=getattr(txs_sorted[-1], "source", "manual"),
                                        ),
                                    ],
                                    previous_amount=prior_amount,
                                    current_amount=latest_amount,
                                    price_increase_amount=price_diff,
                                    price_increase_percentage=pct_increase,
                                    price_increase_date=latest_date,
                                    evidence_summary=(
                                        f"Previous charge was {prior_amount} {cur} on {txs_sorted[-2].transaction_date.strftime('%Y-%m-%d')}; "
                                        f"new charge is {latest_amount} {cur} on {latest_date.strftime('%Y-%m-%d')}."
                                    ),
                                    calculation_method="Exact Decimal delta between sequential recurring occurrences.",
                                    assumptions="Assumes change is an ongoing price revision rather than a one-time surcharge or add-on fee.",
                                    limitations="Cannot automatically determine if service tier or usage tier was upgraded.",
                                    recommended_action=f"Verify billing update with {display_name} or downgrade to the previous tier.",
                                    potential_monthly_savings=round(inc_monthly, 2),
                                    projected_annual_savings=round(inc_annual, 2),
                                    is_savings_projected=True,
                                )
                            )

                # -------------------------------------------------------------
                # Detection 2C: Unexpectedly Missing Recurring Payments
                # -------------------------------------------------------------
                if is_monthly and n_txs >= 3:
                    # If overdue by 14 to 60 days
                    if 45 <= days_since_latest <= 90:
                        missing_key = f"missing-recur-{txs_sorted[-1].id}"
                        stored_mis = stored_records.get(missing_key)
                        lifecycle_mis = FindingLifecycleStatus(stored_mis.status) if stored_mis else FindingLifecycleStatus.NEW

                        insights.append(
                            SpendLeakInsight(
                                id=missing_key,
                                insight_type=InsightType.MISSING_RECURRING_PAYMENT,
                                status=InsightStatus.PROVISIONAL,
                                lifecycle_status=lifecycle_mis,
                                user_notes=stored_mis.user_notes if stored_mis else None,
                                currency=cur,
                                title=f"Missing Recurring Charge: {display_name}",
                                description=(
                                    f"Expected monthly charge of ~{latest_amount} {cur} has not appeared for {days_since_latest} days "
                                    f"(last observed {latest_date.strftime('%b %d, %Y')})."
                                ),
                                severity="low",
                                analysis_start_date=earliest_date,
                                analysis_end_date=now,
                                first_observed_date=earliest_date,
                                last_observed_date=latest_date,
                                relevant_transaction_count=n_txs,
                                supporting_transactions=[
                                    SupportingTransaction(
                                        id=t.id,
                                        transaction_date=t.transaction_date,
                                        amount=t.amount,
                                        currency=cur,
                                        description=t.description,
                                        source=getattr(t, "source", "manual"),
                                    )
                                    for t in txs_sorted[-3:]
                                ],
                                evidence_summary=f"Series of {n_txs} monthly payments paused or missing since {latest_date.strftime('%Y-%m-%d')}.",
                                calculation_method="Cadence projection vs elapsed days since latest transaction.",
                                assumptions="Expected cadence is monthly. Missing transaction may indicate successful cancellation or delayed posting.",
                                limitations="Does not confirm subscription was cancelled. An un-imported bank statement may account for the gap.",
                                recommended_action="Check if subscription was intentionally cancelled or if a payment failed.",
                                potential_monthly_savings=ZERO,
                                projected_annual_savings=ZERO,
                                is_savings_projected=False,  # Anomaly requiring review; does not claim saved money
                            )
                        )

            # -------------------------------------------------------------
            # Detection 3: Potential Duplicate Charges (Same Day or Nearby Dates)
            # -------------------------------------------------------------
            # Match on: same account, same normalized merchant, same amount, same currency, within 48h
            sorted_cur_txns = sorted(cur_txns, key=lambda x: (x.account_id, _clean_merchant_name(x.description).lower(), x.amount, x.transaction_date))

            i = 0
            while i < len(sorted_cur_txns):
                t1 = sorted_cur_txns[i]
                m1 = _clean_merchant_name(t1.description).lower()
                cluster = [t1]

                j = i + 1
                while j < len(sorted_cur_txns):
                    t2 = sorted_cur_txns[j]
                    m2 = _clean_merchant_name(t2.description).lower()
                    if (
                        t2.account_id == t1.account_id
                        and m2 == m1
                        and t2.amount == t1.amount
                        and abs((t2.transaction_date.date() - t1.transaction_date.date()).days) <= 1
                    ):
                        cluster.append(t2)
                        j += 1
                    else:
                        break

                if len(cluster) >= 2:
                    dup_key = f"dup-{cluster[0].id}-{cluster[1].id}"
                    stored_dup = stored_records.get(dup_key)
                    lifecycle_dup = FindingLifecycleStatus(stored_dup.status) if stored_dup else FindingLifecycleStatus.NEW

                    dates_str = ", ".join(sorted(list(set(t.transaction_date.strftime('%b %d') for t in cluster))))
                    dup_savings = round(cluster[0].amount * (len(cluster) - 1), 2)

                    insights.append(
                        SpendLeakInsight(
                            id=dup_key,
                            insight_type=InsightType.DUPLICATE_CHARGE_LEAKAGE,
                            status=InsightStatus.SUFFICIENTLY_SUPPORTED,
                            lifecycle_status=lifecycle_dup,
                            user_notes=stored_dup.user_notes if stored_dup else None,
                            currency=cur,
                            title=f"Potential Duplicate Billing: {cluster[0].description}",
                            description=(
                                f"{len(cluster)} identical charges of {cluster[0].amount} {cur} recorded within 48h ({dates_str}). "
                                "May represent an accidental double-swipe, duplicate POS authorization, or retry."
                            ),
                            severity="high",
                            analysis_start_date=cluster[0].transaction_date,
                            analysis_end_date=cluster[-1].transaction_date,
                            first_observed_date=cluster[0].transaction_date,
                            last_observed_date=cluster[-1].transaction_date,
                            relevant_transaction_count=len(cluster),
                            supporting_transactions=[
                                SupportingTransaction(
                                    id=t.id,
                                    transaction_date=t.transaction_date,
                                    amount=t.amount,
                                    currency=cur,
                                    description=t.description,
                                    source=getattr(t, "source", "manual"),
                                )
                                for t in cluster
                            ],
                            evidence_summary=f"{len(cluster)} identical transactions of {cluster[0].amount} {cur} across {dates_str}.",
                            calculation_method="Exact match on account, amount, currency, and merchant descriptor within a 48-hour window.",
                            assumptions="Assumes one charge was legitimate and remaining charges were unintentional duplicates.",
                            limitations="Some services legitimately bill multiple times if separate orders were submitted.",
                            recommended_action="Check merchant receipt or dispute accidental double debit with your card issuer.",
                            potential_monthly_savings=dup_savings,
                            projected_annual_savings=dup_savings,
                            is_savings_projected=False,  # One-time recoverable expense
                        )
                    )
                    i = j
                else:
                    i += 1

        # -------------------------------------------------------------
        # Detection 4: Excessive Category Spending Baseline
        # -------------------------------------------------------------
        if report.available_history_days >= 30:
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

                    cat_key = f"excess-cat-{b.category_id}"
                    stored_cat = stored_records.get(cat_key)
                    lifecycle_cat = FindingLifecycleStatus(stored_cat.status) if stored_cat else FindingLifecycleStatus.NEW

                    insights.append(
                        SpendLeakInsight(
                            id=cat_key,
                            insight_type=InsightType.EXCESSIVE_CATEGORY_SPEND,
                            status=InsightStatus.SUFFICIENTLY_SUPPORTED if report.available_history_days >= 90 else InsightStatus.PROVISIONAL,
                            lifecycle_status=lifecycle_cat,
                            user_notes=stored_cat.user_notes if stored_cat else None,
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

        # -------------------------------------------------------------
        # Synchronize / Persist New Finding Records in DB for Idempotency
        # -------------------------------------------------------------
        for item in insights:
            if item.id not in stored_records:
                new_record = SpendLeakFindingRecord(
                    owner_id=self.owner_id,
                    finding_key=item.id,
                    finding_type=item.insight_type.value,
                    status=FindingLifecycleStatus.NEW.value,
                    user_notes=None,
                    first_detected_at=now,
                    last_detected_at=now,
                )
                self.db.add(new_record)
                stored_records[item.id] = new_record
            else:
                rec = stored_records[item.id]
                rec.last_detected_at = now
        await self.db.commit()

        # -------------------------------------------------------------
        # Exact Savings Calculation Without Double-Counting
        # Rules:
        # 1. Dismissed findings do NOT count toward potential savings.
        # 2. If both RECURRING_SUBSCRIPTION and RECURRING_COST_INFLATION exist for the same merchant,
        #    count the subscription monthly cost ONCE (do not add inflation on top of the base subscription).
        # 3. MISSING_RECURRING_PAYMENT has 0 potential savings.
        # -------------------------------------------------------------
        active_findings = [i for i in insights if i.lifecycle_status != FindingLifecycleStatus.DISMISSED]

        # Deduplicate recurring savings per merchant descriptor
        counted_merchants_monthly: Dict[str, Decimal] = {}
        counted_merchants_annual: Dict[str, Decimal] = {}

        def _extract_core_merchant(title: str) -> str:
            cleaned = re.sub(r"^\[.*?\]\s*", "", title)
            cleaned = re.sub(r"^(Price Increase Detected:\s*|Missing Recurring Charge:\s*|Potential Duplicate Billing:\s*|Potential Recurring Charge Unconfirmed:\s*)", "", cleaned, flags=re.IGNORECASE)
            return _clean_merchant_name(cleaned).lower()

        for f in active_findings:
            if f.insight_type in [InsightType.RECURRING_SUBSCRIPTION, InsightType.DORMANT_RECURRING]:
                m = _extract_core_merchant(f.title)
                # Take highest if multiple
                if m not in counted_merchants_monthly or f.potential_monthly_savings > counted_merchants_monthly[m]:
                    counted_merchants_monthly[m] = f.potential_monthly_savings
                    counted_merchants_annual[m] = f.projected_annual_savings
            elif f.insight_type == InsightType.RECURRING_COST_INFLATION:
                m = _extract_core_merchant(f.title)
                # If merchant is NOT already covered by the full subscription, add the inflation
                if m not in counted_merchants_monthly:
                    counted_merchants_monthly[m] = f.potential_monthly_savings
                    counted_merchants_annual[m] = f.projected_annual_savings


        total_monthly_leak = sum(counted_merchants_monthly.values(), ZERO)
        total_annual_leak = sum(counted_merchants_annual.values(), ZERO)
        recoverable_monthly = total_monthly_leak
        recoverable_annual = total_annual_leak

        # Summary Stats
        stats = SpendLeakSummaryStats(
            total_potential_recurring_count=sum(
                1 for i in insights if i.insight_type in [InsightType.RECURRING_SUBSCRIPTION, InsightType.DORMANT_RECURRING]
            ),
            findings_awaiting_review_count=sum(
                1 for i in insights if i.lifecycle_status == FindingLifecycleStatus.NEW
            ),
            potential_monthly_savings=round(total_monthly_leak, 2),
            potential_annual_savings=round(total_annual_leak, 2),
            recently_detected_changes_count=sum(
                1 for i in insights if i.insight_type in [InsightType.RECURRING_COST_INFLATION, InsightType.MISSING_RECURRING_PAYMENT]
            ),
        )

        return SpendLeakAnalysisResponse(
            readiness=report,
            insights=insights,
            total_monthly_leak=round(total_monthly_leak, 2),
            total_annual_leak=round(total_annual_leak, 2),
            recoverable_monthly_estimate=round(recoverable_monthly, 2),
            recoverable_annual_estimate=round(recoverable_annual, 2),
            summary_stats=stats,
            disclaimer="All savings figures are uncommitted mathematical projections based on recurring plan interception. Actual realized savings depend on confirmed merchant cancellation and avoidance of replacement expenditures.",
        )

    async def update_finding_status(
        self,
        finding_key: str,
        status: FindingLifecycleStatus,
        user_notes: Optional[str] = None,
    ) -> SpendLeakFindingRecord:
        """Update the review lifecycle status for a finding, enforcing strict user ownership."""
        stmt = select(SpendLeakFindingRecord).where(
            and_(
                SpendLeakFindingRecord.owner_id == self.owner_id,
                SpendLeakFindingRecord.finding_key == finding_key,
            )
        )
        res = await self.db.execute(stmt)
        record = res.scalar_one_or_none()

        now = datetime.utcnow()
        if not record:
            # Create the record with the requested status
            record = SpendLeakFindingRecord(
                owner_id=self.owner_id,
                finding_key=finding_key,
                finding_type="general",
                status=status.value,
                user_notes=user_notes,
                first_detected_at=now,
                last_detected_at=now,
                updated_at=now,
            )
            self.db.add(record)
        else:
            record.status = status.value
            if user_notes is not None:
                record.user_notes = user_notes
            record.updated_at = now

        await self.db.commit()
        await self.db.refresh(record)
        return record
