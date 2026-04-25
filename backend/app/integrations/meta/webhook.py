import hashlib
import hmac
import json
from typing import Any


def verify_signature(payload_bytes: bytes, signature_header: str | None, app_secret: str) -> bool:
    if not signature_header or not app_secret:
        return False

    expected_signature = "sha256=" + hmac.new(
        app_secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()
    try:
        return hmac.compare_digest(expected_signature, signature_header)
    except Exception:
        return False


def parse_webhook_payload(payload_dict: dict[str, Any]) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []

    entries = payload_dict.get("entry")
    if not isinstance(entries, list):
        return events

    for entry in entries:
        if not isinstance(entry, dict):
            continue
        messaging_events = entry.get("messaging")
        if not isinstance(messaging_events, list):
            continue

        for raw_event in messaging_events:
            if not isinstance(raw_event, dict):
                continue
            message = raw_event.get("message")
            if not isinstance(message, dict):
                continue

            sender = raw_event.get("sender")
            recipient = raw_event.get("recipient")
            if not isinstance(sender, dict) or not isinstance(recipient, dict):
                continue

            sender_id = sender.get("id")
            recipient_id = recipient.get("id")
            message_id = message.get("mid")
            if not isinstance(sender_id, str) or not isinstance(recipient_id, str) or not isinstance(message_id, str):
                continue

            message_text = message.get("text") if isinstance(message.get("text"), str) else None
            message_type = "text" if message_text else "attachment"

            attachments = message.get("attachments")
            if isinstance(attachments, list) and attachments:
                first_attachment = attachments[0]
                if isinstance(first_attachment, dict):
                    attachment_type = first_attachment.get("type")
                    if isinstance(attachment_type, str):
                        message_type = attachment_type

            timestamp = raw_event.get("timestamp")
            if not isinstance(timestamp, int):
                timestamp = None

            events.append(
                {
                    "sender_id": sender_id,
                    "recipient_id": recipient_id,
                    "message_id": message_id,
                    "message_text": message_text,
                    "message_type": message_type,
                    "timestamp": timestamp,
                }
            )

    return events


def compute_event_hash(payload_dict: dict[str, Any]) -> str:
    canonical = json.dumps(payload_dict, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
