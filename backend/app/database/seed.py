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
        # Check if already seeded
        if db.query(User).first():
            print("Database already seeded.")
            return

        print("Seeding database with South Chennai parking data...")

        # 1. Create Users
        demo_user = User(
            name="Ricardo Lopez",
            email="demo@smartpark.in",
            phone="+91 98765 00000",
            password_hash=get_password_hash("Demo@123"),
            vehicle_number="TN-09-SP-2026",
            role="civilian"
        )
        civilian = User(
            name="Rajesh Kumar",
            email="civilian@smartpark.com",
            phone="+91 98765 43210",
            password_hash=get_password_hash("password123"),
            vehicle_number="TN-09-AB-1234",
            role="civilian"
        )
        owner = User(
            name="Chennai Commercial Properties",
            email="owner@smartpark.com",
            phone="+91 98765 99999",
            password_hash=get_password_hash("password123"),
            vehicle_number="TN-01-XX-9999",
            role="owner"
        )
        gov = User(
            name="Greater Chennai Corporation (GCC)",
            email="gov@smartpark.com",
            phone="+91 94440 12345",
            password_hash=get_password_hash("password123"),
            vehicle_number="TN-01-GCC-01",
            role="government"
        )
        db.add_all([demo_user, civilian, owner, gov])
        db.commit()
        db.refresh(demo_user)
        db.refresh(civilian)
        db.refresh(owner)

        # 2. South Chennai Areas & Parking Lots
        areas_data = [
            {
                "name": "Anna Nagar",
                "lots": [
                    {
                        "name": "Saravana Stores Parking",
                        "address": "11th Main Rd, Block AA, Anna Nagar, Chennai",
                        "latitude": 13.0850,
                        "longitude": 80.2101,
                        "total_slots": 126,
                        "price_per_hour": 40.0,
                        "parking_type": "Multi-level Covered",
                        "opening_time": "09:00",
                        "closing_time": "22:00"
                    },
                    {
                        "name": "Anna Nagar Tower Park Lot",
                        "address": "3rd Ave, Block Y, Anna Nagar, Chennai",
                        "latitude": 13.0872,
                        "longitude": 80.2125,
                        "total_slots": 80,
                        "price_per_hour": 30.0,
                        "parking_type": "Open Smart Lot",
                        "opening_time": "06:00",
                        "closing_time": "23:00"
                    }
                ]
            },
            {
                "name": "Koyambedu",
                "lots": [
                    {
                        "name": "VR Chennai Mall Parking",
                        "address": "Inner Ring Rd, Koyambedu, Chennai",
                        "latitude": 13.0732,
                        "longitude": 80.1912,
                        "total_slots": 150,
                        "price_per_hour": 50.0,
                        "parking_type": "Underground Basement",
                        "opening_time": "09:00",
                        "closing_time": "23:00"
                    },
                    {
                        "name": "Koyambedu Market Hub Lot",
                        "address": "Market Road, Koyambedu, Chennai",
                        "latitude": 13.0701,
                        "longitude": 80.1945,
                        "total_slots": 100,
                        "price_per_hour": 35.0,
                        "parking_type": "Surface Smart Bay",
                        "opening_time": "05:00",
                        "closing_time": "22:00"
                    }
                ]
            },
            {
                "name": "Vadapalani",
                "lots": [
                    {
                        "name": "Commercial Theatre Parking",
                        "address": "100 Feet Rd, Vadapalani, Chennai",
                        "latitude": 13.0500,
                        "longitude": 80.2121,
                        "total_slots": 150,
                        "price_per_hour": 50.0,
                        "parking_type": "Multi-Level Automated",
                        "opening_time": "08:00",
                        "closing_time": "23:30"
                    },
                    {
                        "name": "Forum Vijaya Express Parking",
                        "address": "Arcot Rd, Vadapalani, Chennai",
                        "latitude": 13.0515,
                        "longitude": 80.2105,
                        "total_slots": 120,
                        "price_per_hour": 45.0,
                        "parking_type": "Covered Garage",
                        "opening_time": "09:00",
                        "closing_time": "22:30"
                    }
                ]
            },
            {
                "name": "T. Nagar",
                "lots": [
                    {
                        "name": "T. Nagar Commercial Hub Parking",
                        "address": "Pondy Bazaar, T. Nagar, Chennai",
                        "latitude": 13.0418,
                        "longitude": 80.2341,
                        "total_slots": 200,
                        "price_per_hour": 50.0,
                        "parking_type": "GCC Smart Multi-Level",
                        "opening_time": "07:00",
                        "closing_time": "23:00"
                    },
                    {
                        "name": "Ranganathan Street Express Parking",
                        "address": "Usman Rd, T. Nagar, Chennai",
                        "latitude": 13.0395,
                        "longitude": 80.2302,
                        "total_slots": 90,
                        "price_per_hour": 40.0,
                        "parking_type": "Automated Mechanical Bay",
                        "opening_time": "08:00",
                        "closing_time": "22:00"
                    }
                ]
            },
            {
                "name": "Guindy",
                "lots": [
                    {
                        "name": "Guindy Metro Smart Parking",
                        "address": "GST Road, Guindy, Chennai",
                        "latitude": 13.0067,
                        "longitude": 80.2020,
                        "total_slots": 180,
                        "price_per_hour": 30.0,
                        "parking_type": "Transit Interchange Lot",
                        "opening_time": "05:00",
                        "closing_time": "23:30"
                    }
                ]
            },
            {
                "name": "Adyar",
                "lots": [
                    {
                        "name": "Adyar Depot Commercial Parking",
                        "address": "Lattice Bridge Rd, Adyar, Chennai",
                        "latitude": 13.0012,
                        "longitude": 80.2565,
                        "total_slots": 110,
                        "price_per_hour": 35.0,
                        "parking_type": "Surface Plaza",
                        "opening_time": "06:00",
                        "closing_time": "22:00"
                    }
                ]
            },
            {
                "name": "Marina",
                "lots": [
                    {
                        "name": "Marina Beach Promenade Parking",
                        "address": "Kamarajar Salai, Marina Beach, Chennai",
                        "latitude": 13.0499,
                        "longitude": 80.2824,
                        "total_slots": 250,
                        "price_per_hour": 20.0,
                        "parking_type": "Open Public Beach Parking",
                        "opening_time": "05:00",
                        "closing_time": "23:00"
                    }
                ]
            },
            {
                "name": "Velachery",
                "lots": [
                    {
                        "name": "Phoenix Marketcity Annex Parking",
                        "address": "Velachery Main Rd, Velachery, Chennai",
                        "latitude": 12.9815,
                        "longitude": 80.2180,
                        "total_slots": 220,
                        "price_per_hour": 60.0,
                        "parking_type": "Premium Smart Garage",
                        "opening_time": "09:00",
                        "closing_time": "23:00"
                    }
                ]
            }
        ]

        # 3. Insert Areas, Lots, Slots and Sensors
        for area_info in areas_data:
            area = ParkingArea(name=area_info["name"])
            db.add(area)
            db.commit()
            db.refresh(area)

            for lot_info in area_info["lots"]:
                lot = ParkingLot(
                    area_id=area.id,
                    name=lot_info["name"],
                    address=lot_info["address"],
                    latitude=lot_info["latitude"],
                    longitude=lot_info["longitude"],
                    total_slots=lot_info["total_slots"],
                    price_per_hour=lot_info["price_per_hour"],
                    parking_type=lot_info["parking_type"],
                    opening_time=lot_info.get("opening_time", "06:00"),
                    closing_time=lot_info.get("closing_time", "23:00"),
                    owner_id=owner.id
                )
                db.add(lot)
                db.commit()
                db.refresh(lot)

                # Create slots for each lot
                num_slots_to_generate = min(lot.total_slots, 25)
                statuses = ["available", "available", "available", "occupied", "occupied", "reserved", "unavailable"]

                for i in range(1, num_slots_to_generate + 1):
                    prefix = chr(65 + (i - 1) // 10)  # A, B, C...
                    num = (i - 1) % 10 + 1
                    slot_number = f"{prefix}-{num:02d}"
                    
                    if slot_number in ["A-01", "A-02", "A-05", "A-27"]:
                        slot_status = "available"
                    else:
                        slot_status = random.choice(statuses)

                    device_id = f"ESP32-MAG-{lot.id:02d}-{slot_number}"
                    
                    slot = ParkingSlot(
                        parking_lot_id=lot.id,
                        slot_number=slot_number,
                        status=slot_status,
                        sensor_id=device_id
                    )
                    db.add(slot)
                    db.commit()
                    db.refresh(slot)

                    # Create sensor for slot
                    sensor = Sensor(
                        slot_id=slot.id,
                        device_id=device_id,
                        magnetic_value=48.5 if slot_status == "occupied" else 15.2,
                        vehicle_detected=(slot_status == "occupied")
                    )
                    db.add(sensor)
                
                db.commit()

        # 4. Seed Demo Past Bookings
        first_lot = db.query(ParkingLot).first()
        first_slot = db.query(ParkingSlot).filter(ParkingSlot.parking_lot_id == first_lot.id).first()

        now = datetime.now(timezone.utc)
        
        past_booking_demo = Booking(
            booking_id="SP-20261001-089",
            user_id=demo_user.id,
            parking_lot_id=first_lot.id,
            slot_id=first_slot.id,
            booking_date=(now - timedelta(days=2)).strftime("%Y-%m-%d"),
            duration_hours=2,
            start_time=now - timedelta(days=2, hours=4),
            paid_end_time=now - timedelta(days=2, hours=2),
            buffer_end_time=now - timedelta(days=2, hours=1),
            actual_end_time=now - timedelta(days=2, hours=2),
            status="COMPLETED",
            amount=90.0,
            payment_id="pay_mock_past_01"
        )
        db.add(past_booking_demo)

        cancelled_booking = Booking(
            booking_id="SP-20260928-042",
            user_id=civilian.id,
            parking_lot_id=first_lot.id,
            slot_id=first_slot.id,
            booking_date=(now - timedelta(days=5)).strftime("%Y-%m-%d"),
            duration_hours=2,
            start_time=now - timedelta(days=5, hours=3),
            paid_end_time=now - timedelta(days=5, hours=1),
            buffer_end_time=now - timedelta(days=5),
            actual_end_time=now - timedelta(days=5, hours=3),
            status="CANCELLED",
            amount=90.0,
            payment_id="pay_mock_past_02"
        )
        db.add(cancelled_booking)
        db.commit()

        print("Database seed completed successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
