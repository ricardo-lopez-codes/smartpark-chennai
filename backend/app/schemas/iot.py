from pydantic import BaseModel, Field
from typing import Optional

class IoTSensorPayload(BaseModel):
    gateway_id: Optional[str] = Field(None, description="Parent ESP32 Gateway ID e.g. PARK-ESP32-001")
    device_id: Optional[str] = Field(None, description="ESP32 device ID e.g. PARK-ESP32-001")
    slot: Optional[str] = Field(None, description="Slot identifier e.g. A1")
    slot_id: Optional[str] = Field(None, description="Slot identifier alias e.g. A01 or A1")
    slot_number: Optional[str] = Field(None, description="Parking slot number e.g. A1")
    parking_lot_id: Optional[int] = Field(None, description="Optional parking lot ID")
    status: Optional[str] = Field(None, description="Sensor status e.g. OCCUPIED or EMPTY")
    message: Optional[str] = Field(None, description="Status message text")
    occupied: Optional[bool] = Field(None, description="Boolean occupied flag")
    vehicle_detected: Optional[bool] = Field(None, description="Boolean vehicle detected flag")
    rssi: Optional[float] = Field(None, description="LoRa RSSI signal strength in dBm e.g. -67")
    snr: Optional[float] = Field(None, description="LoRa SNR signal to noise ratio in dB e.g. 9.5")
    packet_count: Optional[int] = Field(None, description="LoRa packet count e.g. 12")
    heartbeat: Optional[bool] = Field(None, description="Flag indicating if payload is periodic heartbeat")
    timestamp_ms: Optional[int] = Field(None, description="Uptime milliseconds from ESP32")
    magnetic_value: Optional[float] = Field(None, description="Magnetometer microtesla reading")
    distance_cm: Optional[float] = Field(None, description="Ultrasonic distance reading in cm")
    battery: Optional[int] = Field(None, description="Battery percentage (0-100)")
    api_key: Optional[str] = Field(None, description="Device security key")

class IoTSensorResponse(BaseModel):
    success: bool
    message: str
    gateway_id: Optional[str]
    device_id: str
    slot: str
    status: str
    last_seen: str
    rssi: Optional[float] = None
    snr: Optional[float] = None
    packet_count: Optional[int] = None
    heartbeat: Optional[bool] = None

class IoTStatusResponse(BaseModel):
    success: bool
    device_id: str
    slot: str
    status: str
    slot_status: str
    online: bool
    last_seen: str
    last_seen_seconds_ago: int
    rssi: Optional[float] = None
    snr: Optional[float] = None
    packet_count: Optional[int] = None
    heartbeat: Optional[bool] = None
    cloud_connected: bool = True
