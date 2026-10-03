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
    slot_type: Optional[str] = "Car"
    price_per_hour: Optional[float] = None
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
    car_slots: int = 15
    bike_slots: int = 10
    car_price_per_hour: float = 40.0
    bike_price_per_hour: float = 20.0
    available_slots: int
    occupied_slots: int
    reserved_slots: int
    price_per_hour: float
    parking_type: str
    opening_time: str = "06:00"
    closing_time: str = "23:00"
    distance_km: Optional[float] = 1.5
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    facilities: List[str] = []
    description: Optional[str] = None
    cancellation_policy: Optional[str] = None

    class Config:
        from_attributes = True

class AreaResponse(BaseModel):
    id: int
    name: str
    total_lots: int = 0
    total_available_slots: int = 0

    class Config:
        from_attributes = True
