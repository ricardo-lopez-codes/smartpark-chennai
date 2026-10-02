from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SensorResponse(BaseModel):
    id: int
    device_id: str
    magnetic_value: float
    vehicle_detected: bool
    last_updated: datetime

    class Config:
        from_attributes = True

class SlotResponse(BaseModel):
    id: int
    parking_lot_id: int
    slot_number: str
    status: str
    sensor_id: Optional[str] = None
    sensor: Optional[SensorResponse] = None

    class Config:
        from_attributes = True

class LotResponse(BaseModel):
    id: int
    area_id: int
    name: str
    address: str
    latitude: float
    longitude: float
    total_slots: int
    available_slots: int
    occupied_slots: int
    reserved_slots: int
    price_per_hour: float
    parking_type: str
    opening_time: str = "06:00"
    closing_time: str = "23:00"
    distance_km: Optional[float] = 1.5

    class Config:
        from_attributes = True

class AreaResponse(BaseModel):
    id: int
    name: str
    total_lots: int = 0
    total_available_slots: int = 0

    class Config:
        from_attributes = True
