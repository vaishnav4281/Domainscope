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
  const ipqsKey = env.VITE_IPQS_API_KEY || process.env.VITE_IPQS_API_KEY;
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
        // Dev proxy for IPQS to avoid ad blockers and CORS
        '/api/ipqs': {
          target: 'https://ipqualityscore.com',
          changeOrigin: true,
          rewrite: (p) => {
            const ip = new URL(`http://localhost${p}`).searchParams.get('ip');
            return `/api/json/ip/${ipqsKey}/${ip}?strictness=1&allow_public_access_points=true&lighter_penalties=true`;
          },
          configure: (proxy) => {
            if (!ipqsKey) {
              console.warn('[vite] VITE_IPQS_API_KEY not loaded. IPQS requests will fail.');
            }
          },
        },
        // Dev proxy for AbuseIPDB to avoid CORS
        '/api/abuseipdb': {
          target: 'https://api.abuseipdb.com',
          changeOrigin: true,
          rewrite: (p) => {
            const ip = new URL(`http://localhost${p}`).searchParams.get('ip');
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
              }
            });
          },
        },
        // Dev proxy for DNSBL - forwards to local Node server (run: npm run dev:dnsbl)
        '/api/dnsbl': {
          target: 'http://localhost:3001',
          changeOrigin: true,
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
