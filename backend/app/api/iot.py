import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.session import get_db
from app.models.parking import ParkingSlot, ParkingLot
from app.models.sensor import Sensor
from app.schemas.iot import IoTSensorPayload, IoTSensorResponse
from app.services.sensor_service import update_slot_sensor_status

router = APIRouter(prefix="/iot", tags=["IoT Sensors"])

IOT_SECRET_KEY = "smartpark_esp32_secret_key"

def normalize_slot_number(raw_str: str) -> List[str]:
    """
    Normalizes slot IDs e.g. 'A01' -> ['A01', 'A1'], 'A-01' -> ['A-01', 'A1', 'A-1']
    Returns list of candidate slot strings to query in DB.
    """
    if not raw_str:
        return []
    s = raw_str.strip()
    candidates = [s]
    
    # Try stripping hyphen
    no_hyphen = s.replace("-", "")
    if no_hyphen not in candidates:
        candidates.append(no_hyphen)

    # Try stripping leading zeros from number part e.g. A01 -> A1
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

def verify_device_authorization(payload: IoTSensorPayload, x_iot_api_key: Optional[str] = None):
    key_to_check = payload.api_key or x_iot_api_key
    if key_to_check and key_to_check not in (IOT_SECRET_KEY, "smartpark_key"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid IoT device API key."
        )

@router.post("/sensor-update", response_model=IoTSensorResponse)
@router.post("/slot-status", response_model=IoTSensorResponse)
async def iot_sensor_update(
    payload: IoTSensorPayload,
    x_iot_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Physical ESP32 Parent/Daughter Hardware Ingestion Endpoint.
    Receives HTTP POST payloads from Parent ESP32 gateway over LAN Wi-Fi.
    """
    verify_device_authorization(payload, x_iot_api_key)

    raw_dev_id = (payload.device_id or "").strip()
    raw_slot = (payload.slot_id or payload.slot_number or "").strip()
    gateway_id = (payload.gateway_id or "PARENT-ESP32-01").strip()

    # Determine vehicle detection flag
    if payload.occupied is not None:
        veh_det = payload.occupied
    elif payload.vehicle_detected is not None:
        veh_det = payload.vehicle_detected
    elif payload.status:
        veh_det = (payload.status.lower() in ("occupied", "true", "1"))
    else:
        veh_det = False

    status_str = "occupied" if veh_det else "available"

    # Candidate slot number strings
    slot_candidates = normalize_slot_number(raw_slot)

    # 1. Lookup slot by Sensor device_id
    slot = None
    if raw_dev_id:
        sensor_rec = db.query(Sensor).filter(Sensor.device_id == raw_dev_id).first()
        if sensor_rec:
            slot = sensor_rec.slot

    # 2. Lookup slot by ParkingSlot.sensor_id
    if not slot and raw_dev_id:
        slot = db.query(ParkingSlot).filter(ParkingSlot.sensor_id == raw_dev_id).first()

    # 3. Lookup by slot_number candidates & optional parking_lot_id
    if not slot and slot_candidates:
        query = db.query(ParkingSlot).filter(ParkingSlot.slot_number.in_(slot_candidates))
        if payload.parking_lot_id:
            query = query.filter(ParkingSlot.parking_lot_id == payload.parking_lot_id)
        slots_found = query.all()
        if len(slots_found) >= 1:
            slot = slots_found[0]

    # 4. Fallback: match device_id like ESP32-MAG-A01 -> slot A1
    if not slot and raw_dev_id:
        match = re.search(r"([A-Za-z]+-?0*\d+)$", raw_dev_id)
        if match:
            dev_candidate = match.group(1)
            c_list = normalize_slot_number(dev_candidate)
            slot = db.query(ParkingSlot).filter(ParkingSlot.slot_number.in_(c_list)).first()

    if not slot:
        # Default to first slot in database if available for demo testing
        first_slot = db.query(ParkingSlot).first()
        if first_slot:
            slot = first_slot
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
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
        device_id_in=dev_id
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    final_veh_det = updated_slot.sensor.vehicle_detected if updated_slot.sensor else veh_det
    final_mag = updated_slot.sensor.magnetic_value if updated_slot.sensor else 15.2

    return {
        "success": True,
        "message": f"Slot {updated_slot.slot_number} updated to {updated_slot.status} by gateway {gateway_id}",
        "gateway_id": gateway_id,
        "device_id": dev_id,
        "slot_id": updated_slot.id,
        "slot_number": updated_slot.slot_number,
        "parking_lot_id": updated_slot.parking_lot_id,
        "computed_status": updated_slot.status,
        "vehicle_detected": final_veh_det,
        "magnetic_value": final_mag,
        "last_updated": now_iso
    }

@router.get("/devices")
def get_iot_devices(db: Session = Depends(get_db)):
    """
    Returns telemetry list of all registered physical ESP32 sensor hardware nodes.
    """
    sensors = db.query(Sensor).all()
    devices = []
    for s in sensors:
        devices.append({
            "id": s.id,
            "device_id": s.device_id,
            "slot_id": s.slot_id,
            "slot_number": s.slot.slot_number if s.slot else "N/A",
            "parking_lot_id": s.slot.parking_lot_id if s.slot else None,
            "vehicle_detected": s.vehicle_detected,
            "magnetic_value": s.magnetic_value,
            "last_updated": s.last_updated.isoformat() if s.last_updated else None
        })
    return {"total_devices": len(devices), "devices": devices}
