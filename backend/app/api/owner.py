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

    today_revenue = sum(b.amount for b in today_bookings if b.status in ["ACTIVE", "COMPLETED", "EXTENDED", "UPCOMING"])
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
    view_type: Optional[str] = Query("month"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    now = datetime.now(timezone.utc)
    
    # Generate calendar day summaries for the next 14 days
    days = []
    for i in range(14):
        target_date = (now + timedelta(days=i)).strftime("%Y-%m-%d")
        b_count = db.query(Booking).filter(
            Booking.parking_lot_id == lot.id,
            Booking.booking_date == target_date,
            Booking.status.in_(["UPCOMING", "ACTIVE", "COMPLETED", "EXTENDED"])
        ).count()

        rev = sum(b.amount for b in db.query(Booking).filter(
            Booking.parking_lot_id == lot.id,
            Booking.booking_date == target_date
        ).all())

        days.append({
            "date": target_date,
            "day_name": (now + timedelta(days=i)).strftime("%a"),
            "bookings_count": b_count,
            "projected_revenue": round(rev, 2),
            "expected_occupancy": min(100, int((b_count / max(1, lot.total_slots)) * 100))
        })

    return {
        "view": view_type,
        "total_lots": 1,
        "days": days
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

@router.get("/settings")
def get_owner_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    return {
        "company_name": lot.name,
        "person_name": current_user.name,
        "phone": current_user.phone or lot.phone,
        "email": current_user.email,
        "address": lot.address,
        "opening_time": lot.opening_time,
        "closing_time": lot.closing_time,
        "price_per_hour": lot.price_per_hour,
        "total_slots": lot.total_slots,
        "slot_range": f"{lot.slot_prefix or 'A'}{lot.slot_start_num or 1}-{lot.slot_prefix or 'A'}{lot.slot_end_num or lot.total_slots}",
        "parking_rules": "Covered parking. Valid ticket required. Max 8 hours per session."
    }

@router.put("/settings")
def update_owner_settings(
    company_name: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    opening_time: Optional[str] = Query(None),
    closing_time: Optional[str] = Query(None),
    price_per_hour: Optional[float] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lot = get_owner_lot(db, current_user)
    if company_name:
        lot.name = company_name
    if phone:
        lot.phone = phone
        current_user.phone = phone
    if opening_time:
        lot.opening_time = opening_time
    if closing_time:
        lot.closing_time = closing_time
    if price_per_hour is not None:
        lot.price_per_hour = price_per_hour

    db.commit()
    db.refresh(lot)
    return {"message": "Settings updated successfully", "lot_id": lot.id}
