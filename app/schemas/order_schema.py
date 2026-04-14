from typing import Optional, List
from pydantic import BaseModel, field_validator


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int
    price: float


class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    payment_method: Optional[str] = "Cash"
    order_type: Optional[str] = "dine-in"
    table_number: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("order_type")
    @classmethod
    def validate_order_type(cls, v):
        allowed = {"dine-in", "takeaway", "delivery"}
        if v and v.lower() not in allowed:
            raise ValueError(f"order_type must be one of {allowed}")
        return v.lower() if v else "dine-in"


class OrderItemUpdate(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    price: float
    quantity: int


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_method: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    table_number: Optional[int] = None
    discount: Optional[float] = None
    notes: Optional[str] = None
    items: Optional[List[OrderItemUpdate]] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        allowed = {"open", "paid", "void"}
        if v and v.lower() not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v.lower() if v else v


class CheckoutRequest(BaseModel):
    payment_method: Optional[str] = "Cash"
