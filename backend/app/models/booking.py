from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parking_lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"), nullable=False)
    
    booking_date = Column(String, nullable=True)  # YYYY-MM-DD
    duration_hours = Column(Integer, default=2, nullable=False)
    start_time = Column(DateTime, nullable=False)
    paid_end_time = Column(DateTime, nullable=False)
    buffer_end_time = Column(DateTime, nullable=False)
    actual_end_time = Column(DateTime, nullable=True)
    
    # Statuses: UPCOMING, ACTIVE, EXTENDED, COMPLETED, CANCELLED, EXPIRED
    status = Column(String, default="UPCOMING", nullable=False)
    amount = Column(Float, nullable=False)
    payment_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    parking_lot = relationship("ParkingLot")
    slot = relationship("ParkingSlot")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    razorpay_order_id = Column(String, nullable=False)
    razorpay_payment_id = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    # Statuses: PENDING, SUCCESS, FAILED, REFUNDED
    status = Column(String, default="PENDING", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    booking = relationship("Booking", back_populates="payments")
