/**
 * Backend warmup utility to prevent cold starts
 * Preemptively calls all backend APIs with test requests
 */

import { API_BASE_URL } from '../config';

// Test data for warmup requests
const TEST_DOMAIN = 'example.com';
const TEST_IP = '8.8.8.8';

interface WarmupResult {
  service: string;
  status: 'success' | 'failed';
  time: number;
}

/**
 * Warm up a single API endpoint
 */
async function warmupEndpoint(
  name: string,
  url: string,
  timeout: number = 3000
): Promise<WarmupResult> {
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const endTime = performance.now();
    const time = Math.round(endTime - startTime);

    // Don't care about response status for warmup, just that connection was made
    // console.log(`✅ Warmed up ${name} in ${time}ms`);
    return { service: name, status: 'success', time };
  } catch (error: any) {
    const endTime = performance.now();
    const time = Math.round(endTime - startTime);

    // Ignore abort errors (timeouts) as they are expected during warmup
    if (error.name !== 'AbortError') {
      // console.warn(`⚠️ Warmup failed for ${name} (${time}ms):`, error);
    }
    return { service: name, status: 'failed', time };
  }
}

/**
 * Warm up all backend services in parallel
 * This should be called when the app initializes
 */
export async function warmupBackendServices(): Promise<WarmupResult[]> {
  // Warmup started
  const startTime = performance.now();

  // Use the backend API endpoints directly
  const warmupTasks = [
    // VirusTotal removed from warmup to save quota
    // WHOIS, IPQS, and AbuseIPDB disabled to save API quota during development
    // warmupEndpoint('WHOIS', `${API_BASE_URL}/api/v1/scan/whois?domain=${TEST_DOMAIN}`, 3000),
    // warmupEndpoint('IPQS', `${API_BASE_URL}/api/v1/scan/ipqs?ip=${TEST_IP}`, 3000),
    // warmupEndpoint('AbuseIPDB', `${API_BASE_URL}/api/v1/scan/abuseipdb?ip=${TEST_IP}`, 3000),
  ];

  const results = await Promise.allSettled(warmupTasks);

  const warmupResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        service: `Service ${index}`,
        status: 'failed' as const,
        time: 0
      };
    }
  });

  const successCount = warmupResults.filter(r => r.status === 'success').length;
  const endTime = performance.now();
  const duration = endTime - startTime;

  return warmupResults;
}

/**
 * Start warmup in background (non-blocking)
 * Returns immediately, warmup happens asynchronously
 */
export function startBackgroundWarmup(): void {
  // Run warmup in background without blocking app initialization
  setTimeout(() => {
    warmupBackendServices().catch(err => {
      console.error('Background warmup failed:', err);
    });
  }, 100); // Small delay to not interfere with app initialization
}
