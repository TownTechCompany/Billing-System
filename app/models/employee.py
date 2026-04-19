from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.db.session import Base

class Employee(Base):
    __tablename__ = "employee"
    id            = Column(Integer, primary_key=True, index=True)
    first_name    = Column(String(50), nullable=False, index=True)
    last_name     = Column(String(50), nullable=False, index=True)
    email         = Column(String(100), unique=True, nullable=False, index=True)
    customer_type = Column(String(20))
    password      = Column(String(255), nullable=False)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "customer_type": self.customer_type,
            "full_name": f"{self.first_name} {self.last_name}",
            "password": self.password,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
