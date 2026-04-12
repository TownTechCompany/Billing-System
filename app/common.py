"""
Common utilities
- Encryption/Decryption: Used ONLY for password storage
- Utility functions: Time helpers
- Exception Logging: Year/Month/Day folder structure
"""
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


def log_exception(exception: Exception, endpoint: str = "unknown") -> str:
    """
    Log exception to file with year/month/day folder structure
    Folder structure: logs/YYYY/MM/DD/exception_HH-MM-SS.txt
    
    Args:
        exception: The exception object to log
        endpoint: API endpoint where exception occurred
    
    Returns:
        Path to the log file created
    """
    try:
        now = datetime.datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        day = now.strftime("%d")
        timestamp = now.strftime("%H-%M-%S")
        
        # Create logs directory structure
        log_dir = Path("logs") / year / month / day
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Create log file
        log_file = log_dir / f"exception_{timestamp}.txt"
        
        # Format exception message
        log_content = f"""
========================================
EXCEPTION LOG
========================================
Date: {now.strftime("%Y-%m-%d %H:%M:%S")}
Endpoint: {endpoint}
Exception Type: {type(exception).__name__}
Exception Message: {str(exception)}
========================================
Traceback:
{traceback.format_exc()}
========================================
"""
        
        # Write to file
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(log_content)
        
        return str(log_file)
    
    except Exception as e:
        # Fallback: print to console if file logging fails
        print(f"Error logging exception: {str(e)}")
        return "failed_to_log"
    