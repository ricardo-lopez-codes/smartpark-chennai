import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.session import engine, Base
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

Base.metadata.create_all(bind=engine)

def run_db_migrations():
    from sqlalchemy import text
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE parking_lots ADD COLUMN contact_person VARCHAR"))
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

# Fallback /api/v1 aliases for legacy frontend clients
app.include_router(auth_router, prefix="/api/v1")
app.include_router(areas_router, prefix="/api/v1")
app.include_router(parking_router, prefix="/api/v1")
app.include_router(slots_router, prefix="/api/v1")
app.include_router(bookings_router, prefix="/api/v1")
app.include_router(owner_router, prefix="/api/v1")
app.include_router(iot_router, prefix="/api/v1")

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

@app.websocket("/ws/parking")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive & receive any telemetry
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
