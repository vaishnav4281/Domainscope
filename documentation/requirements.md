# Infrastructure & Resource Requirements for DomainScope

This document outlines the hardware, software, and network resources required to host the **DomainScope** application in the Kerala State Data Centre (KSDC).

## 1. Compute Resources (Virtual Machine)

We request **one (1)** Virtual Machine (VM) with the following specifications to host the Application Server (Node.js Backend + Frontend).

| Resource | Specification | Notes |
| :--- | :--- | :--- |
| **OS** | Ubuntu 22.04 LTS (Preferred) or RHEL 9 | 64-bit Architecture |
| **vCPU** | 4 Cores | To handle concurrent API requests and background workers |
| **RAM** | 8 GB | Minimum 4GB for App + 4GB for System/Buffers |
| **Storage** | 50 GB SSD | For OS, Application Code, and Logs |
| **Public IP** | 1 Static IP | For mapping to the domain (via Load Balancer) |

## 2. Database Services (Managed or Self-Hosted)

The application requires a relational database for persistent storage.

| Component | Requirement | Notes |
| :--- | :--- | :--- |
| **Engine** | PostgreSQL 14 (or higher) | |
| **Storage** | 20 GB (Initial) | Expandable based on usage |
| **Access** | Internal Access Only | Accessible from the App VM via Private IP |
| **Backup** | Daily Automated Backup | Retention: 30 Days |

**Information Required from KSDC:**
*   Host/IP Address
*   Port (Default: 5432)
*   Database Name
*   Username & Password

## 3. Cache & Queue Services

The application requires an in-memory data store for caching, session management, and job queues.

| Component | Requirement | Notes |
| :--- | :--- | :--- |
| **Engine** | Redis 6.0 (or higher) | |
| **Memory** | 2 GB | |
| **Persistence** | AOF Enabled | To prevent data loss on restart |
| **Access** | Internal Access Only | Accessible from the App VM via Private IP |

**Information Required from KSDC:**
*   Host/IP Address
*   Port (Default: 6379)
*   Port (Default: 6379)
*   Password (if auth enabled)

## 4. Email Services (SMTP Relay)

Since external API calls (like Resend/SendGrid) might be blocked, we request an internal SMTP Relay for sending transactional emails (OTP, Alerts).

| Component | Requirement | Notes |
| :--- | :--- | :--- |
| **Protocol** | SMTP / SMTPS | |
| **Sender ID** | `noreply@domainscope.kerala.gov.in` | Or similar official ID |
| **Throughput** | ~1000 emails/day | For user verification & alerts |

**Information Required from KSDC:**
*   SMTP Host (e.g., `relay.nic.in`)
*   SMTP Port (25, 465, or 587)
*   Username & Password (if auth required)

## 4. Network & Firewall Rules

### 4.1. Inbound Traffic (Public)
Traffic from the internet to the Application VM (or Load Balancer).

| Protocol | Port | Source | Destination | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| TCP | 80 (HTTP) | Any (0.0.0.0/0) | App VM / LB | Web Traffic (Redirect to 443) |
| TCP | 443 (HTTPS) | Any (0.0.0.0/0) | App VM / LB | Secure Web Traffic |

### 4.2. Outbound Traffic (From App VM)
The application needs to connect to external APIs for intelligence gathering. Please whitelist the following:

| Destination | Port | Purpose |
| :--- | :--- | :--- |
| `virustotal.com` | 443 | VirusTotal API |
| `abuseipdb.com` | 443 | AbuseIPDB API |
| `crt.sh` | 443 | Certificate Transparency Logs (Subdomains - Primary) |
| `api.hackertarget.com` | 443 | HackerTarget API (Subdomains - Fallback) |
| `ipinfo.io` | 443 | IPInfo API (IP Intelligence - Primary) |
| `whois.iana.org` | 43 | WHOIS Lookups |
| `proxycheck.io` | 80/443 | Proxy/VPN Detection API (Fallback 1) |
| `api.ip2location.io` | 443 | IP2Location Geolocation API (Fallback 2) |
| `safebrowsing.googleapis.com` | 443 | Google Safe Browsing API (Malware/Phishing) |
| `urlscan.io` | 443 | URLScan.io Website Scanner |
| `otx.alienvault.com` | 443 | AlienVault OTX (Threat Intel + Subdomain Fallback) |
| `web.archive.org` | 443 | Wayback Machine (Internet Archive) |
| `*` (Wildcard) | 53 (UDP/TCP) | DNS Resolution (Google 8.8.8.8 / Cloudflare 1.1.1.1) |
| `*` (Wildcard) | 43 (TCP) | WHOIS Servers (Various TLDs) |

**Note:** If direct outbound access is restricted, please provide **Proxy Server** details.

## 5. Domain & SSL

*   **Domain Name**: `domainscope.kerala.gov.in` (Requested)
*   **SSL Certificate**: Please provision a valid SSL Certificate (DigiCert/LetsEncrypt) for the domain.

---

**Summary of Deliverables Needed from KSDC:**
1.  **App Server IP**: `__________________________`
2.  **SSH Access**: `__________________________`
3.  **Database Credentials**: `postgresql://_______:_______@_______:5432/_______`
4.  **Redis Credentials**: `redis://:_______@_______:6379`
5.  **SMTP Credentials**: `Host: ______ Port: ____ User: ______ Pass: ______`
