from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    vehicle_number = Column(String, nullable=True, default="TN-09-AB-1234")
    role = Column(String, default="civilian")  # civilian, owner, government
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
