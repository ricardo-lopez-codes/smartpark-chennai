from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parking_lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"), nullable=True)
    
    vehicle_number = Column(String, nullable=True, default="TN-09-SP-2026")
    payment_method = Column(String, default="RAZORPAY", nullable=False)
    
    # Dynamic Slot Assignment
    assigned_position_id = Column(Integer, ForeignKey("parking_slots.id"), nullable=True)
    assigned_position_name = Column(String, nullable=True)
    is_buffer_assigned = Column(Boolean, default=False, nullable=False)
    
    booking_date = Column(String, nullable=True)  # YYYY-MM-DD
    duration_hours = Column(Integer, default=2, nullable=False)
    start_time = Column(DateTime, nullable=False)
    paid_end_time = Column(DateTime, nullable=False)
    buffer_end_time = Column(DateTime, nullable=False)
    grace_end_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    
    # Overstay & Security Alert System
    # Statuses: UPCOMING, ACTIVE, EXTENDED, COMPLETED, CANCELLED, EXPIRED
    status = Column(String, default="UPCOMING", nullable=False)
    # Overstay Statuses: NONE, WARNING_15MIN, GRACE_PERIOD, OVERSTAY_ALERT, RESOLVED
    overstay_status = Column(String, default="NONE", nullable=False)
    overstay_duration_minutes = Column(Integer, default=0, nullable=False)
    security_action_required = Column(Boolean, default=False, nullable=False)
    security_action_taken = Column(Boolean, default=False, nullable=False)
    security_action_notes = Column(String, nullable=True)
    
    amount = Column(Float, nullable=False)
    booking_charge = Column(Float, default=10.0, nullable=False) # Non-refundable service fee
    used_hours = Column(Float, nullable=True)
    used_amount = Column(Float, nullable=True)
    unused_amount = Column(Float, nullable=True)
    cancellation_fee = Column(Float, nullable=True)
    refund_amount = Column(Float, nullable=True)
    refund_status = Column(String, default="NONE", nullable=False) # NONE, PENDING, REFUNDED, FAILED
    refund_id = Column(String, nullable=True)
    payment_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    parking_lot = relationship("ParkingLot")
    slot = relationship("ParkingSlot", foreign_keys=[slot_id])
    assigned_position = relationship("ParkingSlot", foreign_keys=[assigned_position_id])
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    payment_method = Column(String, default="RAZORPAY", nullable=False) # RAZORPAY, FASTAG
    transaction_reference = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    # Statuses: PENDING, SUCCESS, FAILED, REFUNDED
    status = Column(String, default="PENDING", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    booking = relationship("Booking", back_populates="payments")
