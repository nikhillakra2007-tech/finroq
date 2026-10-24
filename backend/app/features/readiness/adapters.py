"""Future Integration Architecture for Spend Leak Detection.

This module defines stable, narrow boundary contracts for external data sources
such as bank aggregators, subscription billing APIs, and future companion apps
(e.g., Android UsageStatsManager companion).

Core Principles:
1. Pure normalization: External providers must normalize records into internal schemas.
2. Explicit User Consent: Every provider connection requires explicit, revokable authorization.
3. Privacy & Minimal Metadata: Never collect keystrokes, personal messages, or unrelated data.
4. "Unknown" vs "Unused": A missing app-usage observation MUST be interpreted as "unknown",
   never as "confirmed dormant/unused".
5. Financial Precision: Transaction amounts must be exact Decimals; currency conversions
   must be explicit and never implicitly assumed.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any


@dataclass
class NormalizedTransactionRecord:
    """Normalized transaction representation decoupled from specific provider formats."""
    external_id: str
    account_id: str
    amount: Decimal
    currency: str
    transaction_date: datetime
    description: str
    normalized_merchant: str
    transaction_type: str  # "expense", "income", "transfer"
    is_pending: bool = False
    raw_category: Optional[str] = None
    provider_source: str = "local"


@dataclass
class SubscriptionEvidenceRecord:
    """Subscription or recurring billing mandate metadata from an authorized provider."""
    subscription_id: str
    merchant_name: str
    plan_name: Optional[str]
    billing_cadence: str  # "weekly", "monthly", "quarterly", "annual"
    expected_amount: Decimal
    currency: str
    next_billing_date: Optional[datetime]
    last_billing_date: Optional[datetime]
    is_active: bool
    provider_source: str


@dataclass
class AppUsageObservationRecord:
    """Authorized application usage measurement from companion monitoring (e.g., Android Usage Access).

    CRITICAL PRIVACY RULE:
    - Only tracks aggregated foreground runtime (total_time_in_foreground_ms) and timestamp of last interaction.
    - Never collects app content, notifications, keystrokes, or screen captures.
    - If unavailable or revoked, usage status is strictly "unknown", never assumed to be zero.
    """
    package_name: str
    app_label: str
    last_time_used: Optional[datetime]
    total_time_in_foreground_ms: int
    observation_start: datetime
    observation_end: datetime
    is_usage_access_granted: bool = True


class ExternalDataProvider(ABC):
    """Abstract interface for external authorized financial data providers."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique identifier for the provider (e.g., 'plaid', 'setu_aa', 'saltedge')."""
        pass

    @abstractmethod
    async def fetch_transactions(
        self,
        account_id: str,
        start_date: datetime,
        end_date: datetime,
    ) -> List[NormalizedTransactionRecord]:
        """Fetch and normalize transaction history within the authorized window."""
        pass

    @abstractmethod
    async def fetch_subscription_evidence(
        self,
        account_id: str,
    ) -> List[SubscriptionEvidenceRecord]:
        """Fetch confirmed recurring mandates or e-mandates where supported."""
        pass

    @abstractmethod
    async def revoke_access(self, user_id: str) -> bool:
        """Securely revoke OAuth/consent tokens and purge active provider credentials."""
        pass


class AndroidUsageCompanionBoundary:
    """Specification and documentation for the future Android companion integration.

    Architecture Specification:
    1. Permission Model:
       Requires explicit user navigation to `Settings > Special app access > Usage access`
       using `android.permission.PACKAGE_USAGE_STATS`.
    2. Data Scope:
       The companion app queries `UsageStatsManager.queryUsageStats()` strictly for packages
       mapped to recognized subscription merchants (e.g. streaming, gym, music apps).
    3. Transmission Security:
       Observations are signed, timestamped, transmitted over TLS 1.3 with pinned certificates,
       and associated strictly with the authenticated user ID.
    4. Absence of Data:
       If the companion app is not installed, permissions are revoked, or usage stats are empty,
       FINROQ treats usage as `UNKNOWN`. Inactivity is NEVER inferred from lack of telemetry.
    """

    @staticmethod
    def map_usage_to_evidence_strength(
        observation: Optional[AppUsageObservationRecord],
    ) -> str:
        if observation is None or not observation.is_usage_access_granted:
            return "unknown_no_companion_data"
        if observation.last_time_used is None:
            return "unopened_during_observation_window"
        return "active_usage_verified"
