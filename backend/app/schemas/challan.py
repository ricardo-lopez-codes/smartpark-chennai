from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FineChallanResponse(BaseModel):
    id: int
    challan_id: str
    user_id: int
    parking_lot_id: Optional[int] = None
    booking_id: Optional[str] = None
    vehicle_number: str
    violation_type: str
    violation_reason: str
    slot_number: Optional[str] = None
    assigned_slot_number: Optional[str] = None
    hourly_rent_rate: float
    fine_multiplier: float
    fine_rate_per_hour: float
    duration_hours: float
    fine_amount: float
    status: str
    issued_at: datetime
    paid_at: Optional[datetime] = None
    payment_reference: Optional[str] = None

    class Config:
        from_attributes = True

class PayChallanRequest(BaseModel):
    payment_method: Optional[str] = "WALLET" # WALLET, RAZORPAY
