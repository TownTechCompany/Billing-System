from sqlalchemy.orm import Session
from app.models.models import Employee
from app.ttutils.common import encrypt_data, decrypt_data

class EmployeeService:
    def __init__(self, db: Session):
        self.db = db
    
    def list_all(self):
        """Get all employees"""
        return self.db.query(Employee).all()
    
    def get_by_id(self, employee_id: int):
        """Get employee by ID"""
        employee = self.db.query(Employee).filter(Employee.id == employee_id).first()
        if employee:
            decrypted_password = decrypt_data(employee.password)
            employee.password = decrypted_password
        return employee
    
    def get_by_email(self, email: str):
        """Get employee by email"""
        employee = self.db.query(Employee).filter(Employee.email == email).first()
        if employee:
            decrypted_password = decrypt_data(employee.password)
            employee.password = decrypted_password
        return employee

    def create(self, first_name: str, last_name: str, email: str, 
               password: str, customer_type: str = "Staff"):
        """Create new employee"""
        # Check if employee already exists
        existing = self.get_by_email(email)
        if existing:
            return None
        
        # Hash password
        encrpted_password = encrypt_data(password)  # Replace with actual encryption
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
    
    def update(self, employee_id: int, **kwargs):
        """Update employee"""
        employee = self.get_by_id(employee_id)
        if not employee:
            return None
        
        # Update allowed fields only
        allowed_fields = ['first_name', 'last_name', 'email', 'customer_type', 'is_active']
        for key, value in kwargs.items():
            if key in allowed_fields and value is not None:
                setattr(employee, key, value)
        
        self.db.commit()
        self.db.refresh(employee)
        return employee
    
    def delete(self, employee_id: int):
        """Delete employee"""
        employee = self.get_by_id(employee_id)
        if not employee:
            return False
        
        self.db.delete(employee)
        self.db.commit()
        return True
    
    def toggle_status(self, employee_id: int):
        """Toggle employee active/inactive"""
        employee = self.get_by_id(employee_id)
        if not employee:
            return None
        
        employee.is_active = not employee.is_active
        self.db.commit()
        self.db.refresh(employee)
        return employee
