from sqlalchemy.orm import Session
from app.ttutils.common import decrypt_data
from app.models.models import Employee

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def authenticate_user(self, email: str, password: str) -> Employee:
        """Authenticate user with email (simple verification)"""
        employee = self.db.query(Employee).filter(Employee.email == email).first()
        
        if not employee or not employee.is_active:
            return None
        
        decrypted_password = decrypt_data(employee.password)
        
        if decrypted_password != password:
            return None
        
        return employee
    
    def get_employee_data(self, employee_id: int) -> dict:
        """Get employee data for response"""
        employee = self.db.query(Employee).filter(Employee.id == employee_id).first()
        
        if not employee:
            return None
        
        return {
            "id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "email": employee.email,
            "customer_type": employee.customer_type,
            "full_name": f"{employee.first_name} {employee.last_name}"
        }
