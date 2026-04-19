from typing import Optional
from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float

    class Config:
        allow_population_by_field_name = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None

    class Config:
        allow_population_by_field_name = True
