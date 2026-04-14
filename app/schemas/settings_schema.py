from typing import Optional
from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    shop_name: Optional[str] = None
    shop_tagline: Optional[str] = None
    shop_address: Optional[str] = None
    shop_phone: Optional[str] = None
    shop_email: Optional[str] = None
    gstin: Optional[str] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    tax_inclusive: Optional[int] = None
    round_total: Optional[int] = None
    currency: Optional[str] = None
    primary_color: Optional[str] = None
    upi_id: Optional[str] = None
    thank_you_msg: Optional[str] = None
    receipt_footer: Optional[str] = None
    paper_width: Optional[str] = None
    admin_pin: Optional[str] = None
    date_format: Optional[str] = None
    enable_tables: Optional[int] = None
    table_count: Optional[int] = None
    allow_discount: Optional[int] = None
    max_discount: Optional[float] = None
