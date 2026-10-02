# 🅿️ SMART PARKING AVAILABILITY SYSTEM — SOUTH CHENNAI

> **Version 1: Civilian / User Dashboard**  
> An IoT and computer-vision-based platform to map, predict, and display live street and commercial parking availability across high-congestion hubs in South Chennai.

---

## 📌 System Architecture

```mermaid
flowchart TD
    subgraph Hardware Layer (IoT Physical Architecture)
        A[Parking Slot] -->|Presence Detection| B[Magnetometer Sensor]
        B -->|SPI / I2C Data| C[ESP32 Sensor Node]
        C -->|2.4GHz RF / Wi-Fi| D[ESP32 Central Gateway]
        D -->|HTTP / MQTT / WebSockets| E[Internet Gateway]
    end

    subgraph Backend Server (FastAPI Platform)
        E --> F[Common FastAPI Server]
        F --> G[(PostgreSQL / SQLite Database)]
        F --> H[IoT Telemetry & WebSocket Engine]
        F --> I[Booking & 1-Hour Buffer Engine]
        F --> J[Razorpay Payment Verification Module]
    end

    subgraph Frontend Dashboards
        H & I & J -->|REST API & WebSockets| K[1. Civilian / User Dashboard]
        H & I & J -.->|Future Scope| L[2. Parking Lot Owner Dashboard]
        H & I & J -.->|Future Scope| M[3. GCC / Government City Dashboard]
    end
```

---

## ✨ Features (Civilian Dashboard)

1. **Live Magnetometer & Camera Vacancy Grid**:
   - Color-coded slot status:
     - 🟢 **Green**: Available
     - 🔴 **Red**: Occupied
     - 🟡 **Orange**: Reserved / Expiring
     - 🔵 **Blue**: User's Selected Slot
     - ⚪ **Gray**: Unavailable / Maintenance
   - Visual parking grid layout for commercial hubs (Saravana Stores Anna Nagar, VR Chennai, T. Nagar Commercial, Guindy Metro, etc.).

2. **Smart 1-Hour Extension Buffer Reservation**:
   - User pays for requested duration (e.g., 2 hours).
   - Backend temporarily blocks **Requested Duration + 1 Additional Hour** as a protected extension buffer.
   - During final 15 minutes of paid time, prompt notifies user to extend by 1 hour for standard hourly rate.

3. **Democratized Demo Payment & Mock Hardware System**:
   - Works 100% without real ESP32 hardware or active Razorpay secret keys.
   - Embedded **Razorpay Simulated Checkout** with `[SIMULATE SUCCESS]` and `[SIMULATE FAILURE]` controls.
   - **Hackathon Presentation Control Drawer**: Fast-forward time to 15-min warning, force expiry, or flip magnetometer sensor telemetry on demand.

4. **Google Maps Navigation Integration**:
   - One-touch directions opening direct Google Maps navigation to destination coordinates.

5. **Cancellation & Fee Refunds**:
   - Cancellation refund = Total amount paid minus 1 hour parking fee.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons, React Router DOM, Axios.
* **Backend**: Python 3.13+, FastAPI, Uvicorn, SQLAlchemy, WebSockets, PyJWT, Passlib/Bcrypt.
* **Database**: SQLite (default zero-config setup) / PostgreSQL compatible.

---

## 🚀 Quickstart & Setup Guide

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
# Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database seed (Seeds 8 South Chennai areas, 12 parking lots, 150+ slots & mock users)
python app/database/seed.py

# Launch FastAPI Server
uvicorn app.main:app --reload --port 8000
```

Backend will run at: `http://localhost:8000`  
Swagger API Documentation: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd frontend

# Install node dependencies
npm install

# Run Vite development server
npm run dev
```

Frontend will run at: `http://localhost:5173`

---

## 🔑 Demo Credentials

| Role | Email | Password | Primary Vehicle |
| :--- | :--- | :--- | :--- |
| **Civilian Demo User** | `civilian@smartpark.com` | `password123` | `TN-09-AB-1234` |
| **Lot Owner Demo** | `owner@smartpark.com` | `password123` | `TN-01-XX-9999` |
| **Government GCC Demo**| `gov@smartpark.com` | `password123` | `TN-01-GCC-01` |

> *Shortcut: Click "⚡ QUICK DEMO CIVILIAN LOGIN" on the login screen for 1-click access.*

---

## 🎮 Hackathon Presentation Flow

1. Click **⚡ QUICK DEMO CIVILIAN LOGIN** on login screen.
2. Click **"Book a Parking Slot"** on the Civilian Dashboard home page.
3. Select area **Anna Nagar**.
4. Click **[VIEW SLOTS]** for **Saravana Stores Parking**.
5. Select slot **A-27** on the interactive visual magnetometer grid.
6. Choose duration **2 Hours** (Pricing automatically calculates ₹40 * 2 + ₹10 service fee = ₹90).
7. Click **CONTINUE TO PAYMENT**.
8. Click **PAY ₹90**.
9. In the Razorpay modal, click **[SIMULATE SUCCESS]**.
10. View **✓ BOOKING CONFIRMED** with Booking ID `SP-20261002-XXX`.
11. Click **[VIEW BOOKING]** to see the live countdown timer (`01:59:59 TIME REMAINING`).
12. Click the floating **HACKATHON DEMO PANEL** button at the bottom left:
    * Click **[Jump to 15-Min Expiring]** to demonstrate the warning notification card.
    * Click **[EXTEND 1 HOUR]** to test the buffer extension flow.
    * Click **[Flip Random Slot Sensor]** to verify real-time WebSocket updates.

---

## 📡 API Endpoints

### Auth
* `POST /api/auth/register` - Create account
* `POST /api/auth/login` - Obtain JWT access token
* `GET /api/auth/me` - Fetch profile

### Parking & Slots
* `GET /api/areas` - List South Chennai areas
* `GET /api/parking-lots` - Query parking locations & live counts
* `GET /api/parking-lots/{id}/slots` - Get visual slot grid & telemetry
* `GET /api/slots/{id}/status` - Live slot sensor state

### Bookings & Payments
* `POST /api/bookings` - Create reservation (+1 hr buffer blocked)
* `GET /api/bookings/active` - Active booking for civilian home card
* `POST /api/bookings/{id}/extend` - Extend paid end time by 1 hour
* `POST /api/bookings/{id}/cancel` - Cancel booking & process refund
* `POST /api/payments/create` - Generate Razorpay order
* `POST /api/payments/verify` - Confirm payment signature

### WebSocket
* `ws://localhost:8000/ws/parking` - Real-time slot vacancy telemetry broadcast

---

## 🔌 Connecting Real Hardware & Production Services

To switch from Demo Mode to Production:
1. Set `DEMO_MODE=false` in `backend/.env`.
2. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with production Razorpay keys.
3. Configure ESP32 WiFi HTTP POST or MQTT to send telemetry to `POST /api/demo/sensor-update` or dedicated IoT gateway ingestion pipeline.
4. Replace `DATABASE_URL` with PostgreSQL string: `postgresql://user:password@localhost/smartpark_db`.
