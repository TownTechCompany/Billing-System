from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import UserLogin, AuthResponse
from app.services.auth_service import AuthService
from app.ttutils.logwritter import LogWriter
from fastapi import Request
log_writer_ = LogWriter()

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/login")
async def login(
    credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        auth_service = AuthService(db)
        
        employee = auth_service.authenticate_user(
            credentials.email,
            credentials.password
        )
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        employee_data = auth_service.get_employee_data(employee.id)

        request.session["id"] = employee.id
        request.session["email"] = employee.email
        request.session["full_name"] = employee_data["first_name"] + " " + employee_data["last_name"]

        return {
            "message": "Login successful",
            "user": AuthResponse(
                id=employee_data["id"],
                first_name=employee_data["first_name"],
                last_name=employee_data["last_name"],
                email=employee_data["email"],
                customer_type=employee_data["customer_type"],
                full_name=employee_data["full_name"]
            )
        }

    except HTTPException:
        raise
    except Exception as e:
        log_writer_.log_exception("Auth", "login", e)
        raise HTTPException(
            status_code=500,
            detail="An error occurred during login"
        )

@router.get("/logout")
async def logout(request: Request):
    try:
        request.session.clear() 
    except Exception as e:
        log_writer_.log_exception("Auth", "logout", e)
        raise HTTPException(status_code=500,detail="An error occurred during logout")
    
    return RedirectResponse(url="/", status_code=303)