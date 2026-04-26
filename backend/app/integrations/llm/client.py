"""OpenAI-compatible LLM HTTP client.

Uses httpx directly — no openai SDK dependency.
Never logs full prompts. Only logs token counts and model name.
"""
from __future__ import annotations

import httpx

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.logging import get_logger

logger = get_logger(__name__)

_OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"


class OpenAIClient:
    def __init__(self, api_key: str, timeout: float = 60.0) -> None:
        self._api_key = api_key
        self._timeout = timeout

    async def chat_completion(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        model: str,
        max_tokens: int = 500,
        temperature: float = 0.4,
    ) -> dict[str, object]:
        """
        Call the OpenAI Chat Completions API.

        Returns:
            {"text": str, "input_tokens": int, "output_tokens": int}

        Raises:
            AppException(code="llm_error") on non-200 or parse failure.
        """
        payload = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system_prompt},
                *messages,
            ],
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            try:
                response = await client.post(
                    _OPENAI_CHAT_URL,
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
            except httpx.TimeoutException as exc:
                raise AppException(
                    code="llm_error",
                    message=f"LLM request timed out: {exc}",
                ) from exc
            except httpx.RequestError as exc:
                raise AppException(
                    code="llm_error",
                    message=f"LLM network error: {exc}",
                ) from exc

        if response.status_code != 200:
            raise AppException(
                code="llm_error",
                message=f"LLM API returned status {response.status_code}",
            )

        try:
            data = response.json()
            text: str = data["choices"][0]["message"]["content"]
            input_tokens: int = data["usage"]["prompt_tokens"]
            output_tokens: int = data["usage"]["completion_tokens"]
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            raise AppException(
                code="llm_error",
                message=f"Failed to parse LLM response: {exc}",
            ) from exc

        logger.info(
            "llm_completion_ok",
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

        return {"text": text, "input_tokens": input_tokens, "output_tokens": output_tokens}


def get_llm_client() -> OpenAIClient:
    settings = get_settings()
    return OpenAIClient(api_key=settings.openai_api_key)
