# ════════════════════════════════════════════════
# schemas.py  — REPLACE your existing file with this
# Adds: table_number, order_type, customer_phone, notes on OrderCreate
# ════════════════════════════════════════════════

from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator

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
    name:     str
    category: str
    price:    float


class ProductUpdate(BaseModel):
    name:     Optional[str]   = None
    category: Optional[str]   = None
    price:    Optional[float] = None


class OrderItemIn(BaseModel):
    product_id: int
    quantity:   int
    price:      float


class OrderCreate(BaseModel):
    items:          List[OrderItemIn]
    payment_method: Optional[str] = "Cash"
    # ── New optional fields ──
    order_type:     Optional[str] = "dine-in"    # dine-in | takeaway | delivery
    table_number:   Optional[int] = None
    customer_name:  Optional[str] = None
    customer_phone: Optional[str] = None
    notes:          Optional[str] = None

    @field_validator('order_type')
    @classmethod
    def validate_order_type(cls, v):
        allowed = {'dine-in', 'takeaway', 'delivery'}
        if v and v.lower() not in allowed:
            raise ValueError(f"order_type must be one of {allowed}")
        return v.lower() if v else 'dine-in'


class OrderItemUpdate(BaseModel):
    product_id:   Optional[int] = None
    product_name: str
    price:        float
    quantity:     int


class OrderUpdate(BaseModel):
    status:         Optional[str]               = None
    payment_method: Optional[str]               = None
    customer_name:  Optional[str]               = None
    customer_phone: Optional[str]               = None
    table_number:   Optional[int]               = None
    discount:       Optional[float]             = None
    notes:          Optional[str]               = None
    items:          Optional[List[OrderItemUpdate]] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        allowed = {'open', 'paid', 'void'}
        if v and v.lower() not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v.lower() if v else v


class SettingsUpdate(BaseModel):
    shop_name:      Optional[str]   = None
    shop_tagline:   Optional[str]   = None
    shop_address:   Optional[str]   = None
    shop_phone:     Optional[str]   = None
    shop_email:     Optional[str]   = None
    gstin:          Optional[str]   = None
    cgst:           Optional[float] = None
    sgst:           Optional[float] = None
    tax_inclusive:  Optional[int]   = None
    round_total:    Optional[int]   = None
    currency:       Optional[str]   = None
    primary_color:  Optional[str]   = None
    upi_id:         Optional[str]   = None
    thank_you_msg:  Optional[str]   = None
    receipt_footer: Optional[str]   = None
    paper_width:    Optional[str]   = None
    admin_pin:      Optional[str]   = None
    date_format:    Optional[str]   = None
    enable_tables:  Optional[int]   = None
    table_count:    Optional[int]   = None
    allow_discount: Optional[int]   = None
    max_discount:   Optional[float] = None


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    customer_type: Optional[str] = "Staff"

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    customer_type: Optional[str] = None
    is_active: Optional[bool] = None
