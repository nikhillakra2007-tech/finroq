from fastapi import APIRouter
from app.api.routes import health, accounts, transactions, categories, summary, auth, budgets, recurring, ai, spend_leaks, crash_tests


api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(accounts.router)
api_router.include_router(transactions.router)
api_router.include_router(categories.router)
api_router.include_router(summary.router)
api_router.include_router(budgets.router)
api_router.include_router(recurring.router)
api_router.include_router(ai.router)
api_router.include_router(spend_leaks.router)
api_router.include_router(crash_tests.router)