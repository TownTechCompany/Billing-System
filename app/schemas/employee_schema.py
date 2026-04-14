from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    customer_type: Optional[str] = "Admin"


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    customer_type: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("customer_type")
    @classmethod
    def validate_customer_type(cls, v):
        allowed = {"Admin", "Owner"}
        if v and v not in allowed:
            raise ValueError(f"customer_type must be one of {allowed}")
        return v
