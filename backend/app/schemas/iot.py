from pydantic import BaseModel, Field
from typing import Optional

class IoTSensorPayload(BaseModel):
    gateway_id: Optional[str] = Field(None, description="Parent ESP32 Gateway ID e.g. PARENT-ESP32-01")
    device_id: Optional[str] = Field(None, description="Daughter ESP32 device ID e.g. ESP32-MAG-A01")
    slot_id: Optional[str] = Field(None, description="Slot identifier alias e.g. A01 or A1")
    slot_number: Optional[str] = Field(None, description="Parking slot number e.g. A1")
    parking_lot_id: Optional[int] = Field(None, description="Optional parking lot ID")
    status: Optional[str] = Field(None, description="Sensor status e.g. occupied or available")
    occupied: Optional[bool] = Field(None, description="Boolean occupied flag from daughter ESP32")
    vehicle_detected: Optional[bool] = Field(None, description="Boolean vehicle detected flag from daughter ESP32")
    magnetic_value: Optional[float] = Field(None, description="Magnetometer microtesla reading e.g. 842 or 48.5 uT")
    distance_cm: Optional[float] = Field(None, description="Ultrasonic distance reading in cm")
    battery: Optional[int] = Field(None, description="Battery percentage (0-100)")
    api_key: Optional[str] = Field(None, description="Device security key")

class IoTSensorResponse(BaseModel):
    success: bool
    message: str
    gateway_id: Optional[str]
    device_id: str
    slot_id: int
    slot_number: str
    parking_lot_id: int
    computed_status: str
    vehicle_detected: bool
    magnetic_value: float
    last_updated: str
