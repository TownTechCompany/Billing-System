from typing import Optional, List
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

class ProductCreate(BaseModel):
    name: str
    category: str
    price: float

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None

class OrderItemIn(BaseModel):
    product_id: int
    quantity: int
    price: float

class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    payment_method: Optional[str] = "Cash"
