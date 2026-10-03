from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.session import Base

class OwnerNotification(Base):
    __tablename__ = "owner_notifications"

    id = Column(Integer, primary_key=True, index=True)
    parking_lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="info", nullable=False)      # new_booking, check_in, early_exit, overstay_alert, security_action, sensor_offline
    severity = Column(String, default="info", nullable=False)  # success, warning, info, danger
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

def create_owner_notification(
    db: Session,
    parking_lot_id: int,
    title: str,
    message: str,
    notif_type: str = "info",
    severity: str = "info"
):
    try:
        notif = OwnerNotification(
            parking_lot_id=parking_lot_id,
            title=title,
            message=message,
            type=notif_type,
            severity=severity,
            is_read=False,
            created_at=datetime.now(timezone.utc)
        )
        db.add(notif)
        db.commit()
        return notif
    except Exception as e:
        db.rollback()
        print(f"[OwnerNotification Error] Failed to create notification: {e}")
        return None
