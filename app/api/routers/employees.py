from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.employee_schema import EmployeeCreate, EmployeeUpdate
from app.services.employee_service import EmployeeService
from app.utils.responses import success_response

router = APIRouter(tags=["employees"])

@router.get("/get-employees")
def list_employees(db: Session = Depends(get_db)):
    """Get all employees"""
    employees = EmployeeService(db).list_all_service()
    return success_response(
        data=[emp.to_dict() for emp in employees],
        message="Employees fetched successfully"
    )

@router.post("/create-employee", status_code=status.HTTP_201_CREATED)
async def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    """Create new employee"""
    employee = EmployeeService(db).create_employee_service(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password=payload.password,
        customer_type=payload.customer_type
    )
    return success_response(
        data=employee.to_dict(),
        message="Employee created successfully",
        status_code=status.HTTP_201_CREATED
    )

@router.get("/get-employee-detail/{employee_id}")
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """Get employee by ID"""
    employee = EmployeeService(db).get_by_id_service(employee_id)
    return success_response(
        data=employee.to_dict(),
        message="Employee fetched successfully"
    )

@router.put("/update-employee/{employee_id}")
async def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    """Update employee"""
    employee = EmployeeService(db).update_employee_service(
        employee_id, 
        **payload.dict(exclude_unset=True)
    )
    return success_response(
        data=employee.to_dict(),
        message="Employee updated successfully"
    )

@router.delete("/delete-employee/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """Delete employee"""
    EmployeeService(db).delete_employee_service(employee_id)
    return success_response(message="Employee deleted successfully")

@router.patch("/toggle-status/{employee_id}")
async def toggle_employee_status(employee_id: int, db: Session = Depends(get_db)):
    """Toggle employee active/inactive status"""
    employee = EmployeeService(db).toggle_status_service(employee_id)
    return success_response(
        data=employee.to_dict(),
        message="Employee status updated"
    )
