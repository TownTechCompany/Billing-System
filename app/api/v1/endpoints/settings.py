from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import ShopSettings

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    s = db.query(ShopSettings).first()
    if not s:
        s = ShopSettings(); db.add(s); db.commit(); db.refresh(s)
    return s.to_dict()
 
@router.post("")
async def save_settings(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    s = db.query(ShopSettings).first()
    if not s:
        s = ShopSettings(); db.add(s)
    
    allowed = ["shop_name","shop_tagline","shop_address","shop_phone","shop_email",
               "gstin","cgst","sgst","tax_inclusive","round_total","currency",
               "primary_color","upi_id","thank_you_msg","receipt_footer",
               "paper_width","admin_pin","date_format","enable_tables",
               "table_count","allow_discount","max_discount"]
    
    for key in allowed:
        snake_key = key  # already snake_case from frontend mapping
        val = data.get(key) or data.get(snake_key.replace('_',''))
        if val is not None:
            setattr(s, snake_key, val)
    
    # Handle camelCase from frontend
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
        "currency":      "currency",
        "gstin":         "gstin",
        "cgst":          "cgst",
        "sgst":          "sgst",
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

    db.commit()
    return {"message": "Settings saved"}