import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const cwd = process.cwd();
  const env = loadEnv(mode, cwd, "");
  const vtKey = env.VITE_VIRUSTOTAL_API_KEY || process.env.VITE_VIRUSTOTAL_API_KEY;
  const ipqsKeys = [
    env.VITE_IPQS_API_KEY || process.env.VITE_IPQS_API_KEY,
    env.VITE_IPQS_API_KEY_2 || process.env.VITE_IPQS_API_KEY_2,
    env.VITE_IPQS_API_KEY_3 || process.env.VITE_IPQS_API_KEY_3,
    env.VITE_IPQS_API_KEY_4 || process.env.VITE_IPQS_API_KEY_4,
    env.VITE_IPQS_API_KEY_5 || process.env.VITE_IPQS_API_KEY_5,
  ].filter(Boolean);
  const abuseKey = env.VITE_ABUSEIPDB_API_KEY || process.env.VITE_ABUSEIPDB_API_KEY;
  const hasVtKey = Boolean(vtKey);
  // Diagnostics (no secrets):
  console.log("[vite] mode=", mode, "cwd=", cwd);
  console.log("[vite] .env exists:", fs.existsSync(path.join(cwd, ".env")));
  console.log("[vite] .env.development exists:", fs.existsSync(path.join(cwd, ".env.development")));
  console.log("[vite] .env.local exists:", fs.existsSync(path.join(cwd, ".env.local")));
  console.log("[vite] .env.development.local exists:", fs.existsSync(path.join(cwd, ".env.development.local")));
  console.log("[vite] Loaded env keys:", Object.keys(env));
  console.log("[vite] VirusTotal key present:", hasVtKey);
  console.log("[vite] IPQS keys available:", ipqsKeys.length);

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api/whois': {
          target: 'https://whois-aoi.onrender.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/whois/, '/whois'),
        },
        // Dev proxy for VirusTotal to avoid CORS and inject API key server-side
        '/api/vt': {
          target: 'https://www.virustotal.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/vt/, '/api/v3'),
          configure: (proxy) => {
            if (!vtKey) {
              console.warn('[vite] VITE_VIRUSTOTAL_API_KEY not loaded. VT requests will 401.');
            }
            proxy.on('proxyReq', (proxyReq) => {
              if (vtKey) {
                proxyReq.setHeader('x-apikey', vtKey);
              }
            });
          },
        },
        // Dev proxy for IPQS with optimized automatic key rotation
        '/api/ipqs': {
          target: 'https://ipqualityscore.com',
          changeOrigin: true,
          configure: (proxy, options) => {
            if (ipqsKeys.length === 0) {
              console.warn('[vite] No IPQS API keys loaded. IPQS requests will fail.');
            } else {
              console.log(`[vite] IPQS proxy configured with ${ipqsKeys.length} key(s)`);
            }
            
            // Track key status: null = untested, true = working, false = exhausted
            const keyStatus: (boolean | null)[] = ipqsKeys.map(() => null);
            let currentKeyIndex = 0;
            
            // INSTANT STARTUP: Test keys lazily on-demand instead of blocking at startup
            if (ipqsKeys.length > 0) {
              console.log(`[vite] ⚡ IPQS proxy ready with ${ipqsKeys.length} key(s) - instant startup mode`);
            }
            
            // Helper to find next working key instantly
            const findNextWorkingKey = () => {
              for (let i = currentKeyIndex + 1; i < ipqsKeys.length; i++) {
                if (keyStatus[i] !== false) return i;
              }
              return currentKeyIndex; // No better key found
            };
            
            proxy.on('proxyReq', (proxyReq, req, res) => {
              const ip = new URL(`http://localhost${req.url}`).searchParams.get('ip');
              if (!ip) {
                console.error('[vite] IPQS proxy: missing ip parameter');
                proxyReq.path = '/api/json/ip/invalid/invalid';
                return;
              }
              
              const currentKey = ipqsKeys[currentKeyIndex];
              if (!currentKey) {
                console.error('[vite] IPQS proxy: no API key available');
                proxyReq.path = '/api/json/ip/invalid/invalid';
                return;
              }
              
              proxyReq.path = `/api/json/ip/${currentKey}/${ip}?strictness=1&allow_public_access_points=true&lighter_penalties=true`;
              console.log(`[vite] ⚡ IPQS: Using key #${currentKeyIndex + 1} for IP ${ip}`);
            });
            
            proxy.on('proxyRes', (proxyRes, req, res) => {
              const chunks: Buffer[] = [];
              proxyRes.on('data', (chunk) => chunks.push(chunk));
              proxyRes.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                
                // Check if quota exceeded
                if (body.includes('exceeded your request quota')) {
                  keyStatus[currentKeyIndex] = false; // Mark as exhausted
                  
                  // OPTIMIZED: Immediately find next working key
                  const nextKey = findNextWorkingKey();
                  if (nextKey !== currentKeyIndex) {
                    console.warn(`[vite] ⚡ Key #${currentKeyIndex + 1} exhausted, instantly switching to key #${nextKey + 1}`);
                    currentKeyIndex = nextKey;
                  } else {
                    console.error(`[vite] ❌ All IPQS keys exhausted`);
                  }
                }
              });
            });
          },
        },
        // Dev proxy for AbuseIPDB to avoid CORS
        '/api/abuseipdb': {
          target: 'https://api.abuseipdb.com',
          changeOrigin: true,
          rewrite: (p) => {
            const ip = new URL(`http://localhost${p}`).searchParams.get('ip');
            if (!ip) {
              console.error('[vite] AbuseIPDB proxy: missing ip parameter');
              return '/api/v2/check?ipAddress=invalid';
            }
            console.log(`[vite] AbuseIPDB proxy: fetching data for IP ${ip}`);
            return `/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`;
          },
          configure: (proxy) => {
            if (!abuseKey) {
              console.warn('[vite] VITE_ABUSEIPDB_API_KEY not loaded. AbuseIPDB requests will fail.');
            }
            proxy.on('proxyReq', (proxyReq) => {
              if (abuseKey) {
                proxyReq.setHeader('Accept', 'application/json');
                proxyReq.setHeader('Key', abuseKey);
                console.log('[vite] AbuseIPDB proxy: API key added to headers');
              }
            });
          },
        },
        // Dev proxy for DNSBL - forwards to local Node server (run: npm run dev:dnsbl)
        // OPTIONAL: Comment out if not running DNSBL server to avoid errors
        // '/api/dnsbl': {
        //   target: 'http://localhost:3001',
        //   changeOrigin: true,
        // },
        // Dev proxy for free ip-api.com fallback (no API key needed)
        '/api/ip-api': {
          target: 'http://ip-api.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/ip-api/, ''),
        },
      },
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
