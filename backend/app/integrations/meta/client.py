from typing import Any

import httpx

from app.core.exceptions import AppException


class MetaClient:
    def __init__(self, access_token: str, api_version: str) -> None:
        self.access_token = access_token
        self.api_version = api_version
        self.base_url = f"https://graph.facebook.com/{api_version}"

    async def send_dm(self, recipient_ig_user_id: str, message_text: str) -> dict[str, str]:
        url = f"{self.base_url}/me/messages"
        payload = {
            "recipient": {"id": recipient_ig_user_id},
            "messaging_type": "RESPONSE",
            "message": {"text": message_text},
            "access_token": self.access_token,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)

        if response.status_code >= 400:
            raise AppException(
                code="meta_api_error",
                message=self._build_error_message(response),
                status_code=response.status_code,
            )

        data = response.json()
        message_id = data.get("message_id")
        if not isinstance(message_id, str):
            raise AppException(
                code="meta_api_error",
                message="Meta API response missing message_id",
                status_code=502,
            )
        return {"message_id": message_id}

    async def get_account_profile(self, instagram_account_id: str) -> dict[str, str]:
        url = f"{self.base_url}/{instagram_account_id}"
        params = {
            "fields": "username,name",
            "access_token": self.access_token,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)

        if response.status_code >= 400:
            raise AppException(
                code="meta_api_error",
                message=self._build_error_message(response),
                status_code=response.status_code,
            )

        data = response.json()
        username = data.get("username")
        name = data.get("name")
        if not isinstance(username, str) or not isinstance(name, str):
            raise AppException(
                code="meta_api_error",
                message="Meta API profile response missing fields",
                status_code=502,
            )
        return {"username": username, "name": name}

    async def verify_webhook_token(self, verify_token: str, challenge: str) -> str:
        _ = verify_token
        return challenge

    def _build_error_message(self, response: httpx.Response) -> str:
        detail = response.text
        if self.access_token and self.access_token in detail:
            detail = detail.replace(self.access_token, "[REDACTED]")
        return f"Meta API request failed with status {response.status_code}: {detail}"
