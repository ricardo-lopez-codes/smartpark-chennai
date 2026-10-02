from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.user import User
from app.models.booking import Booking
from app.schemas.booking import BookingCreate, BookingResponse, BookingExtend, BookingCancelResponse
from app.services.auth import get_current_user
from app.services.booking_service import (
    create_booking,
    extend_booking,
    cancel_booking,
    check_and_expire_booking,
    format_booking_response
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("", response_model=BookingResponse)
async def make_booking(
    booking_in: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = await create_booking(
        db=db,
        user=current_user,
        parking_lot_id=booking_in.parking_lot_id,
        slot_id=booking_in.slot_id,
        duration_hours=booking_in.duration_hours,
        booking_date_str=booking_in.booking_date,
        start_time_str=booking_in.start_time_str
    )
    return format_booking_response(booking)

@router.get("/active", response_model=Optional[BookingResponse])
async def get_active_booking(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    
    # Query active/upcoming/extended bookings for user
    bookings = db.query(Booking).filter(
        Booking.user_id == current_user.id,
        Booking.status.in_(["UPCOMING", "ACTIVE", "EXTENDED"])
    ).order_by(Booking.created_at.desc()).all()

    for booking in bookings:
        await check_and_expire_booking(db, booking)
        if booking.status in ["UPCOMING", "ACTIVE", "EXTENDED"]:
            return format_booking_response(booking, now=now)

    return None

@router.get("", response_model=List[BookingResponse])
async def get_my_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Booking).filter(Booking.user_id == current_user.id)
    
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Booking.status == status_filter.upper())

    bookings = query.order_by(Booking.created_at.desc()).all()
    now = datetime.now(timezone.utc)
    
    results = []
    for b in bookings:
        await check_and_expire_booking(db, b)
        results.append(format_booking_response(b, now=now))

    return results

@router.get("/{id}", response_model=BookingResponse)
async def get_booking_by_id(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == id, Booking.user_id == current_user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    await check_and_expire_booking(db, booking)
    return format_booking_response(booking)

@router.post("/{id}/cancel", response_model=BookingCancelResponse)
async def cancel_booking_endpoint(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await cancel_booking(db=db, booking_id=id, user=current_user)

@router.post("/{id}/extend", response_model=BookingResponse)
async def extend_booking_endpoint(
    id: int,
    extend_in: BookingExtend,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_b = await extend_booking(
        db=db,
        booking_id=id,
        user=current_user,
        additional_hours=extend_in.additional_hours
    )
    return format_booking_response(updated_b)
