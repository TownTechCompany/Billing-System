from sqlalchemy.orm import Session
from app.models.models import Customer

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def authenticate_user(self, email: str, password: str) -> Customer:
        """Authenticate user with email (simple verification)"""
        customer = self.db.query(Customer).filter(Customer.email == email).first()
        
        if not customer or not customer.is_active:
            return None
        
        return customer
    
    def get_customer_data(self, customer_id: int) -> dict:
        """Get customer data for response"""
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        
        if not customer:
            return None
        
        return {
            "id": customer.id,
            "first_name": customer.first_name,
            "last_name": customer.last_name,
            "email": customer.email,
            "customer_type": customer.customer_type,
            "full_name": f"{customer.first_name} {customer.last_name}"
        }
