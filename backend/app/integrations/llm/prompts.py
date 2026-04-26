"""Prompt construction utilities for the AI pipeline.

SYSTEM_PROMPT_VERSION is stored on every ai_run so we can trace which prompt
version produced which output. Bump this whenever the system prompt changes.
"""
from __future__ import annotations

from app.models.message import Message, SenderType

SYSTEM_PROMPT_VERSION = "1.0.0"

_SYSTEM_TEMPLATE = """\
You are a helpful customer support assistant for {workspace_name} on Instagram.

Answer customer questions based on the knowledge base provided. Be friendly, concise, and helpful.
If you are not confident or the question is outside the knowledge base, set should_escalate to true.
For sensitive topics (refunds, legal, account bans, abuse), always escalate.
Keep replies under 200 words. Write in the same language the customer used.

Knowledge base:
{knowledge_chunks}

You must respond ONLY with a JSON object — no other text:
{{
  "reply_text": "your reply here",
  "confidence": 0.0 to 1.0,
  "should_escalate": true or false,
  "reason": "brief reason for escalation if applicable, else empty string"
}}"""


def build_system_prompt(workspace_name: str, knowledge_chunks: list[str]) -> str:
    """Render the system prompt with workspace name and knowledge base chunks."""
    if knowledge_chunks:
        formatted_chunks = "\n".join(
            f"{i + 1}. {chunk}" for i, chunk in enumerate(knowledge_chunks)
        )
    else:
        formatted_chunks = "(No knowledge base entries available — use your best judgment.)"

    return _SYSTEM_TEMPLATE.format(
        workspace_name=workspace_name,
        knowledge_chunks=formatted_chunks,
    )


def build_conversation_messages(messages: list[Message]) -> list[dict[str, str]]:
    """Convert Message records to OpenAI chat message format.

    - customer → "user"
    - ai / human → "assistant"
    - system messages are skipped
    - Only the last 10 non-system messages are included (oldest first).
    """
    result: list[dict[str, str]] = []

    for msg in messages:
        if msg.sender_type == SenderType.SYSTEM:
            continue

        if msg.sender_type == SenderType.CUSTOMER:
            role = "user"
        else:
            role = "assistant"

        content = msg.text_content or ""
        if not content.strip():
            continue

        result.append({"role": role, "content": content})

    # Keep last 10, in chronological order (list already is chronological from get_recent)
    return result[-10:]
