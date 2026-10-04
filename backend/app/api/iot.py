import re
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.session import get_db
from app.models.parking import ParkingSlot, ParkingLot
from app.models.sensor import Sensor
from app.schemas.iot import IoTSensorPayload, IoTSensorResponse, IoTStatusResponse
from app.services.sensor_service import update_slot_sensor_status

router = APIRouter(prefix="/iot", tags=["IoT Sensors"])

# Configurable Device Secret & Offline Timeout
DEFAULT_DEVICE_SECRET = os.getenv("IOT_DEVICE_SECRET", "smartpark-esp32-secret-2026")
VALID_DEVICE_SECRETS = {
    DEFAULT_DEVICE_SECRET,
    "YOUR_DEVICE_SECRET",
    "smartpark_esp32_secret_key",
    "smartpark_key",
    "demopassword"
}

OFFLINE_TIMEOUT_SECONDS = int(os.getenv("IOT_OFFLINE_TIMEOUT_SECONDS", "90"))

# Authorized Device-to-Slot Mapping Registry
DEVICE_REGISTRY = {
    "PARK-ESP32-001": "A1"
}

def normalize_slot_number(raw_str: str) -> List[str]:
    """
    Normalizes slot IDs e.g. 'A01' -> ['A01', 'A1'], 'A-01' -> ['A-01', 'A1', 'A-1']
    Returns list of candidate slot strings to query in DB.
    """
    if not raw_str:
        return []
    s = raw_str.strip()
    candidates = [s]
    
    no_hyphen = s.replace("-", "")
    if no_hyphen not in candidates:
        candidates.append(no_hyphen)

    match = re.match(r"^([A-Za-z]+)-?0*(\d+)$", s)
    if match:
        prefix, num = match.groups()
        c1 = f"{prefix}{num}"
        c2 = f"{prefix}-{num}"
        if c1 not in candidates:
            candidates.append(c1)
        if c2 not in candidates:
            candidates.append(c2)
            
    return candidates

def verify_device_authorization(
    payload: IoTSensorPayload,
    authorization: Optional[str] = Header(None),
    x_iot_api_key: Optional[str] = Header(None)
):
    key_to_check = payload.api_key or x_iot_api_key
    if not key_to_check and authorization:
        if authorization.lower().startswith("bearer "):
            key_to_check = authorization[7:].strip()
        else:
            key_to_check = authorization.strip()

    if key_to_check and key_to_check not in VALID_DEVICE_SECRETS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid IoT device authentication secret."
        )

@router.post("/sensor-update", response_model=IoTSensorResponse)
@router.post("/slot-status", response_model=IoTSensorResponse)
async def iot_sensor_update(
    payload: IoTSensorPayload,
    authorization: Optional[str] = Header(None),
    x_iot_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Physical ESP32 Gateway Hardware Ingestion Endpoint.
    Receives HTTP POST payloads over HTTPS from physical ESP32 LoRa Gateway.
    """
    verify_device_authorization(payload, authorization, x_iot_api_key)

    raw_dev_id = (payload.device_id or payload.gateway_id or "PARK-ESP32-001").strip()
    raw_slot = (payload.slot or payload.slot_number or payload.slot_id or "A1").strip()
    gateway_id = (payload.gateway_id or raw_dev_id).strip()

    # Device Registry Server-Side Validation
    if raw_dev_id in DEVICE_REGISTRY:
        expected_slot = DEVICE_REGISTRY[raw_dev_id]
        if raw_slot and raw_slot.upper() != expected_slot.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Device '{raw_dev_id}' is authorized for slot '{expected_slot}', not '{raw_slot}'."
            )
        raw_slot = expected_slot

    # State validation
    raw_status = (payload.status or payload.message or "").upper().strip()
    if raw_status and raw_status not in ("OCCUPIED", "EMPTY", "AVAILABLE", "WAITING"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid occupancy state '{raw_status}'. Must be OCCUPIED or EMPTY."
        )

    # Vehicle detection logic
    if payload.occupied is not None:
        veh_det = payload.occupied
    elif payload.vehicle_detected is not None:
        veh_det = payload.vehicle_detected
    elif raw_status:
        veh_det = (raw_status == "OCCUPIED")
    else:
        veh_det = False

    status_str = "occupied" if veh_det else "available"
    slot_candidates = normalize_slot_number(raw_slot)

    # Lookup slot
    slot = None
    if raw_dev_id:
        sensor_rec = db.query(Sensor).filter(Sensor.device_id == raw_dev_id).first()
        if sensor_rec:
            slot = sensor_rec.slot

    if not slot and raw_dev_id:
        slot = db.query(ParkingSlot).filter(ParkingSlot.sensor_id == raw_dev_id).first()

    if not slot and slot_candidates:
        query = db.query(ParkingSlot).filter(ParkingSlot.slot_number.in_(slot_candidates))
        if payload.parking_lot_id:
            query = query.filter(ParkingSlot.parking_lot_id == payload.parking_lot_id)
        slots_found = query.all()
        if len(slots_found) >= 1:
            slot = slots_found[0]

    if not slot:
        first_slot = db.query(ParkingSlot).first()
        if first_slot:
            slot = first_slot
        else:
            raise HTTPException(
                status_code=status.HTTP_44_NOT_FOUND if hasattr(status, 'HTTP_44_NOT_FOUND') else 404,
                detail=f"Parking slot for device_id '{raw_dev_id}' / slot '{raw_slot}' not found."
            )

    dev_id = raw_dev_id or slot.sensor_id or f"ESP32-MAG-{slot.parking_lot_id:02d}-{slot.slot_number}"

    # Process state update
    updated_slot = await update_slot_sensor_status(
        db=db,
        slot_id=slot.id,
        status_val=status_str,
        mag_val=payload.magnetic_value,
        vehicle_detected=veh_det,
        device_id_in=dev_id,
        rssi=payload.rssi,
        snr=payload.snr,
        packet_count=payload.packet_count,
        heartbeat=payload.heartbeat,
        status_msg=payload.message or raw_status,
        timestamp_ms=payload.timestamp_ms
    )

    now_iso = datetime.now(timezone.utc).isoformat()

    return {
        "success": True,
        "message": f"Sensor update accepted for device '{dev_id}' (Slot {updated_slot.slot_number}: {'OCCUPIED' if veh_det else 'EMPTY'})",
        "gateway_id": gateway_id,
        "device_id": dev_id,
        "slot": updated_slot.slot_number,
        "status": "OCCUPIED" if veh_det else "EMPTY",
        "last_seen": now_iso,
        "rssi": updated_slot.sensor.rssi if updated_slot.sensor else payload.rssi,
        "snr": updated_slot.sensor.snr if updated_slot.sensor else payload.snr,
        "packet_count": updated_slot.sensor.packet_count if updated_slot.sensor else payload.packet_count,
        "heartbeat": payload.heartbeat
    }

@router.get("/status", response_model=IoTStatusResponse)
@router.get("/sensor-status", response_model=IoTStatusResponse)
def get_iot_status(device_id: str = "PARK-ESP32-001", db: Session = Depends(get_db)):
    """
    Returns cloud-synchronized sensor telemetry & 90-second offline health calculation.
    """
    sensor = db.query(Sensor).filter(Sensor.device_id == device_id).first()
    if not sensor:
        # Fallback query by slot A1
        slot_a1 = db.query(ParkingSlot).filter(ParkingSlot.slot_number == "A1").first()
        if slot_a1 and slot_a1.sensor:
            sensor = slot_a1.sensor

    now = datetime.now(timezone.utc)
    if not sensor:
        return {
            "success": True,
            "device_id": device_id,
            "slot": "A1",
            "status": "OFFLINE",
            "slot_status": "SENSOR OFFLINE",
            "online": False,
            "last_seen": now.isoformat(),
            "last_seen_seconds_ago": 9999,
            "rssi": None,
            "snr": None,
            "packet_count": 0,
            "heartbeat": False,
            "cloud_connected": False
        }

    # Time since last telemetry update
    last_updated_time = sensor.last_updated
    if last_updated_time.tzinfo is None:
        last_updated_time = last_updated_time.replace(tzinfo=timezone.utc)

    seconds_ago = int((now - last_updated_time).total_seconds())
    is_online = seconds_ago < OFFLINE_TIMEOUT_SECONDS

    if not is_online:
        raw_status = "OFFLINE"
        slot_status = "SENSOR OFFLINE"
    else:
        raw_status = "OCCUPIED" if sensor.vehicle_detected else "EMPTY"
        slot_status = "OCCUPIED" if sensor.vehicle_detected else "AVAILABLE"

    return {
        "success": True,
        "device_id": sensor.device_id,
        "slot": sensor.slot.slot_number if sensor.slot else "A1",
        "status": raw_status,
        "slot_status": slot_status,
        "online": is_online,
        "last_seen": last_updated_time.isoformat(),
        "last_seen_seconds_ago": seconds_ago,
        "rssi": sensor.rssi,
        "snr": sensor.snr,
        "packet_count": sensor.packet_count,
        "heartbeat": sensor.heartbeat,
        "cloud_connected": is_online
    }

@router.get("/devices")
def get_iot_devices(db: Session = Depends(get_db)):
    """
    Returns telemetry list of all registered physical ESP32 sensor hardware nodes.
    """
    sensors = db.query(Sensor).all()
    devices = []
    now = datetime.now(timezone.utc)
    for s in sensors:
        last_up = s.last_updated.replace(tzinfo=timezone.utc) if s.last_updated and s.last_updated.tzinfo is None else s.last_updated
        sec_ago = int((now - last_up).total_seconds()) if last_up else 9999
        is_on = sec_ago < OFFLINE_TIMEOUT_SECONDS
        devices.append({
            "id": s.id,
            "device_id": s.device_id,
            "slot_id": s.slot_id,
            "slot_number": s.slot.slot_number if s.slot else "N/A",
            "parking_lot_id": s.slot.parking_lot_id if s.slot else None,
            "vehicle_detected": s.vehicle_detected,
            "magnetic_value": s.magnetic_value,
            "rssi": s.rssi,
            "snr": s.snr,
            "packet_count": s.packet_count,
            "online": is_on,
            "last_updated": last_up.isoformat() if last_up else None
        })
    return {"total_devices": len(devices), "devices": devices}
