from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BookingCreate(BaseModel):
    parking_lot_id: int
    slot_id: int
    booking_date: Optional[str] = None  # YYYY-MM-DD
    start_time_str: Optional[str] = None  # HH:MM e.g. "18:00"
    duration_hours: int = Field(..., ge=1, le=5)

class BookingExtend(BaseModel):
    additional_hours: int = Field(1, ge=1, le=1)

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
    razorpay_order_id: str
    amount: float
    status: str

    class Config:
        from_attributes = True

class BookingResponse(BaseModel):
    id: int
    booking_id: str
    user_id: int
    parking_lot_id: int
    slot_id: int
    booking_date: Optional[str] = None
    duration_hours: int = 2
    parking_lot_name: str
    parking_address: str
    area_name: str
    slot_number: str
    start_time: datetime
    paid_end_time: datetime
    buffer_end_time: datetime
    actual_end_time: Optional[datetime] = None
    remaining_seconds: int
    seconds_until_start: Optional[int] = 0
    status: str
    amount: float
    payment_id: Optional[str] = None
    created_at: datetime
    latitude: float
    longitude: float
    opening_time: Optional[str] = "06:00"
    closing_time: Optional[str] = "23:00"

    class Config:
        from_attributes = True
