import hashlib
import hmac


def verify_signature(payload_bytes: bytes, signature_header: str, app_secret: str) -> bool:
    """Verify a Meta webhook HMAC-SHA256 signature.

    Args:
        payload_bytes: The raw request body bytes.
        signature_header: The value of the X-Hub-Signature-256 header (format: ``sha256=<hex>``).
        app_secret: The Meta app secret used to compute the expected signature.

    Returns:
        ``True`` if the signature is valid, ``False`` otherwise.
    """
    if not signature_header or not signature_header.startswith("sha256="):
        return False

    expected_hex = signature_header[len("sha256="):]
    computed = hmac.new(app_secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, expected_hex)
