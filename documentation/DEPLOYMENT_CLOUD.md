# ☁️ Cloud Deployment Guide (Vercel + Render)

This guide explains how to deploy DomainScope to a public cloud environment using **Vercel** for the frontend and **Render** for the backend.

> **Note:** The application is optimized for KSDC but is fully compatible with standard cloud providers.

---

## 1. Backend Deployment (Render.com)

We will deploy the Node.js backend, PostgreSQL database, and Redis cache on Render.

### Step 1: Create a Blueprint (Recommended)
1.  Create a `render.yaml` file in the root of your repository (content below).
2.  Connect your GitHub repository to Render.
3.  Render will automatically provision the Backend, Database, and Redis.

**`render.yaml` content:**
```yaml
services:
  - type: web
    name: domainscope-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        fromDatabase:
          name: domainscope-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: domainscope-redis
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://your-vercel-app.vercel.app  # Update this after deploying frontend
      # Add your API Keys here manually in the dashboard:
      # - VIRUSTOTAL_API_KEY
      # - IPINFO_TOKEN
      # - PROXYCHECK_API_KEY
      # - ABUSEIPDB_KEY
      # - SMTP_HOST, SMTP_USER, SMTP_PASS (for emails)

databases:
  - name: domainscope-db
    plan: free
    databaseName: domainscope
    user: domainscope

services:
  - type: redis
    name: domainscope-redis
    plan: free
    ipAllowList: [] # Allow internal connections
```

### Step 2: Manual Setup (Alternative)
If you prefer manual setup:
1.  **Web Service**: Connect repo, set Root Directory to `backend`.
    *   Build Command: `npm install && npm run build`
    *   Start Command: `npm start`
2.  **PostgreSQL**: Create a new PostgreSQL database.
3.  **Redis**: Create a new Redis instance.
4.  **Environment Variables**: Copy values from `.env.example` and update `DATABASE_URL` and `REDIS_URL` with the connection strings provided by Render.

---

## 2. Frontend Deployment (Vercel)

### Step 1: Import Project
1.  Go to Vercel Dashboard -> Add New -> Project.
2.  Select your GitHub repository.

### Step 2: Configure Build
*   **Framework Preset**: Vite
*   **Root Directory**: `.` (Root)
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`

### Step 3: Environment Variables
Add the following environment variables in Vercel:

| Variable | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://your-render-backend-url.onrender.com` |
| `VITE_VIRUSTOTAL_API_KEY` | (Optional) For client-side fallback |

### Step 4: Deploy
Click **Deploy**. Vercel will build and serve the frontend.

---

## 3. Post-Deployment Configuration

1.  **Update Backend CORS**:
    *   Once Vercel provides your frontend URL (e.g., `https://domainscope.vercel.app`), go back to Render Dashboard.
    *   Update the `FRONTEND_URL` environment variable in your Backend service to match the Vercel URL.
    *   This ensures password reset links point to the correct place.

2.  **Email Configuration (Important)**:
    *   For emails to work, you must provide SMTP credentials in Render Environment Variables.
    *   You can use a service like **Resend (SMTP)**, **SendGrid**, or **Gmail**.
    *   **Vars**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`.

## ✅ Compatibility Check
*   **KSDC Optimization**: The code checks for `SMTP_HOST`. If present, it uses it. If not, it mocks emails. This means it works out-of-the-box on cloud providers too.
*   **Database**: Prisma works with any PostgreSQL (Render, Neon, Supabase).
*   **Redis**: BullMQ works with any Redis (Render, Upstash).

You are good to go! 🚀
