from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta, time
from app.database.session import get_db
from app.models.parking import ParkingLot, ParkingSlot, ParkingArea
from app.models.booking import Booking
from app.schemas.parking import LotResponse, SlotResponse
from app.services.booking_service import check_slot_availability_for_range

router = APIRouter(prefix="/parking-lots", tags=["Parking"])

@router.get("", response_model=List[LotResponse])
def get_parking_lots(
    area_id: Optional[int] = Query(None),
    area_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ParkingLot)

    if area_id:
        query = query.filter(ParkingLot.area_id == area_id)
    elif area_name:
        area = db.query(ParkingArea).filter(ParkingArea.name.ilike(f"%{area_name}%")).first()
        if area:
            query = query.filter(ParkingLot.area_id == area.id)

    if search:
        query = query.filter(
            (ParkingLot.name.ilike(f"%{search}%")) | 
            (ParkingLot.address.ilike(f"%{search}%"))
        )

    lots = query.all()
    results = []

    for lot in lots:
        slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == lot.id).all()
        avail = sum(1 for s in slots if s.status == "available")
        occ = sum(1 for s in slots if s.status == "occupied")
        res = sum(1 for s in slots if s.status == "reserved")

        results.append({
            "id": lot.id,
            "area_id": lot.area_id,
            "name": lot.name,
            "address": lot.address,
            "latitude": lot.latitude,
            "longitude": lot.longitude,
            "total_slots": lot.total_slots,
            "available_slots": avail,
            "occupied_slots": occ,
            "reserved_slots": res,
            "price_per_hour": lot.price_per_hour,
            "parking_type": lot.parking_type,
            "opening_time": lot.opening_time or "06:00",
            "closing_time": lot.closing_time or "23:00",
            "distance_km": round(1.2 + (lot.id * 0.3) % 2.5, 1)
        })

    return results

@router.get("/{id}", response_model=LotResponse)
def get_parking_lot(id: int, db: Session = Depends(get_db)):
    lot = db.query(ParkingLot).filter(ParkingLot.id == id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")

    slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == lot.id).all()
    avail = sum(1 for s in slots if s.status == "available")
    occ = sum(1 for s in slots if s.status == "occupied")
    res = sum(1 for s in slots if s.status == "reserved")

    return {
        "id": lot.id,
        "area_id": lot.area_id,
        "name": lot.name,
        "address": lot.address,
        "latitude": lot.latitude,
        "longitude": lot.longitude,
        "total_slots": lot.total_slots,
        "available_slots": avail,
        "occupied_slots": occ,
        "reserved_slots": res,
        "price_per_hour": lot.price_per_hour,
        "parking_type": lot.parking_type,
        "opening_time": lot.opening_time or "06:00",
        "closing_time": lot.closing_time or "23:00",
        "distance_km": round(1.2 + (lot.id * 0.3) % 2.5, 1)
    }

@router.get("/{id}/slots", response_model=List[SlotResponse])
def get_parking_lot_slots(id: int, db: Session = Depends(get_db)):
    lot = db.query(ParkingLot).filter(ParkingLot.id == id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")

    slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == id).all()
    return slots

@router.get("/{id}/availability")
def get_parking_lot_availability(
    id: int,
    date_str: str = Query(..., alias="date"),
    start_time_str: str = Query(..., alias="start_time"),
    duration: int = Query(2, alias="duration"),
    db: Session = Depends(get_db)
):
    lot = db.query(ParkingLot).filter(ParkingLot.id == id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")

    try:
        d_parts = [int(x) for x in date_str.split("-")]
        t_parts = [int(x) for x in start_time_str.split(":")]
        req_start = datetime(d_parts[0], d_parts[1], d_parts[2], t_parts[0], t_parts[1], tzinfo=timezone.utc)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date or start_time format. Use YYYY-MM-DD and HH:MM.")

    now = datetime.now(timezone.utc)
    req_paid_end = req_start + timedelta(hours=duration)
    req_buffer_end = req_paid_end + timedelta(hours=1)

    slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == lot.id).all()
    results = []
    avail_count = 0

    is_current_window = (abs((req_start - now).total_seconds()) < 1800)

    for s in slots:
        calc_status = check_slot_availability_for_range(
            db=db,
            slot_id=s.id,
            req_start=req_start,
            req_buffer_end=req_buffer_end,
            is_current_slot_check=is_current_window
        )
        if calc_status == "available":
            avail_count += 1

        results.append({
            "id": s.id,
            "parking_lot_id": s.parking_lot_id,
            "slot_number": s.slot_number,
            "status": calc_status,
            "sensor_id": s.sensor_id,
            "sensor": {
                "id": s.sensor.id,
                "device_id": s.sensor.device_id,
                "magnetic_value": s.sensor.magnetic_value,
                "vehicle_detected": s.sensor.vehicle_detected,
                "last_updated": s.sensor.last_updated
            } if s.sensor else None
        })

    return {
        "parking_lot_id": lot.id,
        "date": date_str,
        "start_time": start_time_str,
        "duration": duration,
        "opening_time": lot.opening_time or "06:00",
        "closing_time": lot.closing_time or "23:00",
        "total_slots": lot.total_slots,
        "available_slots": avail_count,
        "slots": results
    }
