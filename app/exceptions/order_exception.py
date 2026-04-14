from enum import Enum
from fastapi import status
from app.exceptions.base_exception import AppException

class OrderExceptionCase(Enum):
    ORDER_NOT_FOUND = (status.HTTP_404_NOT_FOUND, "Order not found")
    INVALID_INPUT = (status.HTTP_400_BAD_REQUEST, "Invalid order input")

    def __init__(self, status_code, message):
        self.status_code = status_code
        self.message = message

class OrderException(AppException):
    def __init__(self, case: OrderExceptionCase, custom_message: str = None):
        super().__init__(
            status_code=case.status_code,
            message=custom_message or case.message,
            error_code=case.name
        )
