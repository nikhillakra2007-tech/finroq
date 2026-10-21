import logging
import httpx
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    content: str
    is_live_ai: bool
    model_used: str
    provider_status: str


class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, timeout: Optional[float] = None):
        self.api_key = api_key if api_key is not None else settings.gemini_api_key
        self.model = model or settings.gemini_model
        self.timeout = timeout or settings.ai_request_timeout_seconds

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def generate_insight(
        self,
        system_instruction: str,
        user_prompt: str,
        max_output_tokens: int = 1000,
    ) -> GeminiResponse:
        """
        Calls Google Gemini REST API with bounded retries and strict error handling.
        Falls back cleanly to deterministic response if API key is not configured or network fails.
        """
        if not self.is_configured:
            return GeminiResponse(
                content=self._generate_deterministic_fallback(user_prompt),
                is_live_ai=False,
                model_used="deterministic-rules-engine",
                provider_status="unconfigured_api_key",
            )

        url = f"{GEMINI_API_BASE}/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"System Directive: {system_instruction}\n\nUser Context:\n{user_prompt}"}],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": max_output_tokens,
                "topP": 0.95,
            },
        }

        # Bounded retries: 1 retry for transient errors
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts and "text" in parts[0]:
                                return GeminiResponse(
                                    content=parts[0]["text"].strip(),
                                    is_live_ai=True,
                                    model_used=self.model,
                                    provider_status="active",
                                )
                        return GeminiResponse(
                            content="No text content returned from Gemini model.",
                            is_live_ai=True,
                            model_used=self.model,
                            provider_status="empty_candidate",
                        )
                    elif response.status_code in (429, 503) and attempt == 0:
                        logger.warning(f"Gemini API rate limited or unavailable (status {response.status_code}), retrying...")
                        continue
                    else:
                        logger.error(f"Gemini API error status {response.status_code}: {response.text}")
                        break
            except (httpx.TimeoutException, httpx.RequestError) as exc:
                logger.error(f"Gemini connection failure on attempt {attempt + 1}: {exc}")
                if attempt == 0:
                    continue

        return GeminiResponse(
            content=self._generate_deterministic_fallback(user_prompt),
            is_live_ai=False,
            model_used="deterministic-rules-engine",
            provider_status="provider_unavailable_fallback",
        )

    def _generate_deterministic_fallback(self, prompt: str) -> str:
        """
        Generates objective, rule-based financial guidance when the external AI provider is unavailable.
        Uses clear, helpful heuristics based on standard financial principles.
        """
        return (
            "FINROQ Financial Intelligence Summary:\n"
            "• Cash Flow Integrity: Review recurring commitments and maintain budget discipline within target categories.\n"
            "• Liquidity Buffer: Ensure at least 3–6 months of essential baseline expenses are held in liquid accounts.\n"
            "• Allocation Strategy: Prioritize positive net cash flow to accelerate debt reduction or wealth accumulation goals."
        )
