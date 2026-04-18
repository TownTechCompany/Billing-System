from typing import Optional
from pydantic import BaseModel, Field


class SettingsUpdate(BaseModel):
    shop_name: Optional[str] = Field(None, alias="shopName")
    shop_tagline: Optional[str] = Field(None, alias="shopTagline")
    shop_address: Optional[str] = Field(None, alias="shopAddress")
    shop_phone: Optional[str] = Field(None, alias="shopPhone")
    shop_email: Optional[str] = Field(None, alias="shopEmail")
    gstin: Optional[str] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    tax_inclusive: Optional[int] = Field(None, alias="taxInclusive")
    round_total: Optional[int] = Field(None, alias="roundTotal")
    currency: Optional[str] = None
    primary_color: Optional[str] = Field(None, alias="primaryColor")
    upi_id: Optional[str] = Field(None, alias="upiId")
    thank_you_msg: Optional[str] = Field(None, alias="thankYouMsg")
    receipt_footer: Optional[str] = Field(None, alias="receiptFooter")
    paper_width: Optional[str] = Field(None, alias="paperWidth")
    admin_pin: Optional[str] = Field(None, alias="adminPin")
    date_format: Optional[str] = Field(None, alias="dateFormat")
    enable_tables: Optional[int] = Field(None, alias="enableTables")
    table_count: Optional[int] = Field(None, alias="tableCount")
    allow_discount: Optional[int] = Field(None, alias="allowDiscount")
    max_discount: Optional[float] = Field(None, alias="maxDiscount")

    class Config:
        allow_population_by_field_name = True

class ShopSettingsUpdate(BaseModel):
    shop_name: Optional[str] = Field(None, alias="shopName")
    shop_tagline: Optional[str] = Field(None, alias="shopTagline")
    shop_address: Optional[str] = Field(None, alias="shopAddress")
    shop_phone: Optional[str] = Field(None, alias="shopPhone")
    shop_email: Optional[str] = Field(None, alias="shopEmail")
    admin_pin: Optional[str] = Field(None, alias="adminPin")

    class Config:
        allow_population_by_field_name = True

class TaxSettingsUpdate(BaseModel):
    gstin: Optional[str] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    tax_inclusive: Optional[int] = Field(None, alias="taxInclusive")
    round_total: Optional[int] = Field(None, alias="roundTotal")
    allow_discount: Optional[int] = Field(None, alias="allowDiscount")
    max_discount: Optional[float] = Field(None, alias="maxDiscount")

    class Config:
        allow_population_by_field_name = True

class PaymentSettingsUpdate(BaseModel):
    upi_id: Optional[str] = Field(None, alias="upiId")

    class Config:
        allow_population_by_field_name = True

class ReceiptSettingsUpdate(BaseModel):
    thank_you_msg: Optional[str] = Field(None, alias="thankYouMsg")
    receipt_footer: Optional[str] = Field(None, alias="receiptFooter")
    paper_width: Optional[str] = Field(None, alias="paperWidth")
    date_format: Optional[str] = Field(None, alias="dateFormat")

    class Config:
        allow_population_by_field_name = True

class TableSettingsUpdate(BaseModel):
    enable_tables: Optional[int] = Field(None, alias="enableTables")
    table_count: Optional[int] = Field(None, alias="tableCount")

    class Config:
        allow_population_by_field_name = True
