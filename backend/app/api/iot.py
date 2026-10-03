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

def verify_device_authorization(payload: IoTSensorPayload, x_iot_api_key: Optional[str] = None):
    # Optional API key verification if provided
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
    Physical ESP32 Sensor Hardware Endpoint.
    Ingests telemetry from wireless magnetometer nodes (ESP32-MAG) and updates physical bay occupancy.
    """
    verify_device_authorization(payload, x_iot_api_key)

    device_id = payload.device_id.strip()
    slot_num = (payload.slot_number or "").strip()

    # 1. Lookup slot by Sensor device_id
    slot = None
    sensor_rec = db.query(Sensor).filter(Sensor.device_id == device_id).first()
    if sensor_rec:
        slot = sensor_rec.slot

    # 2. Fallback: Lookup slot by ParkingSlot.sensor_id
    if not slot:
        slot = db.query(ParkingSlot).filter(ParkingSlot.sensor_id == device_id).first()

    # 3. Fallback: Lookup slot by parking_lot_id & slot_number if provided
    if not slot and payload.parking_lot_id and slot_num:
        slot = db.query(ParkingSlot).filter(
            ParkingSlot.parking_lot_id == payload.parking_lot_id,
            ParkingSlot.slot_number == slot_num
        ).first()

    # 4. Fallback: Lookup slot by slot_number alone if unique
    if not slot and slot_num:
        slots_found = db.query(ParkingSlot).filter(ParkingSlot.slot_number == slot_num).all()
        if len(slots_found) == 1:
            slot = slots_found[0]

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registered parking slot for device_id '{device_id}' not found."
        )

    # 5. Process state update
    updated_slot = await update_slot_sensor_status(
        db=db,
        slot_id=slot.id,
        status_val=payload.status,
        mag_val=payload.magnetic_value,
        vehicle_detected=payload.vehicle_detected,
        device_id_in=device_id
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    veh_det = updated_slot.sensor.vehicle_detected if updated_slot.sensor else (updated_slot.status == "occupied")
    mag_val = updated_slot.sensor.magnetic_value if updated_slot.sensor else 15.2

    return {
        "success": True,
        "message": f"Slot {updated_slot.slot_number} sensor state updated to {updated_slot.status}",
        "device_id": device_id,
        "slot_id": updated_slot.id,
        "slot_number": updated_slot.slot_number,
        "parking_lot_id": updated_slot.parking_lot_id,
        "computed_status": updated_slot.status,
        "vehicle_detected": veh_det,
        "magnetic_value": mag_val,
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
