from pydantic import BaseModel, Field
from typing import Optional

class IoTSensorPayload(BaseModel):
    device_id: str = Field(..., description="Unique ESP32 device identifier, e.g., ESP32-MAG-01-A1")
    slot_number: Optional[str] = Field(None, description="Parking slot number, e.g., A1")
    parking_lot_id: Optional[int] = Field(None, description="Optional parking lot ID")
    status: Optional[str] = Field(None, description="Sensor status, e.g., occupied or available")
    vehicle_detected: Optional[bool] = Field(None, description="True if vehicle is present on sensor")
    magnetic_value: Optional[float] = Field(None, description="Magnetometer microtesla reading, e.g. 48.5 uT")
    distance_cm: Optional[float] = Field(None, description="Ultrasonic distance reading in cm")
    battery: Optional[int] = Field(None, description="Battery percentage (0-100)")
    api_key: Optional[str] = Field(None, description="Device security authentication key")

class IoTSensorResponse(BaseModel):
    success: bool
    message: str
    device_id: str
    slot_id: int
    slot_number: str
    parking_lot_id: int
    computed_status: str
    vehicle_detected: bool
    magnetic_value: float
    last_updated: str
