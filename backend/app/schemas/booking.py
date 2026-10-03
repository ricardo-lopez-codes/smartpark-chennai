from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BookingCreate(BaseModel):
    parking_lot_id: int
    slot_id: Optional[int] = None
    booking_date: Optional[str] = None  # YYYY-MM-DD
    start_time_str: Optional[str] = None  # HH:MM e.g. "18:00"
    duration_hours: int = Field(..., ge=1, le=8)
    vehicle_number: Optional[str] = "TN-09-SP-2026"
    payment_method: Optional[str] = "RAZORPAY"

class BookingExtend(BaseModel):
    additional_hours: int = Field(1, ge=1, le=5)

class BookingCancelResponse(BaseModel):
    booking_id: str
    original_amount: float
    cancellation_fee: float
    refund_amount: float
    status: str

class PaymentInit(BaseModel):
    booking_id: int
    amount: float

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    simulate_success: bool = True

class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    razorpay_order_id: Optional[str] = None
    payment_method: Optional[str] = "RAZORPAY"
    transaction_reference: Optional[str] = None
    vehicle_number: Optional[str] = None
    amount: float
    status: str

    class Config:
        from_attributes = True

class BookingResponse(BaseModel):
    id: int
    booking_id: str
    user_id: int
    parking_lot_id: int
    slot_id: Optional[int] = None
    booking_date: Optional[str] = None
    duration_hours: int = 2
    parking_lot_name: str
    parking_address: str
    area_name: str
    slot_number: str
    assigned_position_name: Optional[str] = None
    is_buffer_assigned: Optional[bool] = False
    vehicle_number: Optional[str] = "TN-09-SP-2026"
    payment_method: Optional[str] = "RAZORPAY"
    start_time: datetime
    paid_end_time: datetime
    buffer_end_time: datetime
    grace_end_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    remaining_seconds: int
    seconds_until_start: Optional[int] = 0
    status: str
    overstay_status: Optional[str] = "NONE"
    overstay_duration_minutes: Optional[int] = 0
    security_action_required: Optional[bool] = False
    security_action_taken: Optional[bool] = False
    security_action_notes: Optional[str] = None
    amount: float
    booking_charge: Optional[float] = 10.0
    used_hours: Optional[float] = None
    used_amount: Optional[float] = None
    unused_amount: Optional[float] = None
    cancellation_fee: Optional[float] = None
    refund_amount: Optional[float] = None
    refund_status: Optional[str] = "NONE"
    refund_id: Optional[str] = None
    payment_id: Optional[str] = None
    created_at: datetime
    latitude: float
    longitude: float
    opening_time: Optional[str] = "06:00"
    closing_time: Optional[str] = "23:00"

    class Config:
        from_attributes = True

class EarlyExitPreviewResponse(BaseModel):
    booking_id: str
    booked_until: str
    booked_until_iso: str
    current_time: str
    current_time_iso: str
    hourly_rate: float
    duration_hours: float
    used_hours: float
    unused_hours: float
    used_amount: float
    unused_amount: float
    cancellation_fee: float
    refund_amount: float
    booking_charge: float
    original_payment: float
    earned_amount: float
    parking_revenue: float
    payment_method: str

class EarlyExitResponse(BaseModel):
    booking_id: str
    status: str
    actual_end_time: str
    used_hours: float
    used_amount: float
    unused_amount: float
    cancellation_fee: float
    refund_amount: float
    booking_charge: float
    original_payment: float
    earned_amount: float
    refund_status: str
    refund_reference: str
    payment_method: str
    message: str

