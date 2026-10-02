from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class SlotCreate(BaseModel):
    slot_number: str
    slot_type: Optional[str] = "Car"
    zone: Optional[str] = "Zone A"
    floor: Optional[str] = "Ground Floor"
    price_per_hour: Optional[float] = None
    status: Optional[str] = "available"
    sensor_id: Optional[str] = None

class SlotUpdate(BaseModel):
    slot_number: Optional[str] = None
    slot_type: Optional[str] = None
    zone: Optional[str] = None
    floor: Optional[str] = None
    price_per_hour: Optional[float] = None
    status: Optional[str] = None
    sensor_id: Optional[str] = None

class LotUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    price_per_hour: Optional[float] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    facilities: Optional[str] = None
    max_duration_hours: Optional[int] = None
    cancellation_policy: Optional[str] = None

class NotificationMarkRead(BaseModel):
    notification_id: Optional[str] = None
