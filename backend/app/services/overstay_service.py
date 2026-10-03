from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.booking import Booking, Payment
from app.models.parking import ParkingSlot, ParkingLot
from app.websocket.manager import manager

async def evaluate_overstays(db: Session):
    """
    Evaluates active/upcoming bookings against backend server time.
    Calculates 15-minute warnings, grace period tracking, and generates
    security alerts for overstaying vehicles.
    """
    now = datetime.now()
    if now.tzinfo is not None:
        now = now.replace(tzinfo=None)

    # Fetch non-completed, non-cancelled bookings
    active_bookings = db.query(Booking).filter(
        Booking.status.in_(["UPCOMING", "ACTIVE", "EXTENDED"])
    ).all()

    alerts_triggered = []

    for booking in active_bookings:
        if not booking.start_time or not booking.paid_end_time:
            continue

        start_t = booking.start_time.replace(tzinfo=None) if booking.start_time.tzinfo is not None else booking.start_time
        paid_end_t = booking.paid_end_time.replace(tzinfo=None) if booking.paid_end_time.tzinfo is not None else booking.paid_end_time
        
        if not booking.grace_end_time:
            booking.grace_end_time = paid_end_t + timedelta(minutes=15)
        grace_end_t = booking.grace_end_time.replace(tzinfo=None) if booking.grace_end_time.tzinfo is not None else booking.grace_end_time

        # 1. Check for 15-Minute Expiry Warning (15 mins prior to paid_end_time)
        time_until_expiry = (paid_end_t - now).total_seconds() / 60.0

        if 0 < time_until_expiry <= 15:
            if booking.overstay_status != "WARNING_15MIN":
                booking.overstay_status = "WARNING_15MIN"
                db.commit()
                # Broadcast WS alert to civilian user
                await manager.broadcast({
                    "event": "OVERSTAY_WARNING_15MIN",
                    "booking_id": booking.id,
                    "booking_code": booking.booking_id,
                    "user_id": booking.user_id,
                    "minutes_remaining": round(time_until_expiry),
                    "message": "Your parking session ends in 15 minutes. Extend session to avoid overstay charges."
                })

        # 2. Check for Grace Period (now between paid_end_time and grace_end_time)
        elif paid_end_t <= now <= grace_end_t:
            if booking.overstay_status != "GRACE_PERIOD":
                booking.overstay_status = "GRACE_PERIOD"
                db.commit()

        # 3. Check for Overstay Alert (now past grace_end_time)
        elif now > grace_end_t:
            overstay_mins = int((now - paid_end_t).total_seconds() // 60)
            booking.overstay_status = "OVERSTAY_ALERT"
            booking.overstay_duration_minutes = overstay_mins
            booking.security_action_required = True
            
            # If a physical slot is assigned, mark its status to 'overstay'
            if booking.assigned_position_id:
                slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.assigned_position_id).first()
                if slot:
                    slot.status = "overstay"
            
            db.commit()

            alert_payload = {
                "event": "OVERSTAY_SECURITY_ALERT",
                "booking_id": booking.id,
                "booking_code": booking.booking_id,
                "lot_id": booking.parking_lot_id,
                "vehicle_number": booking.vehicle_number or "TN-09-SP-2026",
                "assigned_position": booking.assigned_position_name or f"Slot #{booking.slot_id or 'N/A'}",
                "paid_end_time": paid_end_t.isoformat(),
                "overstay_duration_minutes": overstay_mins,
                "security_action_required": True,
                "recommended_action": "Apply physical 'No Parking' wheel lock to overstaying vehicle."
            }
            alerts_triggered.append(alert_payload)
            await manager.broadcast(alert_payload)

    return alerts_triggered

def record_security_action(booking_id: int, action_notes: str, db: Session):
    """
    Logs staff/owner security action taken against an overstaying vehicle.
    Software explicitly logs physical lock applied by staff.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValueError("Booking not found")

    booking.security_action_taken = True
    booking.security_action_notes = action_notes or "Physical 'No Parking' wheel lock applied by security personnel."
    booking.overstay_status = "RESOLVED"
    db.commit()
    db.refresh(booking)

    return {
        "success": True,
        "booking_id": booking.id,
        "booking_code": booking.booking_id,
        "security_action_taken": True,
        "security_action_notes": booking.security_action_notes,
        "message": f"Security action recorded for booking {booking.booking_id}."
    }

def extend_booking_session(booking_id: int, extra_hours: int, db: Session):
    """
    Extends parking session duration for a booking if time/capacity rules permit.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValueError("Booking not found")

    lot = db.query(ParkingLot).filter(ParkingLot.id == booking.parking_lot_id).first()
    rate = lot.price_per_hour if lot else 40.0
    added_cost = rate * extra_hours

    paid_end_t = booking.paid_end_time.replace(tzinfo=timezone.utc) if booking.paid_end_time.tzinfo is None else booking.paid_end_time
    new_end_time = paid_end_t + timedelta(hours=extra_hours)
    
    booking.paid_end_time = new_end_time
    booking.grace_end_time = new_end_time + timedelta(minutes=15)
    booking.duration_hours += extra_hours
    booking.amount += added_cost
    booking.status = "EXTENDED"
    booking.overstay_status = "NONE"
    booking.security_action_required = False

    # Also update physical slot if assigned
    if booking.assigned_position_id:
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.assigned_position_id).first()
        if slot and slot.status == "overstay":
            slot.status = "occupied"

    db.commit()
    db.refresh(booking)

    return {
        "success": True,
        "booking_id": booking.id,
        "new_end_time": new_end_time.isoformat(),
        "extra_hours": extra_hours,
        "additional_amount": added_cost,
        "total_amount": booking.amount,
        "message": f"Parking session successfully extended by {extra_hours} hour(s)."
    }
