from sqlalchemy.orm import Session
from app.utils.security import decrypt_data
from app.models import Employee
from app.exceptions.auth_exception import AuthException, AuthExceptionCase

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def authenticate_user_service(self, email: str, password: str) -> Employee:
        """Authenticate user with email"""
        employee = self.db.query(Employee).filter(Employee.email == email).first()
        
        if not employee:
            raise AuthException(AuthExceptionCase.INVALID_CREDENTIALS)
            
        if not employee.is_active:
            raise AuthException(AuthExceptionCase.INACTIVE_ACCOUNT)
        
        decrypted_password = decrypt_data(employee.password)
        
        if decrypted_password != password:
            raise AuthException(AuthExceptionCase.INVALID_CREDENTIALS)
        
        return employee
    
    def get_employee_data_service(self, employee_id: int) -> dict:
        """Get employee data for response"""
        employee = self.db.query(Employee).filter(Employee.id == employee_id).first()
        
        if not employee:
            raise AuthException(AuthExceptionCase.USER_NOT_FOUND)
        
        return {
            "id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "email": employee.email,
            "customer_type": employee.customer_type,
            "full_name": f"{employee.first_name} {employee.last_name}"
        }
