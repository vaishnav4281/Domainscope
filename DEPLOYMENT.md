# Deployment Guide

## Environment Variables for Production

When deploying to **Netlify**, **Vercel**, or similar platforms, you need to set these environment variables:

### Required API Keys

Add these in your deployment platform's settings (Dashboard → Settings → Environment Variables):

```bash
# VirusTotal API
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
VITE_VIRUSTOTAL_API_KEY=your_virustotal_api_key_here

# IPQS (IP Quality Score)
IPQS_API_KEY=your_ipqs_api_key_here
VITE_IPQS_API_KEY=your_ipqs_api_key_here

# AbuseIPDB
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
VITE_ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
```

### Why both formats?

- **`VITE_*` prefixed** variables are used at **build time** (embedded in client bundle)
- **Non-prefixed** variables are used at **runtime** in serverless functions

Both are needed for the application to work properly in production.

## Platform-Specific Instructions

### Netlify

1. Go to **Site settings** → **Environment variables**
2. Add all 6 variables listed above
3. Redeploy: **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

### Vercel

1. Go to **Project Settings** → **Environment Variables**
2. Add all 6 variables
3. Select **Production**, **Preview**, and **Development** for each
4. Redeploy from **Deployments** tab

## Build Settings

### Netlify

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Vercel

Vercel automatically detects the configuration from `package.json`. No extra config needed.

## Troubleshooting

### 500 Error on `/api/vt/domains/*`
- **Cause**: VirusTotal API key not set in production environment
- **Fix**: Add `VIRUSTOTAL_API_KEY` and `VITE_VIRUSTOTAL_API_KEY` to your platform's environment variables

### 422 Error on `/api/abuseipdb/check`
- **Cause**: Invalid IP address being checked
- **Fix**: This is now handled automatically (invalid IPs are skipped)

### DNSBL Errors
- **Cause**: DNSBL requires Node.js `dns` module, only works in serverless functions
- **Fix**: Ensure `api/dnsbl/check.js` is deployed correctly
- **Dev**: Run `npm run dev:dnsbl` in a separate terminal for local testing

### Country/ISP showing "-"
- **Cause**: IPQS API not working
- **Fix**: Check that `IPQS_API_KEY` is set correctly and has credits remaining

## Security Notes

- Never commit `.env` files to git
- API keys should only be set in deployment platform settings
- Client-side keys (`VITE_*`) will be visible in browser (use with caution)
- Server-side keys (non-prefixed) remain secure in serverless functions
