# SmartPark Chennai 🚗⚡

> **IoT & Computer-Vision Powered Smart Parking Availability System — South Chennai**

SmartPark Chennai is an end-to-end smart city parking availability, prediction, reservation, and navigation platform built specifically for high-congestion hubs across South Chennai (T. Nagar, Anna Nagar, Marina Beach, Velachery, Adyar, OMR / Perungudi, Nungambakkam, Guindy).

---

## 📌 Project Overview

Traffic congestion in South Chennai hubs is heavily exacerbated by drivers searching for open parking spots. **SmartPark** solves this by deploying an IoT magnetometer sensor network paired with computer vision telemetry to map, predict, and display real-time parking slot availability, allow date & time advance reservations, process contactless payments, and provide turn-by-turn navigation.

---

## 🌟 Key Features

- 🔐 **First-Time User Registration & JWT Authentication**: Polished authentication with bcrypt password hashing and automatic token session persistence.
- 🎯 **Demo Credentials**: Built-in instant login (`demo@smartpark.in` / `Demo@123`).
- 📍 **South Chennai Area Discovery**: Map & list views across 8 major commercial hubs (T. Nagar, Anna Nagar, Velachery, Marina, Adyar, OMR, Nungambakkam, Guindy).
- 📅 **Date & Time Selection Flow**:
  - Date chips (`Today`, `Tomorrow`, + next 2 days) + custom calendar picker up to 30 days in advance.
  - 30-minute interval selection grouped by Morning, Afternoon, Evening, and Night.
  - **Operating Hours Enforcement**: Prevents booking outside lot opening/closing times (e.g., Saravana Stores: 9 AM–10 PM, Tower Park: 6 AM–11 PM).
  - **Duration Safety Controller**: Validates requested duration (1–5 hours) against lot closing time.
- 🅿️ **Live Bay Vacancy Grid**: Visual grid showing `Available`, `Occupied` (vehicle detected via magnetometer), and `Reserved` slots.
- 💳 **Digital Reservation & Razorpay Payment Simulation**: Seamless checkout with simulated UPI, NetBanking, and Card payment authorization.
- 🗺️ **Turn-by-Turn Navigation**: Direct integration with Google Maps route directions to the selected parking bay.
- ⏱️ **Active Booking Countdown Timer**: Real-time timer showing remaining parking time.
- ➕ **15-Minute Extension Window & 1-Hour Extension**: One-click 1-hour parking extension available during the final 15 minutes.
- 🚫 **Instant Cancellation & Refund**: Cancel active/upcoming reservations before arrival with instant refund simulation.
- 📜 **Booking History**: Categorized view for `ACTIVE BOOKING`, `UPCOMING BOOKING`, and `COMPLETED / CANCELLED` reservations.
- 📡 **Simulated IoT & Sensor Telemetry Layer**: WebSocket real-time sensor updates (`vehicle_detected` states, magnetic field values in microteslas) with demo state toggles.

---

## 🏗️ Hardware & Software Architecture

```
PARKING SLOT (e.g., Slot A-01)
          ↓
  MAGNETOMETER SENSOR
          ↓
  ESP32 SENSOR NODE
          ↓
    ESP32 GATEWAY
          ↓
  REST / WEBSOCKET API (FastAPI)
          ↓
DATABASE (SQLite / PostgreSQL)
          ↓
CIVILIAN DASHBOARD (React + Vite)
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS (Rapido-inspired warm yellow `#FFD21F` & crisp white theme)
- **Icons**: Lucide React
- **Routing**: React Router v6
- **HTTP & Real-time**: Axios & Native WebSockets

### Backend
- **Framework**: Python 3.11+ / FastAPI
- **ORM & Database**: SQLAlchemy (SQLite for local dev, PostgreSQL ready)
- **Security**: PyJWT + SHA256/Bcrypt Password Hashing
- **Real-time Server**: FastAPI WebSockets Manager

---

## 🚀 Local Installation & Setup

### Prerequisites
- Node.js (v18 or higher) & npm
- Python (v3.10 or higher) & pip

---

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend server will start at `http://127.0.0.1:8000`.
- Swagger API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

---

### Step 2: Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend application will start at `http://localhost:5173`.

---

## 🔑 Demo Account Credentials

For quick evaluation during hackathons or client demonstrations:

- **Email**: `demo@smartpark.in`
- **Password**: `Demo@123`

---

## 🐳 Docker Deployment (Optional)

You can also run both frontend and backend in isolated containers using Docker Compose:

```bash
# Build and run using Docker Compose
docker-compose up --build
```

- Frontend: `http://localhost:80`
- Backend API: `http://localhost:8000`

---

## ⚙️ Environment Variables

### Backend (`backend/.env.example`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./smartpark.db` | SQLAlchemy DB connection string |
| `JWT_SECRET` | `supersecretjwtkey...` | Secret key for signing JWT auth tokens |
| `DEMO_MODE` | `true` | Enables IoT simulation and mock payment gateway |
| `CORS_ORIGINS` | `http://localhost:5173...` | Allowed frontend origins for CORS |

### Frontend (`frontend/.env.example`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `/api` | Base URL for FastAPI endpoints |
| `VITE_WS_URL` | `ws://localhost:8000/ws/parking` | WebSocket telemetry URL |
| `VITE_DEMO_MODE` | `true` | Enables UI demo banner & simulated controls |

---

## 📜 Deployment Guide

For full cloud deployment instructions (Render, Railway, Vercel, AWS), please refer to [DEPLOYMENT.md](file:///C:/Users/knigh/Desktop/SmartPark-Chennai/DEPLOYMENT.md).
