# API Key Rotation Feature

## Overview
The application now supports **automatic API key rotation** to handle quota limits gracefully. When one API key reaches its daily limit, the system automatically switches to the next available key.

## IPQS Key Rotation

### How It Works
1. **Configure multiple keys** in your `.env` file
2. **Primary key is used first** for all requests
3. **Automatic detection** when quota is exceeded (response contains "exceeded your request quota")
4. **Instant rotation** to backup key(s)
5. **Console logging** shows which key is currently active

### Setup

Add both keys to your `.env` file:

```env
# Primary IPQS key (tried first)
VITE_IPQS_API_KEY=yW2ejYvhaXyjsqemMHboVbiUJZkJmUgv

# Backup IPQS key (used when primary quota exceeded)
VITE_IPQS_API_KEY_2=4quUyR9n6yOAgFgJOatSyIh891kTgxi6
```

### Console Output

When the system rotates keys, you'll see:

```
[vite] IPQS proxy configured with 2 key(s)
[vite] IPQS: Using key #1 for IP 8.8.8.8
[vite] IPQS key #1 quota exceeded, rotating to key #2
[vite] IPQS: Using key #2 for IP 1.1.1.1
```

### Benefits

| Scenario | Without Rotation | With Rotation |
|----------|-----------------|---------------|
| Single key (35/day) | ❌ Fails after 35 requests | ❌ Still fails after 35 |
| Two keys (70/day) | ❌ Fails after 35 requests | ✅ Works up to 70 requests |
| Three keys (105/day) | ❌ Fails after 35 requests | ✅ Works up to 105 requests |

### How Many Keys Can I Add?

You can add as many keys as needed:
- `VITE_IPQS_API_KEY` - Primary (required)
- `VITE_IPQS_API_KEY_2` - Backup 1 (optional)
- `VITE_IPQS_API_KEY_3` - Backup 2 (optional)
- And so on...

**Note:** Currently only 2 keys are supported. To add more, update `vite.config.ts`:

```typescript
const ipqsKeys = [
  env.VITE_IPQS_API_KEY,
  env.VITE_IPQS_API_KEY_2,
  env.VITE_IPQS_API_KEY_3,
  // Add more...
].filter(Boolean);
```

## Key Rotation Logic

### Server-Side (vite.config.ts)
The Vite dev proxy handles key rotation automatically:

```typescript
1. Start with key index 0 (primary key)
2. For each IPQS request:
   a. Use current key index
   b. Make request to IPQS
   c. Check response for quota exceeded message
   d. If quota exceeded AND more keys available:
      - Increment key index
      - Log rotation event
   e. Next request uses new key index
```

### Client-Side Fallback
If the proxy fails, components fall back to:
1. **ip-api.com** (free service, no key needed)
2. Provides Country, ISP, Proxy detection
3. Estimates fraud score based on hosting/proxy flags

## Free Tier Limits

| Service | Free Quota | With 2 Keys | With 3 Keys |
|---------|-----------|-------------|-------------|
| IPQS | 35/day | 70/day | 105/day |
| AbuseIPDB | 1,000/day | 1,000/day | 1,000/day |
| VirusTotal | 500/day | 500/day | 500/day |
| ip-api.com | 45/min | 45/min | 45/min |

## Testing Key Rotation

### Manual Test
1. Set both keys in `.env`
2. Run `npm run dev`
3. Check console output: `IPQS proxy configured with 2 key(s)`
4. Scan 35+ domains to trigger rotation
5. Watch for: `IPQS key #1 quota exceeded, rotating to key #2`

### Verify Active Keys
On server start, you'll see:
```
[vite] IPQS keys available: 2
```

## Troubleshooting

### Both Keys Exhausted
If all keys exceed quota:
```
❌ IPQS failed: 402 {"success":false,"message":"exceeded quota"}
🔄 IPQS failed, trying free fallback (ip-api.com)...
✅ ip-api.com data: {country: "US", isp: "Google LLC"}
📊 Estimated risk score from fallback: 40
```

### Key Not Loading
Check the console on server start:
```
[vite] Loaded env keys: ['VITE_IPQS_API_KEY', 'VITE_IPQS_API_KEY_2', ...]
[vite] IPQS keys available: 2
```

If you see `IPQS keys available: 1`, the second key isn't loaded.

**Solution:**
1. Verify `.env` file has correct format (no spaces around `=`)
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Check for typos: `VITE_IPQS_API_KEY_2` (note the underscore)

## Best Practices

1. **Create multiple accounts** - Get free keys from different IPQS accounts
2. **Monitor usage** - Watch console logs to track which keys are active
3. **Stagger key expiration** - Create accounts on different days
4. **Keep backup keys fresh** - Rotate keys monthly
5. **Test before production** - Verify rotation works before deploying

## Quota Reset Times

- **IPQS**: Resets at midnight UTC (~5:30 AM IST)
- **AbuseIPDB**: Rolling 24-hour window
- **VirusTotal**: Rolling 24-hour window
- **ip-api.com**: Per-minute rolling limit

## Production Deployment

When deploying to production, add environment variables on your hosting platform:

**Vercel/Netlify:**
```
VITE_IPQS_API_KEY=your_primary_key
VITE_IPQS_API_KEY_2=your_backup_key
```

**Docker:**
```dockerfile
ENV VITE_IPQS_API_KEY=your_primary_key
ENV VITE_IPQS_API_KEY_2=your_backup_key
```

## Security Notes

- ✅ Keys are loaded server-side via Vite proxy
- ✅ Keys are NOT exposed in client bundle
- ✅ Keys are injected into API requests server-side
- ⚠️ Never commit `.env` file to Git
- ⚠️ Use `.env.example` for templates only

## Summary

With 2 IPQS keys configured:
- ✅ **70 requests/day** instead of 35
- ✅ **Zero downtime** when key 1 exhausted
- ✅ **Automatic rotation** with no manual intervention
- ✅ **Free fallback** (ip-api.com) when all keys exhausted
- ✅ **Transparent to users** - they never see errors
