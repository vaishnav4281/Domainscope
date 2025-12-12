/**
 * High-performance CORS proxy utilities
 * Tries multiple proxies in parallel for fastest response
 */

export interface CorsProxyConfig {
  timeout?: number;
  parallelAttempts?: number;
}

// Expanded list of reliable CORS proxies
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Try multiple CORS proxies in parallel, return first successful response
 * This dramatically reduces latency by racing proxies instead of trying sequentially
 */
export async function fetchThroughCorsProxy(
  targetUrl: string,
  config: CorsProxyConfig = {}
): Promise<Response> {
  const { timeout = 5000, parallelAttempts = 3 } = config;

  // Try first N proxies in parallel
  const proxyUrls = CORS_PROXIES.slice(0, parallelAttempts).map(fn => fn(targetUrl));

  console.log(`🏁 Racing ${parallelAttempts} CORS proxies for ${targetUrl.substring(0, 50)}... (some may fail - this is normal)`);

  return new Promise((resolve, reject) => {
    let completed = 0;
    let hasResolved = false;
    const errors: Error[] = [];

    // Race all proxy attempts (silently handle failures - only log final result)
    proxyUrls.forEach((proxyUrl, index) => {
      fetchWithTimeout(proxyUrl, timeout)
        .then(response => {
          if (!hasResolved && response.ok) {
            hasResolved = true;
            console.log(`✅ CORS proxy #${index + 1} succeeded: ${proxyUrl.split('?')[0]}`);
            resolve(response);
          } else {
            completed++;
            if (!response.ok) {
              errors.push(new Error(`Proxy #${index + 1} returned ${response.status}`));
            }
          }
        })
        .catch(err => {
          completed++;
          errors.push(err);
          // Silently collect errors - only warn if ALL proxies fail
        })
        .finally(() => {
          // If all failed, reject with combined error
          if (!hasResolved && completed === proxyUrls.length) {
            console.error(`❌ All ${proxyUrls.length} CORS proxies failed:`, errors.map(e => e.message).join(', '));
            reject(new Error(`All ${proxyUrls.length} CORS proxies failed: ${errors.map(e => e.message).join(', ')}`));
          }
        });
    });
  });
}

/**
 * Fallback to sequential attempts if parallel fails
 */
export async function fetchThroughCorsProxyWithFallback(
  targetUrl: string,
  config: CorsProxyConfig = {}
): Promise<Response> {
  const { timeout = 5000 } = config;

  // First try parallel approach (fast path)
  try {
    return await fetchThroughCorsProxy(targetUrl, { ...config, parallelAttempts: 3 });
  } catch (parallelError) {
    console.warn('⚠️ Parallel CORS fetch failed, trying remaining proxies sequentially...');

    // Fallback: try remaining proxies one by one
    for (let i = 3; i < CORS_PROXIES.length; i++) {
      try {
        const proxyUrl = CORS_PROXIES[i](targetUrl);
        const response = await fetchWithTimeout(proxyUrl, timeout);
        if (response.ok) {
          console.log(`✅ Sequential CORS proxy #${i + 1} succeeded`);
          return response;
        }
      } catch (err) {
        console.warn(`⚠️ CORS proxy #${i + 1} failed:`, err);
        continue;
      }
    }

    throw new Error('All CORS proxies exhausted');
  }
}
