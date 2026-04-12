from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import UserLogin, AuthResponse
from app.services.auth_service import AuthService
from app.common import log_exception

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """User login endpoint - authenticate user with bcrypt password"""
    try:
        auth_service = AuthService(db)
        
        # Authenticate user (password verified with bcrypt)
        customer = auth_service.authenticate_user(credentials.email, credentials.password)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Get customer data
        customer_data = auth_service.get_customer_data(customer.id)
        
        return {
            "message": "Login successful",
            "user": AuthResponse(
                id=customer_data["id"],
                first_name=customer_data["first_name"],
                last_name=customer_data["last_name"],
                email=customer_data["email"],
                customer_type=customer_data["customer_type"],
                full_name=customer_data["full_name"]
            )
        }
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e, endpoint="/api/auth/login")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )


@router.post("/logout")
async def logout():
    """User logout endpoint"""
    try:
        return {"message": "Logout successful"}
    except Exception as e:
        log_exception(e, endpoint="/api/auth/logout")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during logout"
        )
