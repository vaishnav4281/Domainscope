# 🔌 DomainScope API Endpoints

Complete API reference for all DomainScope endpoints.

**Base URL:** `http://localhost:3001/api/v1` (Development)  
**Production URL:** `https://domainscope.kerala.gov.in/api/v1`

---

## 📋 Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Core Scan Endpoints](#core-scan-endpoints)
3. [Extended OSINT Endpoints](#extended-osint-endpoints)
4. [History & Management](#history--management)
5. [API Key Management](#api-key-management)
6. [Webhooks](#webhooks)
7. [System Status](#system-status)

---

## 🔐 Authentication Endpoints

### POST `/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### POST `/auth/verify-email`
Verify email with OTP code.

### POST `/auth/login`
User login.

### POST `/auth/forgot-password`
Request password reset.

### POST `/auth/reset-password`
Reset password with token.

---

## 🔍 Core Scan Endpoints

### GET `/scan/dns?domain={domain}`
Basic DNS resolution (A records only).

**Response:**
```json
{
  "ip": "142.250.180.46"
}
```

### GET `/scan/whois?domain={domain}`
WHOIS lookup with RDAP fallback.

### GET `/scan/vt?domain={domain}`
VirusTotal domain report.

### GET `/scan/ipqs?ip={ip}`
IP Intelligence with fallback chain: **IPInfo → ProxyCheck.io → IP2Location.io**

**Returns:** VPN/Proxy detection, geolocation, ISP, fraud score.

### GET `/scan/abuseipdb?ip={ip}`
AbuseIPDB threat intelligence.

### GET `/scan/dnsbl?ip={ip}`
DNSBL blacklist checks.

### GET `/scan/subdomain?domain={domain}`
Subdomain discovery with fallback chain: **crt.sh → HackerTarget → AlienVault OTX**

**Response:**
```json
{
  "subdomains": ["api.example.com", "mail.example.com"],
  "count": 2,
  "sources": ["crt.sh", "HackerTarget"],
  "timestamp": "2025-12-05T..."
}
```

---

## 🆕 Extended OSINT Endpoints

### GET `/scan/dns-extended?domain={domain}`
**Extended DNS Records** - All record types

**Returns:**
- A Records (IPv4)
- AAAA Records (IPv6)
- MX Records (Mail servers)
- NS Records (Nameservers)
- TXT Records (SPF, verification, etc.)
- CNAME Records (Aliases)
- SOA Records (Start of Authority)
- CAA Records (Certificate Authority Authorization)

**Response:**
```json
{
  "domain": "example.com",
  "records": {
    "A": ["93.184.216.34"],
    "AAAA": ["2606:2800:220:1:248:1893:25c8:1946"],
    "MX": [
      { "exchange": "mail.example.com", "priority": 10 }
    ],
    "NS": ["ns1.example.com", "ns2.example.com"],
    "TXT": ["v=spf1 include:_spf.example.com ~all"],
    "CNAME": [],
    "SOA": {...},
    "CAA": []
  },
  "summary": {
    "totalRecordTypes": 6,
    "hasIPv4": true,
    "hasIPv6": true,
    "hasMail": true,
    "nameserverCount": 2,
    "txtRecordCount": 1
  }
}
```

---

### GET `/scan/reverse-dns?ip={ip}`
**Reverse DNS (PTR Records)** - IP to hostname mapping

**Response:**
```json
{
  "ip": "8.8.8.8",
  "hostnames": ["dns.google"],
  "timestamp": "2025-12-04T08:00:00.000Z"
}
```

---

### GET `/scan/email-security?domain={domain}`
**Email Security Analysis** - SPF, DKIM, DMARC, BIMI validation

**Response:**
```json
{
  "domain": "example.com",
  "spf": {
    "exists": true,
    "record": "v=spf1 include:_spf.google.com ~all",
    "valid": true,
    "policy": "~all"
  },
  "dmarc": {
    "exists": true,
    "record": "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com",
    "policy": "quarantine",
    "percentage": 100
  },
  "dkim": {
    "exists": true,
    "selectors": [
      {
        "selector": "google",
        "record": "v=DKIM1; k=rsa; p=...",
        "valid": true
      }
    ],
    "count": 1
  },
  "bimi": {
    "exists": false
  },
  "score": 85,
  "grade": "A",
  "recommendations": [
    "Upgrade DMARC policy from 'quarantine' to 'reject'"
  ]
}
```

---

### GET `/scan/ssl-cert?domain={domain}`
**SSL/TLS Certificate Analysis** - Certificate inspection & security grading

**Response:**
```json
{
  "domain": "example.com",
  "certificate": {
    "subject": {
      "CN": "example.com"
    },
    "issuer": {
      "CN": "DigiCert TLS RSA SHA256 2020 CA1"
    },
    "subjectAltNames": ["DNS:example.com", "DNS:www.example.com"],
    "validFrom": "Nov  5 00:00:00 2024 GMT",
    "validTo": "Dec  5 23:59:59 2025 GMT",
    "daysRemaining": 365,
    "serialNumber": "0A1B2C3D...",
    "fingerprint256": "..."
  },
  "validity": {
    "isValid": true,
    "isExpired": false,
    "expiresIn": 365,
    "warning": false
  },
  "protocol": {
    "version": "TLSv1.3",
    "cipher": {
      "name": "TLS_AES_256_GCM_SHA384",
      "version": "TLSv1.3"
    }
  },
  "score": 95,
  "grade": "A+",
  "recommendations": [
    "SSL/TLS configuration is excellent!"
  ]
}
```

---

### GET `/scan/http-headers?domain={domain}`
**HTTP Security Headers Analysis** - HSTS, CSP, X-Frame-Options, etc.

**Response:**
```json
{
  "domain": "example.com",
  "url": "https://example.com",
  "headers": {
    "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    "content-security-policy": "default-src 'self'",
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "geolocation=()"
  },
  "security": {
    "hasHSTS": true,
    "hasCSP": true,
    "hasFrameOptions": true,
    "hasContentTypeOptions": true,
    "serverInfoExposed": false
  },
  "score": 90,
  "grade": "A+",
  "recommendations": []
}
```

---

### GET `/scan/safe-browsing?url={url}`
**Google Safe Browsing** - Malware & phishing detection

**Response:**
```json
{
  "url": "https://example.com",
  "isSafe": true,
  "threats": [],
  "details": [],
  "timestamp": "2025-12-04T08:00:00.000Z"
}
```

---

### GET `/scan/urlscan?url={url}`
**URLScan.io** - Automated website scanning

**Response:**
```json
{
  "url": "https://example.com",
  "scanId": "abc123...",
  "status": "completed",
  "page": {
    "domain": "example.com",
    "ip": "93.184.216.34",
    "country": "US",
    "server": "nginx",
    "asn": "AS15133",
    "asnname": "EDGECAST"
  },
  "verdicts": {
    "overall": {
      "malicious": false,
      "score": 0
    }
  },
  "screenshot": "https://urlscan.io/screenshots/...",
  "malicious": false,
  "score": 0
}
```

---

### GET `/scan/urlscan-search?domain={domain}`
**URLScan.io Search** - Find historical scans

---

### GET `/scan/alienvault-otx?domain={domain}`
**AlienVault OTX** - Open Threat Exchange intelligence

**Response:**
```json
{
  "domain": "example.com",
  "pulseCount": 0,
  "pulses": [],
  "reputation": {
    "hasPulses": false,
    "pulseCount": 0,
    "malicious": false
  }
}
```

---

---

### GET `/scan/wayback?domain={domain}`
**Wayback Machine** - Historical snapshots (FREE, unlimited)

**Response:**
```json
{
  "domain": "example.com",
  "available": true,
  "totalSnapshots": 847,
  "firstSnapshot": {
    "date": "2001-03-15 12:34:56",
    "url": "https://web.archive.org/web/20010315123456/http://example.com",
    "timestamp": "20010315123456"
  },
  "lastSnapshot": {
    "date": "2025-12-01 08:15:30",
    "url": "https://web.archive.org/web/20251201081530/http://example.com",
    "timestamp": "20251201081530"
  },
  "oldestYear": 2001,
  "latestYear": 2025,
  "yearsTracked": 25,
  "yearlyStats": {
    "2001": 5,
    "2002": 12,
    "...": "...",
    "2025": 45
  }
}
```

---

### GET `/scan/metadata?domain={domain}`
**Website Metadata Extraction** - Server-side HTML parsing (CORS bypass fallback)

**Purpose:** Fetches website HTML server-side and extracts Open Graph, Twitter Card, and standard meta tags. This endpoint serves as a fallback when frontend CORS proxies fail.

**Response:**
```json
{
  "title": "Example Domain - Welcome",
  "description": "This domain is for use in illustrative examples in documents.",
  "keywords": "example, domain, test",
  "author": "IANA",
  "lang": "en",
  "publisher": "Example Inc.",
  "type": "website",
  "image": "https://example.com/og-image.png",
  "imageAlt": "Example domain logo",
  "url": "https://example.com",
  "twitterCard": "summary_large_image",
  "twitterSite": "@example",
  "favicon": "https://example.com/favicon.ico",
  "logo": "https://example.com/apple-touch-icon.png",
  "robots": "index, follow",
  "viewport": "width=device-width, initial-scale=1",
  "themeColor": "#ffffff",
  "charset": "UTF-8",
  "generator": "WordPress",
  "schemaType": "Organization",
  "completenessScore": 73
}
```

**Error Response:**
```json
{
  "error": "Failed to fetch website content from all URL variations"
}
```

---

## 📊 History & Management

### GET `/history`
Get scan history (authenticated).

### DELETE `/history/:id`
Delete scan record.

---

## 🔑 API Key Management

### GET `/keys`
Get user API keys.

### POST `/keys`
Generate new API key.

### DELETE `/keys/:id`
Revoke API key.

---

## 🔔 Webhooks

### POST `/webhooks`
Register webhook.

### GET `/webhooks`
List webhooks.

### DELETE `/webhooks/:id`
Delete webhook.

---

## 📡 System Status

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "version": "v1.1-no-verify"
}
```

### GET `/scan/whois-status`
WHOIS rate limit status.

**Response:**
```json
{
  "currentSecond": 1,
  "maxPerSecond": 1,
  "currentDay": 45,
  "maxPerDay": 80,
  "canQuery": true
}
```

### GET `/metrics`
Prometheus metrics (exposed on port 9464).

---

## 📝 Rate Limits

| Endpoint Type | Rate Limit | Window |
|--------------|------------|--------|
| **Global** | 100 requests | 15 minutes |
| **Auth** | 10 requests | 1 hour |
| **Free APIs** | See individual limits | - |

---

## 🌐 CORS

API supports CORS from configured frontend origins.

**Development:** `http://localhost:5173`, `http://localhost:8080`  
**Production:** `https://domainscope.kerala.gov.in`

---

## 🔒 Authentication

Most endpoints require JWT authentication via Bearer token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Public endpoints (no auth required):
- `/health`
- `/metrics`
- `/auth/*` (except logout)

---

**Last Updated:** 2025-12-05  
**API Version:** v1.2 (with fallback chains)
