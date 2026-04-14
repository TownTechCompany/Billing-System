from sqlalchemy.orm import Session
from app.models import ShopSettings

class SettingsService:
    def __init__(self, db: Session):
        self.db = db

    def get_settings_service(self):
        """Get or create shop settings"""
        s = self.db.query(ShopSettings).first()
        if not s:
            s = ShopSettings()
            self.db.add(s)
            self.db.commit()
            self.db.refresh(s)
        return s

    def update_settings_service(self, data: dict):
        """Update shop settings with mapping logic"""
        s = self.get_settings_service()
        
        # Primary snake_case mapping
        allowed = [
            "shop_name", "shop_tagline", "shop_address", "shop_phone", "shop_email",
            "gstin", "cgst", "sgst", "tax_inclusive", "round_total", "currency",
            "primary_color", "upi_id", "thank_you_msg", "receipt_footer",
            "paper_width", "admin_pin", "date_format", "enable_tables",
            "table_count", "allow_discount", "max_discount"
        ]
        
        for key in allowed:
            val = data.get(key)
            if val is not None:
                setattr(s, key, val)
        
        # camelCase from frontend mapping
        map_camel = {
            "shopName":      "shop_name",
            "shopTagline":   "shop_tagline",
            "shopAddress":   "shop_address",
            "shopPhone":     "shop_phone",
            "shopEmail":     "shop_email",
            "primaryColor":  "primary_color",
            "upiId":         "upi_id",
            "thankYouMsg":   "thank_you_msg",
            "receiptFooter": "receipt_footer",
            "paperWidth":    "paper_width",
            "adminPin":      "admin_pin",
            "dateFormat":    "date_format",
            "taxInclusive":  "tax_inclusive",
            "roundTotal":    "round_total",
            "enableTables":  "enable_tables",
            "tableCount":    "table_count",
            "allowDiscount": "allow_discount",
            "maxDiscount":   "max_discount",
        }
        
        for camel, snake in map_camel.items():
            if data.get(camel) is not None:
                setattr(s, snake, data[camel])
        
        self.db.commit()
        self.db.refresh(s)
        return s
