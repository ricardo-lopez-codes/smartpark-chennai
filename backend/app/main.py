import asyncio
from datetime import datetime, timezone
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.database.session import engine, Base, get_db
from app.database.seed import seed_db
from app.websocket.manager import manager

from app.api.auth import router as auth_router
from app.api.areas import router as areas_router
from app.api.parking import router as parking_router
from app.api.slots import router as slots_router
from app.api.bookings import router as bookings_router
from app.api.payments import router as payments_router
from app.api.demo import router as demo_router
from app.api.owner import router as owner_router
from app.api.iot import router as iot_router
from app.api.admin import router as admin_router
from app.api.challans import router as challans_router

from app.models.notification import OwnerNotification

Base.metadata.create_all(bind=engine)

def run_db_migrations():
    from sqlalchemy import text
    columns_to_add = [
        ("parking_lots", "contact_person VARCHAR"),
        ("parking_lots", "buffer_capacity INTEGER DEFAULT 2"),
        ("parking_lots", "reservable_capacity INTEGER DEFAULT 18"),
        ("parking_lots", "verification_status VARCHAR DEFAULT 'DOCUMENT_VERIFICATION_PENDING'"),
        ("parking_lots", "is_live BOOLEAN DEFAULT 0"),
        ("parking_lots", "document_info VARCHAR DEFAULT 'Property Ownership & Commercial Authorization License'"),
        ("parking_lots", "document_submitted_at DATETIME"),
        ("parking_lots", "doc_verified_at DATETIME"),
        ("parking_lots", "doc_notes VARCHAR"),
        ("parking_lots", "physical_verified_at DATETIME"),
        ("parking_lots", "physical_verifier_name VARCHAR"),
        ("parking_lots", "physical_verification_notes VARCHAR"),
        ("parking_lots", "verified_capacity INTEGER"),
        ("parking_lots", "inspection_appointment_date DATETIME"),
        ("parking_lots", "inspection_appointment_time VARCHAR"),
        ("parking_lots", "inspection_appointment_contact VARCHAR"),
        ("parking_lots", "inspection_appointment_notes VARCHAR"),

        ("parking_slots", "is_buffer BOOLEAN DEFAULT 0"),

        ("bookings", "vehicle_number VARCHAR DEFAULT 'TN-09-SP-2026'"),
        ("bookings", "payment_method VARCHAR DEFAULT 'RAZORPAY'"),
        ("bookings", "assigned_position_id INTEGER"),
        ("bookings", "assigned_position_name VARCHAR"),
        ("bookings", "is_buffer_assigned BOOLEAN DEFAULT 0"),
        ("bookings", "grace_end_time DATETIME"),
        ("bookings", "overstay_status VARCHAR DEFAULT 'NONE'"),
        ("bookings", "overstay_duration_minutes INTEGER DEFAULT 0"),
        ("bookings", "security_action_required BOOLEAN DEFAULT 0"),
        ("bookings", "security_action_taken BOOLEAN DEFAULT 0"),
        ("bookings", "security_action_notes VARCHAR"),
        ("bookings", "booking_charge FLOAT DEFAULT 10.0"),
        ("bookings", "used_hours FLOAT"),
        ("bookings", "used_amount FLOAT"),
        ("bookings", "unused_amount FLOAT"),
        ("bookings", "cancellation_fee FLOAT"),
        ("bookings", "refund_amount FLOAT"),
        ("bookings", "refund_status VARCHAR DEFAULT 'NONE'"),
        ("bookings", "refund_type VARCHAR DEFAULT 'ORIGINAL_PAYMENT'"),
        ("bookings", "refund_id VARCHAR"),
        ("bookings", "credits_earned INTEGER DEFAULT 0"),

        ("users", "wallet_balance FLOAT DEFAULT 0.0"),
        ("users", "wallet_credits INTEGER DEFAULT 0"),
        ("users", "vehicle_type VARCHAR DEFAULT 'CAR'"),

        ("parking_lots", "car_slots INTEGER DEFAULT 15"),
        ("parking_lots", "bike_slots INTEGER DEFAULT 10"),
        ("parking_lots", "car_price_per_hour FLOAT DEFAULT 40.0"),
        ("parking_lots", "bike_price_per_hour FLOAT DEFAULT 20.0"),

        ("bookings", "vehicle_type VARCHAR DEFAULT 'CAR'"),

        ("payments", "payment_method VARCHAR DEFAULT 'RAZORPAY'"),
        ("payments", "transaction_reference VARCHAR"),
        ("payments", "vehicle_number VARCHAR"),

        ("sensors", "rssi FLOAT DEFAULT -65.0"),
        ("sensors", "snr FLOAT DEFAULT 9.5"),
        ("sensors", "packet_count INTEGER DEFAULT 0"),
        ("sensors", "heartbeat BOOLEAN DEFAULT 0"),
        ("sensors", "status_message VARCHAR"),
        ("sensors", "latest_status VARCHAR DEFAULT 'EMPTY'"),
        ("sensors", "timestamp_ms INTEGER"),
    ]
    with engine.connect() as conn:
        for table, col in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col}"))
                conn.commit()
            except Exception:
                pass

run_db_migrations()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Smart Parking Availability System — South Chennai"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers (/api and /api/v1 aliases)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(areas_router, prefix=settings.API_V1_STR)
app.include_router(parking_router, prefix=settings.API_V1_STR)
app.include_router(slots_router, prefix=settings.API_V1_STR)
app.include_router(bookings_router, prefix=settings.API_V1_STR)
app.include_router(payments_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)
app.include_router(owner_router, prefix=settings.API_V1_STR)
app.include_router(iot_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(challans_router, prefix=settings.API_V1_STR)

# Fallback /api/v1 aliases for legacy frontend clients
app.include_router(auth_router, prefix="/api/v1")
app.include_router(areas_router, prefix="/api/v1")
app.include_router(parking_router, prefix="/api/v1")
app.include_router(slots_router, prefix="/api/v1")
app.include_router(bookings_router, prefix="/api/v1")
app.include_router(owner_router, prefix="/api/v1")
app.include_router(iot_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(challans_router, prefix="/api/v1")

@app.on_event("startup")
def startup_event():
    seed_db()

@app.get("/")
def root():
    return {
        "system": "Smart Parking Availability System — South Chennai",
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "docs_url": "/docs"
    }

@app.get("/dashboard_feed.json")
@app.get("/api/dashboard_feed.json")
def get_dashboard_feed(db: Session = Depends(get_db)):
    from app.models.parking import ParkingLot, ParkingSlot, ParkingArea
    from app.models.booking import Booking

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    areas = db.query(ParkingArea).all()
    lots = db.query(ParkingLot).all()
    slots = db.query(ParkingSlot).all()

    total_slots = len(slots)
    avail_count = sum(1 for s in slots if s.status == "available")
    occ_count = sum(1 for s in slots if s.status == "occupied")
    res_count = sum(1 for s in slots if s.status == "reserved")

    lot_feeds = []
    for lot in lots:
        l_slots = [s for s in slots if s.parking_lot_id == lot.id]
        l_avail = sum(1 for s in l_slots if s.status == "available")
        l_occ = sum(1 for s in l_slots if s.status == "occupied")
        l_res = sum(1 for s in l_slots if s.status == "reserved")

        lot_feeds.append({
            "id": lot.id,
            "name": lot.name,
            "address": lot.address,
            "latitude": lot.latitude,
            "longitude": lot.longitude,
            "total_slots": len(l_slots) or lot.total_slots,
            "available_slots": l_avail,
            "occupied_slots": l_occ,
            "reserved_slots": l_res,
            "price_per_hour": lot.price_per_hour,
            "opening_time": lot.opening_time,
            "closing_time": lot.closing_time,
            "facilities": lot.facilities
        })

    return {
        "system": "Smart Parking Availability System — South Chennai",
        "last_updated": now.isoformat(),
        "metrics": {
            "total_areas": len(areas),
            "total_lots": len(lots),
            "total_slots": total_slots,
            "available_slots": avail_count,
            "occupied_slots": occ_count,
            "reserved_slots": res_count,
            "occupancy_rate_pct": round(((occ_count + res_count) / max(1, total_slots)) * 100, 1)
        },
        "parking_lots": lot_feeds
    }

@app.websocket("/ws/parking")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive & receive any telemetry
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Auto-reload trigger for vehicle_type and owner lot enhancements
