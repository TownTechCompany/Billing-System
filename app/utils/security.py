import datetime
from cryptography.fernet import Fernet

# Static Fernet key — store in env/.env in production
_CRYPTO_KEY = "y7nyMfwrCnTMiS06REnDjRKRRTx_DQ_ztZE358J4Cc0="
_cipher = Fernet(_CRYPTO_KEY)


def encrypt_data(data: str) -> bytes:
    """Encrypt a plain-text string (used for passwords)."""
    return _cipher.encrypt(data.encode())


def decrypt_data(token: bytes) -> str:
    """Decrypt an encrypted token back to plain text."""
    return _cipher.decrypt(token).decode()


def get_utc_now() -> str:
    """Return current UTC time as a formatted string."""
    return datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
