from typing import Optional
from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
