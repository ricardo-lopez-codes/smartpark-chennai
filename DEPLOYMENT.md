# SmartPark Chennai — Cloud Deployment Guide

This guide provides step-by-step instructions to upload **SmartPark Chennai** to GitHub and deploy it to cloud platforms like **Render**, **Vercel**, or **Railway** with a managed **PostgreSQL** database.

---

## 🎯 Architecture Summary

```
                  ┌──────────────────────┐
                  │    GitHub Repo       │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌──────────────────────┐           ┌──────────────────────┐
│  Vercel / Netlify    │           │  Render / Railway    │
│  (React Frontend)    │           │  (FastAPI Backend)   │
└──────────┬───────────┘           └──────────┬───────────┘
           │                                  │
           └─────────────────┬────────────────┘
                             ▼
               ┌───────────────────────────┐
               │ Render Managed PostgreSQL │
               └───────────────────────────┘
```

---

## STEP 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and log in.
2. Click **New Repository**.
3. Name your repository: `SmartPark-Chennai`.
4. Set visibility to **Public** or **Private**.
5. Do **NOT** initialize with a README, `.gitignore`, or license (they are already included in this project).
6. Click **Create repository**.

---

## STEP 2: Initialize Git Locally

Open terminal in the project root (`SmartPark-Chennai`):

```bash
cd C:\Users\knigh\Desktop\SmartPark-Chennai

# Initialize Git repository
git init

# Set default branch to main
git branch -M main
```

---

## STEP 3: Stage and Commit Files

```bash
# Add all clean project files
git add .

# Create initial commit
git commit -m "Initial commit: SmartPark Chennai production-ready release"
```

---

## STEP 4: Push Project to GitHub

Replace `YOUR-USERNAME` with your actual GitHub username:

```bash
# Link local repository to GitHub remote
git remote add origin https://github.com/YOUR-USERNAME/SmartPark-Chennai.git

# Push code to GitHub
git push -u origin main
```

---

## STEP 5: Deploy Backend (Render / Railway)

### Option A: Deploy on Render (Free Tier Friendly)

1. Sign up at [Render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select your `SmartPark-Chennai` repository.
4. Configure service details:
   - **Name**: `smartpark-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Create Web Service**.

---

## STEP 6: Configure PostgreSQL Database

1. On Render, click **New +** → **PostgreSQL**.
2. Set **Name**: `smartpark-db`.
3. Select the free tier option and click **Create Database**.
4. Once created, copy the **Internal Database URL** or **External Database URL**.
5. Go to your `smartpark-backend` service → **Environment** tab.
6. Add the environment variable:
   - `DATABASE_URL` = `postgresql://user:password@hostname/dbname` (paste copied URL)

---

## STEP 7: Set Backend Environment Variables

In your Render backend service, add the following environment variables:

| Key | Example Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Render PostgreSQL Connection string |
| `JWT_SECRET` | `generate_a_random_32_char_secret_string` | Production security key |
| `DEMO_MODE` | `true` | Enables hardware simulation |
| `CORS_ORIGINS` | `https://smartpark-chennai.vercel.app` | Your deployed frontend URL |

---

## STEP 8: Deploy Frontend (Vercel / Netlify)

### Option A: Deploy on Vercel

1. Sign up at [Vercel.com](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your `SmartPark-Chennai` GitHub repository.
4. Configure framework preset:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
5. Expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://smartpark-backend.onrender.com` (Your deployed Render backend URL)
   - `VITE_WS_URL` = `wss://smartpark-backend.onrender.com/ws/parking`
   - `VITE_DEMO_MODE` = `true`
6. Click **Deploy**.

---

## STEP 9: Configure CORS

Once the frontend deployment finishes, copy its live URL (e.g. `https://smartpark-chennai.vercel.app`).

1. Go back to your backend service on **Render**.
2. Update `CORS_ORIGINS` to include your Vercel domain:
   ```env
   CORS_ORIGINS=https://smartpark-chennai.vercel.app,http://localhost:5173
   ```
3. Save changes. Render will automatically redeploy the backend.

---

## STEP 10: Verify Production Deployment

Test the live application URL:

1. **Health Endpoint**: Open `https://smartpark-backend.onrender.com/health` in your browser. It should return `{"status":"ok","service":"SmartPark API"}`.
2. **Frontend UI**: Open `https://smartpark-chennai.vercel.app`.
3. **Login**: Click **Demo Account Login** (`demo@smartpark.in` / `Demo@123`).
4. **Reserve a Slot**:
   - Select area (e.g., T. Nagar).
   - Select parking lot (e.g., Saravana Stores).
   - Choose Date & Start Time.
   - Choose 2-hour duration.
   - Pick an available bay (e.g., A-01).
   - Authorize demo payment.
   - Verify active booking timer & countdown!
