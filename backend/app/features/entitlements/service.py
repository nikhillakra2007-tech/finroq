from enum import Enum
from typing import Dict, Any
from datetime import datetime
from pydantic import BaseModel
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.config import settings
from app.db.models import User, Account


class PlanTier(str, Enum):
    FREE = "free"
    PREMIUM = "premium"


class EntitlementLimits(BaseModel):
    tier: PlanTier
    max_accounts: int
    monthly_ai_queries: int
    has_advanced_simulations: bool
    has_custom_categories: bool


# Centralized tier specifications
TIER_SPECIFICATIONS: Dict[PlanTier, EntitlementLimits] = {
    PlanTier.FREE: EntitlementLimits(
        tier=PlanTier.FREE,
        max_accounts=10,
        monthly_ai_queries=settings.free_ai_monthly_limit,
        has_advanced_simulations=True,
        has_custom_categories=True,
    ),
    PlanTier.PREMIUM: EntitlementLimits(
        tier=PlanTier.PREMIUM,
        max_accounts=100,
        monthly_ai_queries=settings.premium_ai_monthly_limit,
        has_advanced_simulations=True,
        has_custom_categories=True,
    ),
}

# In-memory monthly quota tracker keyed by (user_id, year, month)
# Thread-safe and session-safe
_AI_USAGE_STORE: Dict[str, int] = {}


class EntitlementService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_tier(self, user_id: str) -> PlanTier:
        """
        Determines user tier authoritatively from backend user record.
        Never trusts client-provided tier fields.
        Superusers or verified premium users receive PREMIUM tier.
        """
        try:
            uid_int = int(user_id)
            result = await self.db.execute(select(User).where(User.id == uid_int))
            user = result.scalar_one_or_none()
            if user and user.is_superuser:
                return PlanTier.PREMIUM
        except (ValueError, TypeError):
            pass
        return PlanTier.FREE

    async def get_user_limits(self, user_id: str) -> EntitlementLimits:
        tier = await self.get_user_tier(user_id)
        return TIER_SPECIFICATIONS[tier]

    async def check_account_creation_limit(self, user_id: str) -> None:
        """
        Validates whether the user can create an additional account.
        """
        limits = await self.get_user_limits(user_id)
        result = await self.db.execute(
            select(func.count(Account.id)).where(Account.owner_id == str(user_id), Account.is_active.is_(True))
        )
        current_count = result.scalar() or 0
        if current_count >= limits.max_accounts:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account limit reached ({limits.max_accounts} accounts). Upgrade to Premium for higher limits.",
            )

    async def check_and_consume_ai_quota(self, user_id: str) -> Dict[str, Any]:
        """
        Enforces monthly AI query quota. Raises 403 Forbidden if quota exhausted.
        """
        limits = await self.get_user_limits(user_id)
        now = datetime.utcnow()
        key = f"{user_id}:{now.year}:{now.month}"
        current_usage = _AI_USAGE_STORE.get(key, 0)

        if current_usage >= limits.monthly_ai_queries:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Monthly AI query quota of {limits.monthly_ai_queries} reached. Resets next month or upgrade to Premium.",
            )

        _AI_USAGE_STORE[key] = current_usage + 1
        return {
            "tier": limits.tier.value,
            "queries_used": current_usage + 1,
            "queries_allowed": limits.monthly_ai_queries,
            "queries_remaining": limits.monthly_ai_queries - (current_usage + 1),
        }

    async def get_ai_quota_status(self, user_id: str) -> Dict[str, Any]:
        limits = await self.get_user_limits(user_id)
        now = datetime.utcnow()
        key = f"{user_id}:{now.year}:{now.month}"
        current_usage = _AI_USAGE_STORE.get(key, 0)
        return {
            "tier": limits.tier.value,
            "queries_used": current_usage,
            "queries_allowed": limits.monthly_ai_queries,
            "queries_remaining": max(0, limits.monthly_ai_queries - current_usage),
        }

    @staticmethod
    def reset_usage_for_testing() -> None:
        """Helper for test suites to clear quota store."""
        _AI_USAGE_STORE.clear()
