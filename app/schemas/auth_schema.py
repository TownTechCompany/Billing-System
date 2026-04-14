from typing import Optional
from pydantic import BaseModel, EmailStr


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False


class AuthResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    customer_type: str
    full_name: str
