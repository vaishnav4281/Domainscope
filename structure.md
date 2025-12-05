# Project Structure & File Descriptions

This document provides a comprehensive overview of the **DomainScope** project structure, explaining the purpose of each file and directory.

## 🌳 Project Tree

```text
domainscope/
├── backend/                 # Node.js/Express Backend
│   ├── prisma/              # Database Schema & Migrations
│   │   └── schema.prisma
│   ├── src/
│   │   ├── middleware/      # Auth, Rate Limiting, Metrics
│   │   ├── routes/          # API Endpoints (Auth, Scan, History)
│   │   ├── services/        # External APIs (VT, IPInfo, AbuseIPDB)
│   │   ├── utils/           # Helper functions
│   │   ├── app.ts           # App Configuration
│   │   └── server.ts        # Server Entry Point
│   └── package.json
├── public/                  # Static Assets
├── src/                     # React Frontend
│   ├── components/          # Reusable Components
│   │   └── ui/              # Shadcn UI Components
│   ├── pages/               # Page Views (Login, Dashboard)
│   ├── App.tsx              # Main App Component
│   └── main.tsx             # Frontend Entry Point
├── .env.example             # Environment Variables Template
├── DEPLOYMENT.md            # Deployment Guide
├── README.md                # Main Documentation
├── about.md                 # Feature Details
└── package.json             # Root Dependencies
```

## 📂 Root Directory
The root contains the frontend application, configuration files, and the backend subdirectory.

| File / Directory | Description |
| :--- | :--- |
| **`backend/`** | Contains the Node.js/Express backend application. |
| **`src/`** | Contains the React frontend source code. |
| **`public/`** | Static assets served directly by Vite (favicon, robots.txt, etc.). |
| **`DEPLOYMENT.md`** | Guide for deploying the application to various platforms (Render, Vercel, Docker). |
| **`LOCAL_SETUP.md`** | Instructions for setting up the project locally. |
| **`README.md`** | Main project documentation, features, and quick start guide. |
| **`about.md`** | Detailed information about the project's features and architecture. |
| **`package.json`** | Root dependencies and scripts (mostly for the frontend). |
| **`vite.config.ts`** | Configuration for the Vite build tool. |
| **`tailwind.config.ts`** | Configuration for Tailwind CSS styling. |
| **`tsconfig.json`** | TypeScript compiler configuration. |
| **`.env.example`** | Template for environment variables required by the application. |

---

## 🖥️ Frontend (`/src`)
The frontend is built with React, TypeScript, and Tailwind CSS.

### Core Files
| File | Description |
| :--- | :--- |
| **`main.tsx`** | The entry point of the React application. Mounts the app to the DOM and wraps it with HelmetProvider for SEO. |
| **`App.tsx`** | The main component that sets up routing, providers (Theme, Auth), and layout. |
| **`index.css`** | Global styles and Tailwind directives. |
| **`config.ts`** | Global configuration constants (e.g., API base URL). |
| **`lib/warmup.ts`** | Utility to warm up backend services on app load (excluding VirusTotal to save quota). |

### Pages (`/src/pages`)
Top-level page components corresponding to routes. All pages integrate the reusable SEO component for dynamic meta tags.

| File | Description |
| :--- | :--- |
| **`LandingPage.tsx`** | The public landing page with feature showcases and CTAs. Includes SEO with keywords for developer visibility. |
| **`Dashboard.tsx`** | The main authenticated dashboard. Contains scan inputs, results panels, and scan history. |
| **`Index.tsx`** | Legacy dashboard page (deprecated, redirects to Dashboard). |
| **`LoginPage.tsx`** | User login form with SEO meta tags. |
| **`SignupPage.tsx`** | User registration form with SEO meta tags. |
| **`ForgotPasswordPage.tsx`** | Form to request a password reset email with SEO meta tags. |
| **`ResetPasswordPage.tsx`** | Form to set a new password using a token with SEO meta tags. |
| **`NotFound.tsx`** | 404 Error page. |

### Components (`/src/components`)
Reusable UI components and feature-specific widgets.

| File | Description |
| :--- | :--- |
| **`SEO.tsx`** | **NEW** Reusable SEO component using react-helmet-async for dynamic page titles, meta descriptions, Open Graph, and Twitter Cards. |
| **`DomainAnalysisCard.tsx`** | Displays WHOIS data and basic domain information. |
| **`SecurityIntelPanel.tsx`** | Shows threat intelligence data (IPInfo, AbuseIPDB, DNSBL). |
| **`VirusTotalResults.tsx`** | Displays VirusTotal reputation and passive DNS data. |
| **`SubdomainResults.tsx`** | Displays discovered subdomains from crt.sh with premium UI. |
| **`MetascraperResults.tsx`** | Shows metadata extracted from the target website (title, logo, etc.). |
| **`BulkScannerCard.tsx`** | Interface for uploading and managing bulk domain scans. |
| **`ResultsPanel.tsx`** | A container component that organizes the analysis results. |
| **`OTPVerificationModal.tsx`** | Modal for entering the email verification OTP. |
| **`ui/`** | Directory containing reusable Shadcn UI components (buttons, inputs, dialogs, etc.). |

---

## ⚙️ Backend (`/backend`)
The backend is a Node.js/Express application that handles API requests, authentication, and external service integrations.

### Core Files (`/backend/src`)
| File | Description |
| :--- | :--- |
| **`server.ts`** | Entry point. Starts the HTTP server and connects to the database. |
| **`app.ts`** | Express application setup. Configures middleware, routes, and error handling. |
| **`redis.ts`** | Redis client configuration for caching and queues. |
| **`metrics.ts`** | Prometheus metrics configuration. |
| **`telemetry.ts`** | OpenTelemetry setup for observability. |

### Routes (`/backend/src/routes`)
API endpoint definitions.

| File | Description |
| :--- | :--- |
| **`auth.ts`** | Authentication endpoints (login, signup, verify, reset password). **Secured with rate limiting.** |
| **`scan.ts`** | Endpoints for triggering domain scans (single and bulk). |
| **`history.ts`** | Endpoints for retrieving past scan results. |
| **`apikeys.ts`** | Management of user API keys. |
| **`webhooks.ts`** | Endpoints for receiving external webhooks (if applicable). |

### Services (`/backend/src/services`)
Business logic and external API integrations.

| File | Description |
| :--- | :--- |
| **`vt.ts`** | Integration with **VirusTotal API** for reputation and passive DNS. **Includes Redis caching.** |
| **`ipqs.ts`** | IP intelligence with **IPInfo** → **ProxyCheck** → **IP2Location** fallback chain for fraud/risk analysis. |
| **`abuseipdb.ts`** | Integration with **AbuseIPDB** for IP abuse reports. |
| **`dnsbl.ts`** | Checks IPs against **DNS Blacklists**. |
| **`crtsh.ts`** | Subdomain discovery with **crt.sh** → **HackerTarget** → **AlienVault OTX** fallback chain. |
| **`whois.ts`** | Performs WHOIS lookups and parses the data. |
| **`email.ts`** | Handles sending emails (verification, welcome, password reset) using **Resend**. |
| **`dns-extended.ts`** | **NEW** Comprehensive DNS record lookups (MX, NS, TXT, SOA, CAA, PTR). |
| **`email-security.ts`** | **NEW** Validates SPF, DKIM, DMARC, and BIMI records. |
| **`ssl-analysis.ts`** | **NEW** Deep inspection of SSL/TLS certificates and security grading. |
| **`http-headers.ts`** | **NEW** Analyzes HTTP security headers (HSTS, CSP, etc.). |
| **`google-safe-browsing.ts`** | **NEW** Checks URLs against Google's malware/phishing lists. |
| **`urlscan.ts`** | **NEW** Integration with URLScan.io for website scanning. |
| **`alienvault-otx.ts`** | **NEW** Fetches threat intelligence from AlienVault OTX. |
| **`wayback.ts`** | **NEW** Retrieves historical snapshots from the Wayback Machine. |
| **`metadata.ts`** | **NEW** Server-side website metadata extraction. Serves as a CORS-bypass fallback when frontend proxies fail. |

### Middleware (`/backend/src/middleware`)
Express middleware functions.

| File | Description |
| :--- | :--- |
| **`auth.ts`** | Verifies JWT tokens to protect private routes. |
| **`rateLimit.ts`** | Implements request rate limiting (Global and Auth-specific). |
| **`metrics.ts`** | Collects request metrics for Prometheus. |
| **`versioning.ts`** | Handles API versioning headers. |

### Database (`/backend/prisma`)
| File | Description |
| :--- | :--- |
| **`schema.prisma`** | Defines the database schema (Users, Scans, API Keys) for Prisma ORM. |
