from enum import Enum
from fastapi import status
from app.exceptions.base_exception import AppException

class EmployeeExceptionCase(Enum):
    EMPLOYEE_NOT_FOUND = (status.HTTP_404_NOT_FOUND, "Employee not found")
    EMAIL_ALREADY_EXISTS = (status.HTTP_400_BAD_REQUEST, "Employee email already exists")

    def __init__(self, status_code, message):
        self.status_code = status_code
        self.message = message

class EmployeeException(AppException):
    def __init__(self, case: EmployeeExceptionCase, custom_message: str = None):
        super().__init__(
            status_code=case.status_code,
            message=custom_message or case.message,
            error_code=case.name
        )
