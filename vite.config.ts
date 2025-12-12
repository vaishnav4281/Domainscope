import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";
import dotenv from "dotenv";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const cwd = process.cwd();

  // Load env_config manually to ensure keys are available
  const envConfigPath = path.join(cwd, 'env_config');
  if (fs.existsSync(envConfigPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envConfigPath));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
    console.log("[vite] Loaded env_config");
  }

  const env = loadEnv(mode, cwd, "");
  const vtKey = env.VITE_VIRUSTOTAL_API_KEY || process.env.VITE_VIRUSTOTAL_API_KEY;
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

  return {
    server: {
      watch: {
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/backend/**'],
      },
      host: "::",
      port: 8080,
      proxy: {
        '/api/whois': {
          target: 'https://whois-aoi.onrender.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/whois/, '/whois'),
        },
        // Dev proxy for VirusTotal with automatic key rotation
        '/api/vt': {
          target: 'https://www.virustotal.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/vt/, '/api/v3'),
          configure: (proxy) => {
            const vtKeys = [
              env.VITE_VIRUSTOTAL_API_KEY || process.env.VITE_VIRUSTOTAL_API_KEY,
              env.VITE_VIRUSTOTAL_API_KEY_2 || process.env.VITE_VIRUSTOTAL_API_KEY_2,
              env.VITE_VIRUSTOTAL_API_KEY_3 || process.env.VITE_VIRUSTOTAL_API_KEY_3,
              env.VITE_VIRUSTOTAL_API_KEY_4 || process.env.VITE_VIRUSTOTAL_API_KEY_4,
              env.VITE_VIRUSTOTAL_API_KEY_5 || process.env.VITE_VIRUSTOTAL_API_KEY_5,
            ].filter(Boolean);

            if (vtKeys.length === 0) {
              console.warn('[vite] VITE_VIRUSTOTAL_API_KEY not loaded. VT requests will 401.');
            } else {
              console.log(`[vite] VirusTotal proxy configured with ${vtKeys.length} key(s)`);
            }

            // Track key status: null = untested, true = working, false = exhausted
            const keyStatus: (boolean | null)[] = vtKeys.map(() => null);
            let currentKeyIndex = 0;

            const findNextWorkingKey = () => {
              for (let i = currentKeyIndex + 1; i < vtKeys.length; i++) {
                if (keyStatus[i] !== false) return i;
              }
              // Loop back to start if needed (optional, but VT quotas are usually daily/hourly)
              for (let i = 0; i < currentKeyIndex; i++) {
                if (keyStatus[i] !== false) return i;
              }
              return currentKeyIndex;
            };

            proxy.on('proxyReq', (proxyReq) => {
              const currentKey = vtKeys[currentKeyIndex];
              if (currentKey) {
                proxyReq.setHeader('x-apikey', currentKey);
                console.log(`[vite] 🛡️ VT: Using key #${currentKeyIndex + 1}`);
              }
            });

            proxy.on('proxyRes', (proxyRes, req, res) => {
              // VT returns 429 for quota exceeded or 204 for rate limit
              if (proxyRes.statusCode === 429 || proxyRes.statusCode === 204) {
                console.warn(`[vite] ⚠️ VT Key #${currentKeyIndex + 1} hit rate limit/quota (Status: ${proxyRes.statusCode})`);
                keyStatus[currentKeyIndex] = false; // Mark as exhausted/limited

                const nextKey = findNextWorkingKey();
                if (nextKey !== currentKeyIndex) {
                  console.log(`[vite] 🔄 Switching to VT Key #${nextKey + 1}`);
                  currentKeyIndex = nextKey;
                } else {
                  console.error('[vite] ❌ All VirusTotal keys exhausted or rate limited');
                }
              }
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
