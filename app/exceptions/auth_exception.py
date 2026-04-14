from enum import Enum
from fastapi import status
from app.exceptions.base_exception import AppException

class AuthExceptionCase(Enum):
    INVALID_CREDENTIALS = (status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    AUTH_REQUIRED = (status.HTTP_401_UNAUTHORIZED, "Authentication required")
    INACTIVE_ACCOUNT = (status.HTTP_401_UNAUTHORIZED, "Account is inactive")
    USER_NOT_FOUND = (status.HTTP_404_NOT_FOUND, "User not found")

    def __init__(self, status_code, message):
        self.status_code = status_code
        self.message = message

class AuthException(AppException):
    def __init__(self, case: AuthExceptionCase, custom_message: str = None):
        super().__init__(
            status_code=case.status_code,
            message=custom_message or case.message,
            error_code=case.name
        )
