from fastapi import Request
from fastapi.responses import JSONResponse
from app.exceptions.base_exception import AppException
from app.utils.log_writer import LogWriter

log_writer = LogWriter()

async def app_exception_handler(request: Request, exc: AppException):
    """Handler for custom AppException"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handler for all other unhandled exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An internal server error occurred",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )
