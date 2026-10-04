from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class FineChallan(Base):
    __tablename__ = "fine_challans"

    id = Column(Integer, primary_key=True, index=True)
    challan_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parking_lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=True)
    booking_id = Column(String, nullable=True)
    
    vehicle_number = Column(String, nullable=False, default="TN-09-SP-2026")
    violation_type = Column(String, nullable=False) 
    # Violations: OVERSTAY, UNRESERVED_PARKING, WRONG_SLOT, BUFFER_SPACE_VIOLATION
    violation_reason = Column(String, nullable=False)
    slot_number = Column(String, nullable=True)
    assigned_slot_number = Column(String, nullable=True)
    
    hourly_rent_rate = Column(Float, default=40.0)
    fine_multiplier = Column(Float, default=1.5)  # 1.5x hourly rent rate
    fine_rate_per_hour = Column(Float, default=60.0)
    duration_hours = Column(Float, default=1.0)
    fine_amount = Column(Float, nullable=False)
    
    # Statuses: UNPAID, PAID, WAIVED
    status = Column(String, default="UNPAID", nullable=False)
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    paid_at = Column(DateTime, nullable=True)
    payment_reference = Column(String, nullable=True)

    user = relationship("User")
    parking_lot = relationship("ParkingLot")
