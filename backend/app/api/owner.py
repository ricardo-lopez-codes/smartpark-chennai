from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.database.session import get_db
from app.models.user import User
from app.models.parking import ParkingLot, ParkingSlot, ParkingArea
from app.models.booking import Booking, Payment
from app.services.auth import get_current_user
from app.services.sensor_service import update_slot_sensor_status
from app.schemas.owner import OwnerLotSettingsResponse, OwnerLotSettingsUpdate

router = APIRouter(prefix="/owner", tags=["Owner Portal"])

def get_owner_lot(db: Session, user: User) -> ParkingLot:
    if user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Owner role authorization required."
        )
    
    lot = db.query(ParkingLot).filter(ParkingLot.owner_id == user.id).first()
    if not lot:
        # Create a default lot for this owner if not present
        area = db.query(ParkingArea).first()
        area_id = area.id if area else 1
        
        lot = ParkingLot(
            area_id=area_id,
            name=f"{user.name}'s Parking Space",
            address="South Chennai Commercial Hub",
            latitude=13.0850,
            longitude=80.2101,
            total_slots=20,
            price_per_hour=40.0,
            parking_type="Owner Commercial Space",
            opening_time="06:00",
            closing_time="23:00",
            slot_prefix="A",
            slot_start_num=1,
            slot_end_num=20,
            owner_id=user.id,
            phone=user.phone or "+91 98765 43210",
            email=user.email
        )
        db.add(lot)
        db.commit()
        db.refresh(lot)

        # Generate slots A1 to A20
        for i in range(1, 21):
            slot = ParkingSlot(
                parking_lot_id=lot.id,
                slot_number=f"A{i}",
                status="available",
                zone="Zone A",
                price_per_hour=40.0,
                sensor_id=f"ESP32-MAG-{lot.id:02d}-A{i}"
            )
            db.add(slot)
        db.commit()

    return lot

@router.get("/overview")
def get_owner_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == lot.id).all()
    
    avail = sum(1 for s in slots if s.status == "available")
    occ = sum(1 for s in slots if s.status == "occupied")
    res = sum(1 for s in slots if s.status == "reserved")
    total = len(slots) or lot.total_slots or 1

    # Check today's bookings & revenue
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    today_bookings = db.query(Booking).filter(
        Booking.parking_lot_id == lot.id,
        Booking.booking_date == today_str
    ).all()

    today_revenue = sum(b.amount for b in today_bookings if b.status in ["ACTIVE", "CONFIRMED", "COMPLETED", "EXTENDED", "UPCOMING"])
    occupancy_pct = round(((occ + res) / total) * 100, 1)

    # Check if open right now
    open_h, open_m = [int(x) for x in (lot.opening_time or "06:00").split(":")]
    close_h, close_m = [int(x) for x in (lot.closing_time or "23:00").split(":")]
    curr_h, curr_m = now.hour, now.minute

    is_open = (open_h * 60 + open_m) <= (curr_h * 60 + curr_m) <= (close_h * 60 + close_m)

    return {
        "lot_id": lot.id,
        "company_name": lot.name,
        "address": lot.address,
        "opening_time": lot.opening_time,
        "closing_time": lot.closing_time,
        "is_open": is_open,
        "total_slots": total,
        "available_slots": avail,
        "occupied_slots": occ,
        "reserved_slots": res,
        "today_revenue": round(today_revenue, 2),
        "today_bookings_count": len(today_bookings),
        "occupancy_percent": occupancy_pct,
        "price_per_hour": lot.price_per_hour
    }

@router.get("/live-slots")
def get_owner_live_slots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == lot.id).all()
    
    results = []
    now = datetime.now(timezone.utc)

    for s in slots:
        # Find active or upcoming booking for this slot
        booking = db.query(Booking).filter(
            Booking.slot_id == s.id,
            Booking.status.in_(["UPCOMING", "ACTIVE", "EXTENDED"])
        ).first()

        booking_info = None
        if booking:
            booking_info = {
                "booking_id": booking.booking_id,
                "customer_name": booking.user.name if booking.user else "Customer",
                "customer_phone": booking.user.phone if booking.user else "+91 98765 43210",
                "vehicle_number": booking.user.vehicle_number if booking.user else "TN-09-AB-1234",
                "start_time": booking.start_time,
                "paid_end_time": booking.paid_end_time,
                "amount": booking.amount,
                "status": booking.status
            }

        results.append({
            "id": s.id,
            "slot_number": s.slot_number,
            "status": s.status,
            "zone": s.zone or "Zone A",
            "price_per_hour": s.price_per_hour or lot.price_per_hour,
            "booking": booking_info
        })

    return results

@router.get("/bookings")
def get_owner_bookings(
    time_filter: Optional[str] = Query("all"),
    status_filter: Optional[str] = Query("all"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    query = db.query(Booking).filter(Booking.parking_lot_id == lot.id)

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    tomorrow_str = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    if time_filter == "today":
        query = query.filter(Booking.booking_date == today_str)
    elif time_filter == "tomorrow":
        query = query.filter(Booking.booking_date == tomorrow_str)
    elif time_filter == "this_week":
        start_week = now - timedelta(days=now.weekday())
        query = query.filter(Booking.created_at >= start_week)

    if status_filter and status_filter != "all":
        query = query.filter(Booking.status == status_filter.upper())

    bookings = query.order_by(Booking.created_at.desc()).all()

    results = []
    for b in bookings:
        results.append({
            "id": b.id,
            "booking_id": b.booking_id,
            "customer_name": b.user.name if b.user else "Customer",
            "customer_phone": b.user.phone if b.user else "+91 98765 43210",
            "vehicle_number": b.user.vehicle_number if b.user else "TN-09-AB-1234",
            "slot_number": b.slot.slot_number if b.slot else "A1",
            "booking_date": b.booking_date,
            "start_time": b.start_time,
            "paid_end_time": b.paid_end_time,
            "duration_hours": b.duration_hours,
            "amount": b.amount,
            "status": b.status
        })

    return results

@router.get("/calendar")
def get_owner_calendar(
    date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    now = datetime.now(timezone.utc)
    target_date = date or now.strftime("%Y-%m-%d")

    slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == lot.id).all()
    total_slots = len(slots) or lot.total_slots or 0

    # Fetch real DB bookings for this owner's lot on target_date
    bookings = db.query(Booking).filter(
        Booking.parking_lot_id == lot.id,
        Booking.booking_date == target_date,
        Booking.status.in_(["UPCOMING", "ACTIVE", "COMPLETED", "EXTENDED", "PAID", "CONFIRMED"])
    ).all()

    total_bookings = len(bookings)
    expected_revenue = round(sum(b.amount for b in bookings), 2)
    booked_slot_ids = set(b.slot_id for b in bookings)
    available_bays = max(0, total_slots - len(booked_slot_ids))
    expected_occupancy_pct = round((len(booked_slot_ids) / max(1, total_slots)) * 100, 1)

    # 6 Standard 3-hour windows for hourly density
    time_windows = [
        ("06:00", "09:00", 6, 9),
        ("09:00", "12:00", 9, 12),
        ("12:00", "15:00", 12, 15),
        ("15:00", "18:00", 15, 18),
        ("18:00", "21:00", 18, 21),
        ("21:00", "00:00", 21, 24)
    ]

    hourly_density = []
    max_b_count = 0
    peak_hours_str = "No bookings"

    for label_start, label_end, start_h, end_h in time_windows:
        w_bookings = []
        w_slots = set()
        for b in bookings:
            # Parse start and end hours for booking
            b_start_h = b.start_time.hour if b.start_time else 10
            b_end_h = b.paid_end_time.hour if b.paid_end_time else b_start_h + (b.duration_hours or 2)
            if b_start_h < end_h and b_end_h > start_h:
                w_bookings.append(b)
                w_slots.add(b.slot_id)

        w_b_count = len(w_bookings)
        w_rev = round(sum(b.amount for b in w_bookings), 2)
        w_occ = round((len(w_slots) / max(1, total_slots)) * 100, 1)

        if w_b_count > max_b_count:
            max_b_count = w_b_count
            peak_hours_str = f"{label_start} – {label_end}"

        hourly_density.append({
            "start": label_start,
            "end": label_end,
            "hour": f"{label_start} - {label_end}",
            "bookings": w_b_count,
            "occupancy": w_occ,
            "revenue": w_rev
        })

    return {
        "parking_lot": {
            "id": lot.id,
            "name": lot.name,
            "address": lot.address,
            "total_slots": total_slots
        },
        "date": target_date,
        "total_bookings": total_bookings,
        "expected_occupancy": expected_occupancy_pct,
        "available_bays": available_bays,
        "expected_revenue": expected_revenue,
        "metrics": {
            "total_bookings": total_bookings,
            "expected_occupancy_pct": expected_occupancy_pct,
            "available_slots": available_bays,
            "expected_revenue": expected_revenue,
            "peak_hours": peak_hours_str
        },
        "hourly_density": hourly_density
    }

@router.get("/revenue")
def get_owner_revenue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    all_bookings = db.query(Booking).filter(Booking.parking_lot_id == lot.id).all()

    today_rev = sum(b.amount for b in all_bookings if b.booking_date == today_str)
    
    start_week = now - timedelta(days=7)
    weekly_rev = sum(b.amount for b in all_bookings if b.created_at and b.created_at.replace(tzinfo=timezone.utc) >= start_week)

    start_month = now - timedelta(days=30)
    monthly_rev = sum(b.amount for b in all_bookings if b.created_at and b.created_at.replace(tzinfo=timezone.utc) >= start_month)

    # Daily trend data
    daily_trend = []
    for i in range(6, -1, -1):
        d_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        d_name = (now - timedelta(days=i)).strftime("%a")
        r_val = sum(b.amount for b in all_bookings if b.booking_date == d_str)
        daily_trend.append({"day": d_name, "date": d_str, "revenue": round(r_val, 2)})

    return {
        "today_revenue": round(today_rev, 2),
        "weekly_revenue": round(weekly_rev, 2),
        "monthly_revenue": round(monthly_rev, 2),
        "payment_breakdown": {
            "upi_percent": 65,
            "card_percent": 35
        },
        "daily_trend": daily_trend
    }

@router.get("/slots")
def get_owner_slots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == lot.id).all()
    return slots

@router.put("/slots/{slot_id}")
def update_owner_slot(
    slot_id: int,
    status_val: Optional[str] = Query(None, alias="status"),
    price_val: Optional[float] = Query(None, alias="price"),
    zone_val: Optional[str] = Query(None, alias="zone"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id, ParkingSlot.parking_lot_id == lot.id).first()
    
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found or unauthorized.")

    if status_val:
        slot.status = status_val
        if slot.sensor:
            slot.sensor.vehicle_detected = (status_val == "occupied")
    if price_val is not None:
        slot.price_per_hour = price_val
    if zone_val:
        slot.zone = zone_val

    db.commit()
    db.refresh(slot)
    return slot

@router.get("/analytics")
def get_owner_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == lot.id).all()
    occ = sum(1 for s in slots if s.status in ["occupied", "reserved"])
    total = len(slots) or 1

    return {
        "occupancy_rate": round((occ / total) * 100, 1),
        "peak_hours": "6:00 PM – 8:00 PM (89% occupancy)",
        "avg_duration_hours": 2.4,
        "revenue_per_slot": round(lot.price_per_hour * 4.5, 2),
        "most_used_slots": [s.slot_number for s in slots[:3]],
        "cancellation_rate": "2.8%"
    }

@router.get("/notifications")
def get_owner_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    now = datetime.now(timezone.utc)

    # Operational parking notifications only (NO IoT health!)
    return [
        {
            "id": 1,
            "title": "New Booking Confirmed",
            "message": f"Slot A1 booked for 2 hours at {lot.name}.",
            "time": "5 mins ago",
            "type": "success"
        },
        {
            "id": 2,
            "title": "Payment Authorization",
            "message": "Payment of ₹90 received via Razorpay UPI.",
            "time": "25 mins ago",
            "type": "info"
        },
        {
            "id": 3,
            "title": "High Occupancy Alert",
            "message": f"{lot.name} is currently at 85% occupancy.",
            "time": "1 hour ago",
            "type": "warning"
        }
    ]

def parse_facilities(fac_str: Optional[str]) -> List[str]:
    if not fac_str:
        return []
    if fac_str.startswith("["):
        try:
            import json
            parsed = json.loads(fac_str)
            if isinstance(parsed, list):
                return [str(x) for x in parsed]
        except Exception:
            pass
    return [f.strip() for f in fac_str.split(",") if f.strip()]

def format_lot_settings_response(lot: ParkingLot, user: User) -> dict:
    slots = lot.slots or []
    tot = len(slots) if slots else (lot.total_slots or 20)
    prefix = lot.slot_prefix or "A"
    start_num = lot.slot_start_num or 1
    end_num = lot.slot_end_num or (start_num + tot - 1)

    return {
        "owner_id": user.id,
        "parking_lot_id": lot.id,
        "company_name": lot.name,
        "contact_person": lot.contact_person or user.name,
        "phone": lot.phone or user.phone or "+91 98765 43210",
        "email": lot.email or user.email,
        "address": lot.address,
        "total_slots": tot,
        "slot_prefix": prefix,
        "slot_start": start_num,
        "slot_end": end_num,
        "opening_time": lot.opening_time or "06:00",
        "closing_time": lot.closing_time or "23:00",
        "price_per_hour": lot.price_per_hour or 40.0,
        "facilities": parse_facilities(lot.facilities),
        "description": lot.description or "Multi-level covered smart parking facility with 24/7 CCTV & EV Charging.",
        "cancellation_policy": lot.cancellation_policy or "Full refund minus 1 hour parking fee if cancelled before start time."
    }

@router.get("/lot-settings", response_model=OwnerLotSettingsResponse)
@router.get("/settings", response_model=OwnerLotSettingsResponse)
def get_owner_lot_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    return format_lot_settings_response(lot, current_user)

@router.put("/lot-settings", response_model=OwnerLotSettingsResponse)
@router.put("/settings", response_model=OwnerLotSettingsResponse)
def update_owner_lot_settings(
    payload: Optional[OwnerLotSettingsUpdate] = None,
    company_name: Optional[str] = Query(None),
    contact_person: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    address: Optional[str] = Query(None),
    total_slots: Optional[int] = Query(None),
    slot_prefix: Optional[str] = Query(None),
    slot_start: Optional[int] = Query(None),
    slot_end: Optional[int] = Query(None),
    opening_time: Optional[str] = Query(None),
    closing_time: Optional[str] = Query(None),
    price_per_hour: Optional[float] = Query(None),
    description: Optional[str] = Query(None),
    cancellation_policy: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)

    # Extract values prioritizing payload body then query parameters
    comp_name = payload.company_name if (payload and payload.company_name is not None) else company_name
    cont_person = payload.contact_person if (payload and payload.contact_person is not None) else contact_person
    ph = payload.phone if (payload and payload.phone is not None) else phone
    em = payload.email if (payload and payload.email is not None) else email
    addr = payload.address if (payload and payload.address is not None) else address
    op_time = payload.opening_time if (payload and payload.opening_time is not None) else opening_time
    cl_time = payload.closing_time if (payload and payload.closing_time is not None) else closing_time
    price = payload.price_per_hour if (payload and payload.price_per_hour is not None) else price_per_hour
    facs = payload.facilities if (payload and payload.facilities is not None) else None
    desc = payload.description if (payload and payload.description is not None) else description
    canc_pol = payload.cancellation_policy if (payload and payload.cancellation_policy is not None) else cancellation_policy
    tot_slots = payload.total_slots if (payload and payload.total_slots is not None) else total_slots
    s_prefix = payload.slot_prefix if (payload and payload.slot_prefix is not None) else slot_prefix
    s_start = payload.slot_start if (payload and payload.slot_start is not None) else slot_start
    s_end = payload.slot_end if (payload and payload.slot_end is not None) else slot_end

    if comp_name:
        lot.name = comp_name
    if cont_person:
        lot.contact_person = cont_person
    if ph:
        lot.phone = ph
        current_user.phone = ph
    if em:
        lot.email = em
    if addr:
        lot.address = addr
    if op_time:
        lot.opening_time = op_time
    if cl_time:
        lot.closing_time = cl_time
    if price is not None:
        lot.price_per_hour = price
    if desc:
        lot.description = desc
    if canc_pol:
        lot.cancellation_policy = canc_pol
    if facs is not None:
        if isinstance(facs, list):
            lot.facilities = ", ".join(facs)
        else:
            lot.facilities = str(facs)

    # Re-configure slots safely
    if any(x is not None for x in [tot_slots, s_prefix, s_start, s_end]):
        prefix = (s_prefix or lot.slot_prefix or "A").upper().strip()
        start_num = s_start if s_start is not None else (lot.slot_start_num or 1)
        
        if s_end is not None:
            end_num = s_end
            count = max(1, end_num - start_num + 1)
        elif tot_slots is not None:
            count = max(1, tot_slots)
            end_num = start_num + count - 1
        else:
            end_num = lot.slot_end_num or (start_num + (lot.total_slots or 20) - 1)
            count = max(1, end_num - start_num + 1)

        new_slot_numbers = [f"{prefix}{i}" for i in range(start_num, end_num + 1)]
        existing_slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == lot.id).all()
        existing_map = {s.slot_number: s for s in existing_slots}

        for num_str in new_slot_numbers:
            if num_str not in existing_map:
                new_slot = ParkingSlot(
                    parking_lot_id=lot.id,
                    slot_number=num_str,
                    status="available",
                    zone=f"Zone {prefix}",
                    price_per_hour=lot.price_per_hour,
                    sensor_id=f"ESP32-MAG-{lot.id:02d}-{num_str}"
                )
                db.add(new_slot)
            else:
                ex_slot = existing_map[num_str]
                if ex_slot.status == "unavailable":
                    ex_slot.status = "available"

        new_num_set = set(new_slot_numbers)
        for ex_slot in existing_slots:
            if ex_slot.slot_number not in new_num_set:
                has_bookings = db.query(Booking).filter(Booking.slot_id == ex_slot.id).first() is not None
                if has_bookings:
                    ex_slot.status = "unavailable"
                else:
                    db.delete(ex_slot)

        lot.slot_prefix = prefix
        lot.slot_start_num = start_num
        lot.slot_end_num = end_num
        lot.total_slots = len(new_slot_numbers)

    db.commit()
    db.refresh(lot)
    return format_lot_settings_response(lot, current_user)
