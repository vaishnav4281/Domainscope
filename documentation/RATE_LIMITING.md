# 🔒 Rate Limiting in DomainScope

## Overview
DomainScope implements **two types of rate limiting** to ensure reliable operation and prevent abuse:

1. **Application Rate Limiting** - Protects your backend API from abuse
2. **External API Rate Limiting** - Respects limits imposed by external services (WHOIS, VirusTotal, etc.)

---

## 1️⃣ Application Rate Limiting (Your Backend)

These limits control how many requests **users can make to your API**.

### Configuration

Located in: `backend/.env`

```env
# Global Rate Limit (ALL API endpoints)
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX=100             # 100 requests per IP per window

# Auth Rate Limit (Login, Signup, OTP)
AUTH_RATE_LIMIT_WINDOW_MS=3600000  # 1 hour
AUTH_RATE_LIMIT_MAX=10             # 10 attempts per IP per window
```

### Defaults

| Environment | Global Limit | Auth Limit |
|------------|--------------|------------|
| **Development** | 10,000 / 15 min | 10,000 / hour |
| **Production** | 100 / 15 min | 10 / hour |

### How It Works
- Uses `express-rate-limit` middleware
- Tracks requests by **IP address**
- Returns HTTP `429 Too Many Requests` when exceeded
- Resets automatically after the time window expires

---

## 2️⃣ External API Rate Limiting

These limits are imposed by **external services** you query (not under your control).

### 🔍 WHOIS Servers

**NEW:** We now implement client-side rate limiting to respect WHOIS server limits.

| Limit Type | Value | Enforced By |
|------------|-------|-------------|
| **Per Second** | 1 query/second | DomainScope (client-side) |
| **Per Day** | 80 queries/day | DomainScope (client-side) |
| **Registry Limits** | 1-5 queries/second | WHOIS servers (varies by registry) |
| **Daily Registry Limits** | 50-100/day | WHOIS servers (varies by registry) |

#### Why WHOIS Gets Rate Limited

WHOIS servers are operated by domain registries (Verisign, ICANN, etc.) and have **strict limits**:

```
⚠️ Common WHOIS Rate Limit Errors:
- "You are not authorized to access or query our Whois"
- "Rate limit exceeded"
- Connection timeouts (ECONNRESET, ETIMEDOUT)
- Empty or incomplete responses
```

#### Our Solution

We implemented a **WHOIS Query Queue** (`whois-queue.ts`) that:
- ✅ Limits to **1 query per second**
- ✅ Limits to **80 queries per day** (conservative limit)
- ✅ Queues requests when limits are reached
- ✅ Falls back to **RDAP** when WHOIS fails
- ✅ Caches results for **24 hours** to minimize queries

#### Monitoring WHOIS Rate Limits

**New Endpoint:** `GET /api/v1/scan/whois-status`

```json
{
  "currentSecond": 1,
  "maxPerSecond": 1,
  "currentDay": 45,
  "maxPerDay": 80,
  "canQuery": true
}
```

### 🦠 VirusTotal API

| Limit Type | Free Tier | Premium |
|------------|-----------|---------|
| **Requests/Minute** | 4 | 1000+ |
| **Requests/Day** | 500 | 15,750+ |
| **Requests/Month** | 15,500 | 500,000+ |

**Implementation:** `backend/src/services/vt.ts`
- Rotates between multiple API keys
- Returns cached results when rate-limited
- Handles `429 Too Many Requests` gracefully

### 🌐 IPInfo (IP Geolocation)

| Limit Type | Free Tier | Paid |
|------------|-----------|------|
| **Requests/Month** | 50,000 | 150,000+ |

**Implementation:** Token rotation in `backend/src/services/ipinfo.ts`

### 🛡️ ProxyCheck (VPN Detection)

| Limit Type | Free Tier | Paid |
|------------|-----------|------|
| **Requests/Day** | 1,000 | 10,000+ |

**Implementation:** Token rotation in `backend/src/services/proxycheck.ts`

### 🔐 AbuseIPDB

| Limit Type | Free Tier | Paid |
|------------|-----------|------|
| **Requests/Day** | 1,000 | 10,000+ |

**Implementation:** Token rotation in `backend/src/services/abuseipdb.ts`

---

## 🚨 What Happens When Rate Limited?

### Your Backend (Express)
```json
HTTP 429 Too Many Requests
{
  "error": "Too many requests, please try again later."
}
```

### WHOIS Servers
- Query waits in queue (up to 5 seconds)
- If queue full, falls back to RDAP
- Results cached for 24 hours
- Logs: `⏱️ WHOIS rate limit queue full for {domain}`

### VirusTotal
```json
{
  "error": "VirusTotal quota exceeded. Results may be incomplete.",
  "cached": true
}
```

### Other APIs
- Return cached results if available
- Return `null` or partial data
- Backend logs the rate limit event

---

## 🛠️ Best Practices

### For Local Development
1. Set relaxed limits in `.env`:
   ```env
   RATE_LIMIT_MAX=10000
   AUTH_RATE_LIMIT_MAX=10000
   ```

2. Use `force=true` in WHOIS queries to bypass cache:
   ```
   GET /api/v1/scan/whois?domain=example.com&force=true
   ```

3. Monitor WHOIS queue status:
   ```bash
   curl http://localhost:3001/api/v1/scan/whois-status
   ```

### For Production
1. Use strict limits:
   ```env
   RATE_LIMIT_MAX=100          # 100 requests / 15 min
   AUTH_RATE_LIMIT_MAX=10      # 10 attempts / hour
   ```

2. Set up **Redis** for distributed rate limiting (across multiple servers)

3. Monitor external API quotas daily

4. Enable **caching** to minimize external API calls

---

## 📊 Checking Your Current Usage

### WHOIS Queue Status
```bash
curl http://localhost:3001/api/v1/scan/whois-status
```

### Redis Cache Stats
```bash
redis-cli
> INFO stats
> KEYS whois:*
```

### Application Rate Limit Headers
Every API response includes:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1638360000
```

---

## 🔧 Troubleshooting

### "WHOIS validation failed"
- **Cause:** WHOIS server returned incomplete data or terms of service
- **Solution:** System automatically falls back to RDAP
- **Prevention:** Results cached for 24 hours

### "Rate limit queue full"
- **Cause:** Too many WHOIS queries in a short time
- **Solution:** Wait 1 second or check `/whois-status`
- **Prevention:** Use cached results when possible

### "VirusTotal quota exceeded"
- **Cause:** Exceeded 4 requests/minute or 500/day
- **Solution:** System returns cached results
- **Prevention:** Add more API keys for rotation

### "Too many requests" (429)
- **Cause:** User IP exceeded your backend limits
- **Solution:** User must wait until rate limit window resets
- **Prevention:** Increase `RATE_LIMIT_MAX` in `.env` (development only)

---

## 📝 Summary

| Service | Limit Type | Max Rate | Reset Window |
|---------|------------|----------|--------------|
| **Your Backend** | Per IP | 100 requests | 15 minutes |
| **WHOIS Servers** | Per Server IP | 1 query/sec, 80/day | 1 sec, 24 hours |
| **VirusTotal** | Per API Key | 4/min, 500/day | 1 min, 24 hours |
| **IPInfo** | Per Token | 50,000/month | 30 days |
| **ProxyCheck** | Per API Key | 1,000/day | 24 hours |
| **AbuseIPDB** | Per API Key | 1,000/day | 24 hours |

---

## 🎯 Key Takeaways

1. **WHOIS rate limiting is now automatic** - you don't need to worry about it
2. **Monitor usage** via `/api/v1/scan/whois-status`
3. **Caching is your friend** - reduces external API calls by 90%+
4. **In production, use strict limits** - prevents abuse and quota exhaustion
5. **For development, use relaxed limits** - faster iteration and testing

---

**Last Updated:** 2025-12-02  
**Related Files:**
- `backend/src/services/whois-queue.ts` - WHOIS rate limiting queue
- `backend/src/middleware/rateLimit.ts` - Express rate limiting
- `backend/src/services/whois.ts` - WHOIS service with queue integration
