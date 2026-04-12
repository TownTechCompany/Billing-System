from cryptography.fernet import Fernet
import datetime
import os
import traceback
from pathlib import Path

# Static Fernet key for password encryption
crypto_key = "y7nyMfwrCnTMiS06REnDjRKRRTx_DQ_ztZE358J4Cc0="
cipher = Fernet(crypto_key)


def get_utc_now():
    """Get current UTC time as formatted string"""
    now = datetime.datetime.utcnow()
    return now.strftime("%Y-%m-%d %H:%M:%S")


def encrypt_data(data: str) -> bytes:
    """Encrypt data using Fernet (for passwords only)"""
    return cipher.encrypt(data.encode())


def decrypt_data(token: bytes) -> str:
    """Decrypt data using Fernet (for passwords only)"""
    return cipher.decrypt(token).decode()


