from pydantic import BaseModel
from typing import Optional

class SensorUpdateSchema(BaseModel):
    slot_id: int
    status: str  # available, occupied, reserved, unavailable
    magnetic_value: Optional[float] = 15.2
    vehicle_detected: Optional[bool] = None

class JumpTimeSchema(BaseModel):
    booking_id: int
    target_state: str  # "15_MIN_REMAINING", "EXPIRED", "ACTIVE"

class DemoActionSchema(BaseModel):
    action: str  # "OCCUPY_SLOT", "FREE_SLOT", "SIMULATE_PAYMENT_SUCCESS", "SIMULATE_PAYMENT_FAIL", "JUMP_15_MIN", "EXPIRE_BOOKING"
    slot_id: Optional[int] = None
    booking_id: Optional[int] = None
