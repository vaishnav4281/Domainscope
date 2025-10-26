# Troubleshooting Guide

## Issue: AbuseIPDB Score shows "-" and DNS Blacklist shows "⏳ Checking..."

### Quick Checks

1. **Are both servers running?**
   ```bash
   # Check if servers are active
   ps aux | grep -E 'npm run dev|node dev-server' | grep -v grep
   
   # Should see both:
   # - npm run dev (main server)
   # - node dev-server.js (DNSBL server)
   ```

2. **Are ports accessible?**
   ```bash
   # Test main server
   curl http://localhost:8080
   
   # Test DNSBL server
   curl http://localhost:3001/api/dnsbl/check?ip=8.8.8.8
   ```

3. **Open Browser Console**
   - Press **F12** in your browser
   - Go to **Console** tab
   - Look for errors in red

### Common Issues & Solutions

#### Issue 1: "SecurityIntel IPQS failed" or "SecurityIntel AbuseIPDB failed"

**Cause:** API quota exceeded or invalid key

**Solution:**
1. Check console for exact error message
2. If quota exceeded: Wait for reset or use backup key
3. If 401/403: Check API key is correct in `.env`

**Example Console Output:**
```
❌ IPQS failed: 402 {"success":false,"message":"exceeded quota"}
🔄 IPQS failed, trying free fallback (ip-api.com)...
✅ ip-api.com data: {country: "US", isp: "Google LLC"}
```

#### Issue 2: DNSBL stuck on "⏳ Checking..."

**Cause:** DNSBL server not running

**Solution:**
```bash
# Terminal 2 - Start DNSBL server
cd /home/batman/Documents/Domainscope-main
npm run dev:dnsbl
```

**Expected Output:**
```
🚀 DNSBL server running on http://localhost:3001
```

#### Issue 3: AbuseIPDB score shows "-"

**Cause:** API key invalid or quota exceeded

**Test API key:**
```bash
curl -s -G https://api.abuseipdb.com/api/v2/check \
  --data-urlencode "ipAddress=8.8.8.8" \
  -d "maxAgeInDays=90" \
  -H "Key: YOUR_ABUSEIPDB_KEY" \
  -H "Accept: application/json"
```

**If quota exceeded:**
- Free tier: 1,000 requests/day
- Check console for fallback: "🔄 AbuseIPDB failed, will estimate from DNSBL"

#### Issue 4: Data shows in Results tab but not Security Intelligence tab

**Cause:** SecurityIntelPanel not reading from existing results

**Check Console for:**
```
✅ Pre-populated IP data from results: {...}
⏭️ Skipping fetch for 8.8.8.8 - using existing data
```

**If NOT seeing this:**
1. Hard refresh browser: **Ctrl+Shift+R** (Linux/Windows) or **Cmd+Shift+R** (Mac)
2. Clear cache
3. Restart dev server

### Step-by-Step Debug Process

**1. Restart Both Servers**
```bash
# Terminal 1: Main server
cd /home/batman/Documents/Domainscope-main
npm run dev

# Terminal 2: DNSBL server
cd /home/batman/Documents/Domainscope-main
npm run dev:dnsbl
```

**2. Check Server Console Output**

Main server should show:
```
[vite] IPQS keys available: 2
[vite] IPQS proxy configured with 2 key(s)
VITE v7.1.12 ready in XXXms
➜ Local: http://localhost:8080/
```

DNSBL server should show:
```
🚀 DNSBL server running on http://localhost:3001
```

**3. Open Browser DevTools (F12)**
   - Console tab: Check for errors
   - Network tab: Check API calls

**4. Scan a Domain**
   - Example: google.com
   - Watch console output

**5. Expected Console Output**

```
🔍 Checking IP: 142.250.185.46
📡 Calling IPQS via proxy...
[vite] IPQS: Using key #1 for IP 142.250.185.46
✅ IPQS data: {fraud_score: 0, country_code: "US", ISP: "Google LLC"}
✅ AbuseIPDB score: 0
✅ Pre-populated IP data from results: {142.250.185.46: {...}}
⏭️ Skipping fetch for 142.250.185.46 - using existing data
```

### Network Tab Debugging

**Check these API calls:**
1. `/api/vt/domains/google.com` - VirusTotal (should be 200 OK)
2. `/api/ipqs/check?ip=X.X.X.X` - IPQS (200 or 402 if quota exceeded)
3. `/api/abuseipdb/check?ip=X.X.X.X` - AbuseIPDB (should be 200 OK)
4. `/api/dnsbl/check?ip=X.X.X.X` - DNSBL (should be 200 OK)
5. `/api/ip-api/json/X.X.X.X` - Fallback (if IPQS failed)

**Look for:**
- ❌ Red errors = API failed
- ⚠️ Yellow warnings = CORS or network issue
- ✅ Green success = Working properly

### Hard Reset (Nuclear Option)

If nothing works:

```bash
# 1. Kill all Node processes
pkill -f node
pkill -f npm

# 2. Clear npm cache
npm cache clean --force

# 3. Remove node_modules
rm -rf node_modules

# 4. Reinstall
npm install

# 5. Restart both servers
# Terminal 1
npm run dev

# Terminal 2
npm run dev:dnsbl
```

### Check API Keys

Verify all keys are loaded:
```bash
# Check .env file
cat .env

# Should contain:
# VITE_VIRUSTOTAL_API_KEY=...
# VITE_IPQS_API_KEY=...
# VITE_IPQS_API_KEY_2=...
# VITE_ABUSEIPDB_API_KEY=...
```

### Verify Browser is Not Blocking APIs

Some browsers/extensions block API calls:

1. **Disable ad blockers** (uBlock, AdBlock, etc.)
2. **Disable privacy extensions** (Privacy Badger, etc.)
3. **Try incognito/private mode**
4. **Try different browser**

### Still Not Working?

**Create a test request:**

Open browser console (F12) and paste:

```javascript
// Test DNSBL
fetch('/api/dnsbl/check?ip=8.8.8.8')
  .then(r => r.json())
  .then(d => console.log('DNSBL:', d))
  .catch(e => console.error('DNSBL Error:', e));

// Test AbuseIPDB
fetch('/api/abuseipdb/check?ip=8.8.8.8')
  .then(r => r.json())
  .then(d => console.log('AbuseIPDB:', d))
  .catch(e => console.error('AbuseIPDB Error:', e));

// Test IPQS
fetch('/api/ipqs/check?ip=8.8.8.8')
  .then(r => r.json())
  .then(d => console.log('IPQS:', d))
  .catch(e => console.error('IPQS Error:', e));
```

This will show exactly which API is failing.

### Environment Checklist

- [ ] `.env` file exists in project root
- [ ] All 4 API keys are set (VT, IPQS, IPQS_2, AbuseIPDB)
- [ ] No spaces around `=` in `.env`
- [ ] Dev server restarted after changing `.env`
- [ ] DNSBL server running on port 3001
- [ ] Main server running on port 8080/8081
- [ ] Browser DevTools open (F12 → Console)
- [ ] No ad blockers interfering
- [ ] Hard refresh done (Ctrl+Shift+R)
