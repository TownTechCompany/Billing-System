from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth_schema import UserLogin, AuthResponse
from app.services.auth_service import AuthService
from app.utils.responses import success_response

router = APIRouter(tags=["authentication"])

@router.post("/login")
async def login(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """User login"""
    auth_service = AuthService(db)
    employee = auth_service.authenticate_user_service(credentials.email, credentials.password)
    employee_data = auth_service.get_employee_data_service(employee.id)

    # Set session data
    request.session["id"] = employee.id
    request.session["email"] = employee.email
    request.session["full_name"] = employee_data["full_name"]

    return success_response(
        data=AuthResponse(
            id=employee_data["id"],
            first_name=employee_data["first_name"],
            last_name=employee_data["last_name"],
            email=employee_data["email"],
            customer_type=employee_data["customer_type"],
            full_name=employee_data["full_name"]
        ),
        message="Login successful"
    )

@router.get("/logout")
async def logout(request: Request):
    """User logout"""
    request.session.clear() 
    return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)