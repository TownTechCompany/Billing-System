from sqlalchemy.orm import Session
from app.models import Employee
from app.utils.security import encrypt_data, decrypt_data
from app.exceptions.employee_exception import EmployeeException, EmployeeExceptionCase

class EmployeeService:
    def __init__(self, db: Session):
        self.db = db
    
    def list_all_service(self):
        """Get all employees"""
        return self.db.query(Employee).all()
    
    def get_by_id_service(self, employee_id: int):
        """Get employee by ID"""
        employee = self.db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise EmployeeException(EmployeeExceptionCase.EMPLOYEE_NOT_FOUND)
        return employee
    
    def get_by_email_service(self, email: str):
        """Get employee by email"""
        return self.db.query(Employee).filter(Employee.email == email).first()

    def create_employee_service(self, first_name: str, last_name: str, email: str, 
                               password: str, customer_type: str = "Admin"):
        """Create new employee"""
        # Check if employee already exists
        existing = self.db.query(Employee).filter(Employee.email == email).first()
        if existing:
            raise EmployeeException(EmployeeExceptionCase.EMAIL_ALREADY_EXISTS)
        
        # Hash password
        encrpted_password = encrypt_data(password)
        employee = Employee(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=encrpted_password,
            customer_type=customer_type,
            is_active=True
        )
        
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)
        return employee
    
    def update_employee_service(self, employee_id: int, **kwargs):
        """Update employee"""
        employee = self.get_by_id_service(employee_id)
        
        # Update allowed fields only
        allowed_fields = ['first_name', 'last_name', 'email', 'customer_type', 'is_active']
        for key, value in kwargs.items():
            if key in allowed_fields and value is not None:
                # If email is being updated, check for uniqueness
                if key == 'email' and value != employee.email:
                    existing = self.db.query(Employee).filter(Employee.email == value).first()
                    if existing:
                        raise EmployeeException(EmployeeExceptionCase.EMAIL_ALREADY_EXISTS)
                setattr(employee, key, value)
        
        self.db.commit()
        self.db.refresh(employee)
        return employee
    
    def delete_employee_service(self, employee_id: int):
        """Delete employee"""
        employee = self.get_by_id_service(employee_id)
        
        self.db.delete(employee)
        self.db.commit()
        return True
    
    def toggle_status_service(self, employee_id: int):
        """Toggle employee active/inactive"""
        employee = self.get_by_id_service(employee_id)
        
        employee.is_active = not employee.is_active
        self.db.commit()
        self.db.refresh(employee)
        return employee
