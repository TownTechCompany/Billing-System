from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.api.routers.routes import router as api_router
from app.db.session import Base, engine
from app.db.seed import seed_database
from app.exceptions.base_exception import AppException
from app.exceptions.handler import app_exception_handler, general_exception_handler

# Initialize DB
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(title="BillPOS", version="2.0.0")

# Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Middlewares
app.add_middleware(
    SessionMiddleware,
    secret_key="kx8XzFvXbG9KpY9q5Wm3Xc8V9QnZl2W6R0dYwFhTj8A=",
)

# Mounts and Routers
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(api_router)