import json
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine, Base
from app.models.user import User
from app.models.parking import ParkingArea, ParkingLot, ParkingSlot
from app.models.sensor import Sensor
from app.models.booking import Booking, Payment
from app.services.auth import get_password_hash

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Checking/Seeding database with PARK-A-LOT Demo Accounts & South Chennai parking data...")

        # 1. Civilian Demo Account
        demo_user = db.query(User).filter(User.email == "demo@smartpark.in").first()
        if not demo_user:
            demo_user = User(
                name="Demo Civilian User",
                email="demo@smartpark.in",
                phone="+91 98765 00000",
                password_hash=get_password_hash("demopassword"),
                vehicle_number="TN-09-SP-2026",
                role="civilian"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        else:
            demo_user.password_hash = get_password_hash("demopassword")
            demo_user.role = "civilian"
            db.commit()

        # 2. Owner Demo Account
        owner_user = db.query(User).filter(User.email == "owner@smartpark.in").first()
        if not owner_user:
            owner_user = User(
                name="Demo Space Owner",
                email="owner@smartpark.in",
                phone="+91 98765 43210",
                password_hash=get_password_hash("demopassword"),
                vehicle_number="N/A (Owner)",
                role="owner"
            )
            db.add(owner_user)
            db.commit()
            db.refresh(owner_user)
        else:
            owner_user.password_hash = get_password_hash("demopassword")
            owner_user.role = "owner"
            db.commit()

        # 3. Fallback Civilian & Government Accounts
        civilian = db.query(User).filter(User.email == "civilian@smartpark.com").first()
        if not civilian:
            civilian = User(
                name="Rajesh Kumar",
                email="civilian@smartpark.com",
                phone="+91 98765 43211",
                password_hash=get_password_hash("password123"),
                vehicle_number="TN-09-AB-1234",
                role="civilian"
            )
            db.add(civilian)
            db.commit()
            db.refresh(civilian)

        gov = db.query(User).filter(User.email == "gov@smartpark.com").first()
        if not gov:
            gov = User(
                name="Greater Chennai Corporation (GCC)",
                email="gov@smartpark.com",
                phone="+91 94440 12345",
                password_hash=get_password_hash("password123"),
                vehicle_number="TN-01-GCC-01",
                role="government"
            )
            db.add(gov)
            db.commit()

        # 4. Resolve Guindy Area for Demo Owner Lot
        guindy_area = db.query(ParkingArea).filter(ParkingArea.name.ilike("%Guindy%")).first()
        if not guindy_area:
            guindy_area = ParkingArea(name="Guindy")
            db.add(guindy_area)
            db.commit()
            db.refresh(guindy_area)

        # 5. Demo Owner Parking Lot
        demo_lot = db.query(ParkingLot).filter(ParkingLot.owner_id == owner_user.id).first()
        if not demo_lot:
            demo_lot = ParkingLot(
                area_id=guindy_area.id,
                name="PARK-A-LOT Demo Parking",
                address="100 Mount Road, Guindy, South Chennai",
                latitude=13.0067,
                longitude=80.2020,
                total_slots=20,
                buffer_capacity=2,
                reservable_capacity=18,
                verification_status="APPROVED",
                is_live=True,
                price_per_hour=40.0,
                parking_type="Multi-Level Commercial Smart Lot",
                opening_time="06:00",
                closing_time="23:00",
                slot_prefix="A",
                slot_start_num=1,
                slot_end_num=20,
                owner_id=owner_user.id,
                contact_person="Demo Manager",
                phone="+91 98765 43210",
                email="owner@smartpark.in"
            )
            db.add(demo_lot)
            db.commit()
            db.refresh(demo_lot)
        else:
            # Ensure name, details, and verification status are set correctly
            demo_lot.name = "PARK-A-LOT Demo Parking"
            demo_lot.contact_person = "Demo Manager"
            demo_lot.phone = "+91 98765 43210"
            demo_lot.email = "owner@smartpark.in"
            demo_lot.buffer_capacity = 2
            demo_lot.reservable_capacity = 18
            demo_lot.verification_status = "APPROVED"
            demo_lot.is_live = True
            db.commit()

        # 6. Ensure 20 slots for Demo Owner Lot (A1 to A20)
        existing_slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == demo_lot.id).all()
        if len(existing_slots) < 20:
            existing_numbers = {s.slot_number for s in existing_slots}
            for i in range(1, 21):
                slot_num = f"A{i}"
                if slot_num not in existing_numbers:
                    status = "occupied" if i in [2, 5, 8, 12] else ("reserved" if i in [4, 15] else "available")
                    is_buf = (i >= 19)
                    slot = ParkingSlot(
                        parking_lot_id=demo_lot.id,
                        slot_number=slot_num,
                        status=status,
                        zone="Zone A",
                        price_per_hour=40.0,
                        sensor_id=f"ESP32-MAG-DEMO-{slot_num}",
                        is_buffer=is_buf
                    )
                    db.add(slot)
                    db.commit()
                    db.refresh(slot)

                    sensor = Sensor(
                        slot_id=slot.id,
                        device_id=slot.sensor_id,
                        magnetic_value=48.5 if status == "occupied" else 15.2,
                        vehicle_detected=(status == "occupied")
                    )
                    db.add(sensor)
            db.commit()
            existing_slots = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == demo_lot.id).all()

        # 7. Seed realistic Demo Owner Bookings (ONLY for demo_lot)
        existing_bookings = db.query(Booking).filter(Booking.parking_lot_id == demo_lot.id).count()
        if existing_bookings == 0:
            now = datetime.now(timezone.utc)
            slot_map = {s.slot_number: s for s in existing_slots}

            sample_bookings = [
                {
                    "booking_id": "SP-DEMO-20261001-01",
                    "user_id": demo_user.id,
                    "slot": slot_map.get("A2"),
                    "date": (now - timedelta(hours=1)).strftime("%Y-%m-%d"),
                    "start": now - timedelta(hours=1),
                    "paid_end": now + timedelta(hours=2),
                    "status": "CONFIRMED",
                    "amount": 120.0
                },
                {
                    "booking_id": "SP-DEMO-20261001-02",
                    "user_id": civilian.id,
                    "slot": slot_map.get("A5"),
                    "date": (now - timedelta(hours=2)).strftime("%Y-%m-%d"),
                    "start": now - timedelta(hours=2),
                    "paid_end": now + timedelta(hours=1),
                    "status": "CONFIRMED",
                    "amount": 120.0
                },
                {
                    "booking_id": "SP-DEMO-20261001-03",
                    "user_id": civilian.id,
                    "slot": slot_map.get("A8"),
                    "date": (now - timedelta(hours=3)).strftime("%Y-%m-%d"),
                    "start": now - timedelta(hours=3),
                    "paid_end": now + timedelta(hours=3),
                    "status": "CONFIRMED",
                    "amount": 240.0
                },
                {
                    "booking_id": "SP-DEMO-20260930-04",
                    "user_id": demo_user.id,
                    "slot": slot_map.get("A1"),
                    "date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "start": now - timedelta(days=1, hours=4),
                    "paid_end": now - timedelta(days=1, hours=1),
                    "status": "COMPLETED",
                    "amount": 120.0
                },
                {
                    "booking_id": "SP-DEMO-20260930-05",
                    "user_id": civilian.id,
                    "slot": slot_map.get("A3"),
                    "date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "start": now - timedelta(days=1, hours=6),
                    "paid_end": now - timedelta(days=1, hours=2),
                    "status": "COMPLETED",
                    "amount": 160.0
                },
                {
                    "booking_id": "SP-DEMO-20261002-06",
                    "user_id": demo_user.id,
                    "slot": slot_map.get("A4"),
                    "date": (now + timedelta(days=1)).strftime("%Y-%m-%d"),
                    "start": now + timedelta(days=1, hours=2),
                    "paid_end": now + timedelta(days=1, hours=5),
                    "status": "CONFIRMED",
                    "amount": 120.0
                }
            ]

            for b in sample_bookings:
                if b["slot"]:
                    booking_rec = Booking(
                        booking_id=b["booking_id"],
                        user_id=b["user_id"],
                        parking_lot_id=demo_lot.id,
                        slot_id=b["slot"].id,
                        booking_date=b["date"],
                        duration_hours=3,
                        start_time=b["start"],
                        paid_end_time=b["paid_end"],
                        buffer_end_time=b["paid_end"] + timedelta(minutes=15),
                        actual_end_time=b["paid_end"] if b["status"] == "COMPLETED" else None,
                        status=b["status"],
                        amount=b["amount"],
                        payment_id=f"pay_{b['booking_id'].lower()}"
                    )
                    db.add(booking_rec)
            db.commit()

        # 8. Seed other areas if missing
        areas_data = [
            {"name": "Anna Nagar", "lots": [{"name": "Saravana Stores Parking", "address": "11th Main Rd, Block AA, Anna Nagar, Chennai", "latitude": 13.0850, "longitude": 80.2101, "total_slots": 126, "price_per_hour": 40.0, "parking_type": "Multi-level Covered"}]},
            {"name": "Koyambedu", "lots": [{"name": "VR Chennai Mall Parking", "address": "Inner Ring Rd, Koyambedu, Chennai", "latitude": 13.0732, "longitude": 80.1912, "total_slots": 150, "price_per_hour": 50.0, "parking_type": "Underground Basement"}]},
            {"name": "Vadapalani", "lots": [{"name": "Commercial Theatre Parking", "address": "100 Feet Rd, Vadapalani, Chennai", "latitude": 13.0500, "longitude": 80.2121, "total_slots": 150, "price_per_hour": 50.0, "parking_type": "Multi-Level Automated"}]},
            {"name": "T. Nagar", "lots": [{"name": "T. Nagar Commercial Hub Parking", "address": "Pondy Bazaar, T. Nagar, Chennai", "latitude": 13.0418, "longitude": 80.2341, "total_slots": 200, "price_per_hour": 50.0, "parking_type": "GCC Smart Multi-Level"}]},
            {"name": "Adyar", "lots": [{"name": "Adyar Depot Commercial Parking", "address": "Lattice Bridge Rd, Adyar, Chennai", "latitude": 13.0012, "longitude": 80.2565, "total_slots": 110, "price_per_hour": 35.0, "parking_type": "Surface Plaza"}]},
            {"name": "Velachery", "lots": [{"name": "Phoenix Marketcity Annex Parking", "address": "Velachery Main Rd, Velachery, Chennai", "latitude": 12.9815, "longitude": 80.2180, "total_slots": 220, "price_per_hour": 60.0, "parking_type": "Premium Smart Garage"}]},
            {"name": "Marina", "lots": [{"name": "Marina Beach Light House Parking", "address": "Kamarajar Salai, Marina Beach, Chennai", "latitude": 13.0382, "longitude": 80.2785, "total_slots": 100, "price_per_hour": 30.0, "parking_type": "Beachfront Open Plaza"}]}
        ]

        for area_info in areas_data:
            area = db.query(ParkingArea).filter(ParkingArea.name == area_info["name"]).first()
            if not area:
                area = ParkingArea(name=area_info["name"])
                db.add(area)
                db.commit()
                db.refresh(area)

            for lot_info in area_info["lots"]:
                lot = db.query(ParkingLot).filter(ParkingLot.name == lot_info["name"]).first()
                if not lot:
                    lot = ParkingLot(
                        area_id=area.id,
                        name=lot_info["name"],
                        address=lot_info["address"],
                        latitude=lot_info["latitude"],
                        longitude=lot_info["longitude"],
                        total_slots=lot_info["total_slots"],
                        buffer_capacity=2,
                        reservable_capacity=max(1, lot_info["total_slots"] - 2),
                        verification_status="APPROVED",
                        is_live=True,
                        price_per_hour=lot_info["price_per_hour"],
                        parking_type=lot_info["parking_type"],
                        opening_time="06:00",
                        closing_time="23:00",
                        owner_id=owner_user.id
                    )
                    db.add(lot)
                    db.commit()
                    db.refresh(lot)

                    for i in range(1, min(lot.total_slots, 10) + 1):
                        slot_num = f"B{i}"
                        slot = ParkingSlot(
                            parking_lot_id=lot.id,
                            slot_number=slot_num,
                            status="available",
                            sensor_id=f"ESP32-MAG-{lot.id:02d}-{slot_num}"
                        )
                        db.add(slot)
                    db.commit()
                else:
                    lot.verification_status = "APPROVED"
                    lot.is_live = True
                    lot.area_id = area.id
                    if not lot.reservable_capacity:
                        lot.reservable_capacity = max(1, (lot.total_slots or 20) - 2)
                    db.commit()

        print("Database seed completed successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
