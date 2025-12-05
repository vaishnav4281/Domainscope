# About DomainScope

DomainScope is a comprehensive domain intelligence and OSINT platform designed to provide detailed analysis of domains, IP addresses, and network infrastructure. It combines multiple data sources and advanced engineering to deliver fast, accurate, and actionable insights.

## 🚀 Features & Implementation Details

### 1. Domain Analysis (WHOIS)
*   **Feature**: Retrieves detailed registration information for a domain, including registrar, creation/expiry dates, and name servers.
*   **Optimization**: Implements a **3-stage progressive loading strategy** (DNS -> WHOIS -> VirusTotal) for instant feedback and is **optimized for mobile** with robust date parsing and extended network timeouts.
*   **Provider/Library**: `whois-json` (NPM Package)
*   **Implementation**: Backend service (`backend/src/services/whois.ts`) that parses raw WHOIS data into a structured JSON format.

### 2. DNS Intelligence
*   **Feature**: Fetches current DNS records (A, AAAA, MX, NS, TXT, etc.) and historical passive DNS data.
*   **Providers**:
    *   **Current Records**: Native Node.js DNS resolution / `whois-json`.
    *   **Passive DNS**: **VirusTotal API** (`backend/src/services/vt.ts`).
*   **Implementation**:
    *   Active lookups are performed in real-time.
    *   Passive DNS (historical resolutions) is fetched from VirusTotal to show past IP associations.

### 3. Threat Intelligence
*   **Feature**: Analyzes domains and IPs for malicious activity, reputation scores, and risk levels.
*   **Providers** (with fallback chain):
    *   **VirusTotal**: Global reputation, malware detection, and categorization (`backend/src/services/vt.ts`). **Optimized with Redis caching (1-hour TTL) to respect API quotas.**
    *   **AbuseIPDB**: IP abuse confidence scores and reporting history (`backend/src/services/abuseipdb.ts`).
    *   **IP Intelligence** (3-tier fallback): `backend/src/services/ipqs.ts`
        *   **IPInfo** (Primary): Fraud scoring, VPN/Proxy/Tor detection, geolocation.
        *   **ProxyCheck.io** (Fallback 1): Enhanced VPN/Proxy detection and risk scoring.
        *   **IP2Location.io** (Fallback 2): Geolocation and ISP data when primary sources fail.
    *   **DNSBL**: Checks IP against multiple DNS Blacklists (`backend/src/services/dnsbl.ts`).

### 4. Web Metadata Extraction
*   **Feature**: Scrapes and parses metadata from the target website (Title, Description, Logo, Social Graph).
*   **Implementation**: Dual-path architecture with automatic fallback.
    *   **Primary Path (Frontend)**: Uses CORS proxies (`cors-proxy.ts`) to fetch website HTML directly from the browser. Races 3 proxies in parallel for speed.
    *   **Fallback Path (Backend)**: When all CORS proxies fail (common due to rate limits or blocked requests), automatically falls back to `backend/src/services/metadata.ts` which fetches HTML server-side (bypassing CORS entirely).
*   **Metadata Extracted**:
    *   `metascraper-title` / `og:title` / `twitter:title`
    *   `metascraper-description` / `og:description`
    *   `metascraper-image` / `og:image` / `twitter:image`
    *   `metascraper-logo` / `apple-touch-icon`
    *   `metascraper-date` / `article:published_time`
    *   `metascraper-author` / `article:author`
    *   `metascraper-publisher` / `og:site_name`
    *   `metascraper-url` / `og:url` / `canonical`
    *   `metascraper-lang` / `og:locale`
    *   JSON-LD structured data parsing
*   **Key File**: `backend/src/services/metadata.ts` (NEW - Backend fallback service)

### 5. Subdomain Discovery
*   **Feature**: Automatically finds all subdomains associated with a target domain using multiple sources.
*   **Providers** (with fallback chain): `backend/src/services/crtsh.ts`
    *   **crt.sh** (Primary): Certificate Transparency logs - comprehensive and free.
    *   **HackerTarget** (Fallback 1): DNS enumeration API - 100 requests/day free.
    *   **AlienVault OTX** (Fallback 2): Passive DNS data when primary sources fail.
*   **Implementation**: Results from all sources are merged and deduplicated for maximum coverage.
*   **Optimization**: 24-hour Redis caching. Fallbacks run in parallel for speed.
*   **UI**: Premium Blue/Cyan themed component (`src/components/SubdomainResults.tsx`) with direct links and source indicators.

### 6. Customizable Module Selection
*   **Feature**: Allows users to toggle which intelligence modules to run and display.
*   **Modules Available**:
    *   Core Analysis (DNS + WHOIS)
    *   Security Intelligence (IPInfo + ProxyCheck.io + AbuseIPDB)
    *   Subdomain Discovery
    *   VirusTotal Integration
    *   Metadata Extraction
*   **Implementation**: State management in `Dashboard.tsx` with conditional rendering and fetching.
*   **Benefit**: Saves API quota by only fetching enabled modules, and improves UI clarity.

### 7. Bulk Scanning
*   **Feature**: Allows users to upload lists of domains for parallel processing.
*   **Implementation**:
    *   **Queue System**: **BullMQ** (Redis-backed job queue) manages the workload.
    *   **Concurrency**: Workers process multiple domains in parallel.
    *   **State Management**: Real-time progress tracking via polling/sockets.

### 8. Export & Reporting
*   **Feature**: Download scan results and history as CSV.
*   **Library**: `json2csv` (NPM Package).
*   **Details**: Exports include all analyzed fields, including the newly added **Passive DNS** column.

### 9. Authentication & User Management
*   **Feature**: Secure user signup, login, password reset, and session management.
*   **Technologies**:
    *   **JWT (JSON Web Tokens)**: Stateless authentication.
    *   **Bcryptjs**: Password hashing.
    *   **Resend**: Email delivery service for verification and password resets (`backend/src/services/email.ts`).

### 10. Security Architecture 🛡️
*   **Feature**: Enterprise-grade security hardening to protect against attacks.
*   **Implementation**:
    *   **Rate Limiting**:
        *   **Global**: Limits requests to 100 per 15 minutes to prevent DoS.
        *   **Auth**: Strict limit of 10 attempts per hour on login/signup to block brute-force attacks.
    *   **Secure Headers**: Uses `helmet` to set industry-standard HTTP headers (CSP, HSTS, X-Frame-Options) to prevent XSS and Clickjacking.
    *   **Input Validation**: All user inputs are strictly validated using `zod` schemas to prevent injection attacks and malformed data.
    *   **Anti-Enumeration**: Authentication endpoints return generic error messages ("Invalid credentials") to prevent attackers from discovering valid email addresses.
    *   **CORS Protection**: API access is strictly limited to the trusted frontend domain.
    *   **Parameter Pollution**: Protected against HTTP Parameter Pollution (HPP) attacks.

### 11. Extended OSINT Features (New)
*   **Feature**: A comprehensive suite of advanced intelligence tools added to the core platform.
*   **Capabilities**:
    *   **Extended DNS**: Full record enumeration (MX, NS, TXT, SOA, CAA, PTR).
    *   **Email Security**: Automated SPF/DKIM/DMARC/BIMI validation and scoring.
    *   **SSL Analysis**: Deep inspection of certificate chains, ciphers, and validity.
    *   **HTTP Headers**: Security header analysis (HSTS, CSP, X-Frame-Options).
    *   **Threat Intel**: Real-time checks against Google Safe Browsing, URLScan.io, and AlienVault OTX.
    *   **Time Travel**: Historical snapshots via Wayback Machine.
*   **Implementation**: 9 new micro-services in `backend/src/services/` running in parallel.

## 🛠️ Technology Stack

### Frontend
*   **Framework**: **React** (v18) with **Vite**.
*   **Language**: **TypeScript**.
*   **Styling**: **Tailwind CSS** with **Shadcn UI** components. Features a **premium, glassmorphism-inspired UI** with animated CSS backgrounds and full mobile responsiveness.
*   **Icons**: `lucide-react`.
*   **Routing**: `react-router-dom`.

### Backend
*   **Runtime**: **Node.js**.
*   **Framework**: **Express.js**.
*   **Language**: **TypeScript**.
*   **Database**: **PostgreSQL** (Managed via **Prisma ORM**).
*   **Caching & Queues**: **Redis** (via `ioredis` and `bullmq`).
*   **Resilience**: `opossum` (Circuit Breakers) for external API stability.
*   **Observability**: OpenTelemetry & Prometheus metrics.

### Infrastructure
*   **Database**: PostgreSQL.
*   **Cache**: Redis.
*   **Deployment**: Docker / Cloud (Render/Vercel compatible).

## 📡 External APIs Summary

| Service | Purpose | Key File |
| :--- | :--- | :--- |
| **VirusTotal** | Domain reputation & Passive DNS | `backend/src/services/vt.ts` |
| **IPInfo** | VPN/Proxy detection & Fraud Score (Primary) | `backend/src/services/ipqs.ts` |
| **ProxyCheck.io** | Enhanced VPN/Proxy detection (Fallback 1) | `backend/src/services/ipqs.ts` |
| **IP2Location.io** | Geolocation & ISP data (Fallback 2) | `backend/src/services/ipqs.ts` |
| **AbuseIPDB** | IP Abuse Reporting | `backend/src/services/abuseipdb.ts` |
| **crt.sh** | Subdomain Discovery via Certificate Transparency (Primary) | `backend/src/services/crtsh.ts` |
| **HackerTarget** | Subdomain Discovery (Fallback 1) | `backend/src/services/crtsh.ts` |
| **AlienVault OTX** | Open Threat Intelligence & Subdomain Discovery (Fallback 2) | `backend/src/services/crtsh.ts`, `alienvault-otx.ts` |
| **Resend** | Transactional Emails | `backend/src/services/email.ts` |
| **Google Safe Browsing** | Malware & Phishing Detection | `backend/src/services/google-safe-browsing.ts` |
| **URLScan.io** | Website Scanning & Screenshots | `backend/src/services/urlscan.ts` |
| **Wayback Machine** | Historical Snapshots | `backend/src/services/wayback.ts` |
| **Metadata Extraction** | Website HTML fetching (CORS bypass) | `backend/src/services/metadata.ts` |
