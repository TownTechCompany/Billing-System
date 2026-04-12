from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import EmployeeCreate, EmployeeUpdate
from app.services.employee_service import EmployeeService
from app.ttutils.logwritter import LogWriter
log_writer_ = LogWriter()

router = APIRouter(prefix="/api/employees", tags=["employees"])

@router.get("")
def list_employees(db: Session = Depends(get_db)):
    """Get all employees"""
    try:
        employees = EmployeeService(db).list_all()
        return [emp.to_dict() for emp in employees]
    except Exception as e:
        log_writer_.log_exception(e, endpoint="/api/employees (list)")
        raise HTTPException(500, "Error fetching employees")

@router.post("", status_code=201)
async def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    """Create new employee"""
    try:
        service = EmployeeService(db)
        
        # Check if employee already exists
        existing = service.get_by_email(payload.email)
        if existing:
            raise HTTPException(400, "Employee with this email already exists")
        
        employee = service.create(
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            password=payload.password,
            customer_type=payload.customer_type
        )
        
        if not employee:
            raise HTTPException(400, "Failed to create employee")
        
        return {
            "message": "Employee created successfully",
            "employee": employee.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        log_writer_.log_exception(e, endpoint="/api/employees (create)")
        raise HTTPException(500, "Error creating employee")

@router.get("/{employee_id}")
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """Get employee by ID"""
    try:
        employee = EmployeeService(db).get_by_id(employee_id)
        if not employee:
            raise HTTPException(404, "Employee not found")
        return employee.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        log_writer_.log_exception(e, endpoint="/api/employees/{employee_id} (get)")
        raise HTTPException(500, "Error fetching employee")

@router.put("/{employee_id}")
async def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    """Update employee"""
    try:
        service = EmployeeService(db)
        employee = service.update(employee_id, **payload.dict(exclude_unset=True))
        
        if not employee:
            raise HTTPException(404, "Employee not found")
        
        return {
            "message": "Employee updated successfully",
            "employee": employee.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        log_writer_.log_exception(e, endpoint="/api/employees/{employee_id} (update)")
        raise HTTPException(500, "Error updating employee")

@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """Delete employee"""
    try:
        service = EmployeeService(db)
        
        if not service.delete(employee_id):
            raise HTTPException(404, "Employee not found")
        
        return {"message": "Employee deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        log_writer_.log_exception(e, endpoint="/api/employees/{employee_id} (delete)")
        raise HTTPException(500, "Error deleting employee")

@router.patch("/{employee_id}/toggle")
async def toggle_employee_status(employee_id: int, db: Session = Depends(get_db)):
    """Toggle employee active/inactive status"""
    try:
        service = EmployeeService(db)
        employee = service.toggle_status(employee_id)
        
        if not employee:
            raise HTTPException(404, "Employee not found")
        
        return {
            "message": "Employee status updated",
            "employee": employee.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        log_writer_.log_exception(e, endpoint="/api/employees/{employee_id}/toggle")
        raise HTTPException(500, "Error updating employee status")
