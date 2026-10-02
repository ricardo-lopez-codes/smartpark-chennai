from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.parking import ParkingArea, ParkingLot, ParkingSlot
from app.schemas.parking import AreaResponse

router = APIRouter(prefix="/areas", tags=["Areas"])

@router.get("", response_model=List[AreaResponse])
def get_areas(db: Session = Depends(get_db)):
    areas = db.query(ParkingArea).all()
    results = []

    for area in areas:
        lots = db.query(ParkingLot).filter(ParkingLot.area_id == area.id).all()
        total_lots = len(lots)
        
        lot_ids = [l.id for l in lots]
        available_slots = db.query(ParkingSlot).filter(
            ParkingSlot.parking_lot_id.in_(lot_ids),
            ParkingSlot.status == "available"
        ).count() if lot_ids else 0

        results.append({
            "id": area.id,
            "name": area.name,
            "total_lots": total_lots,
            "total_available_slots": available_slots
        })

    return results
