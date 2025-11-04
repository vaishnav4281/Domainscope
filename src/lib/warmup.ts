/**
 * Backend warmup utility to prevent cold starts
 * Preemptively calls all backend APIs with test requests
 */

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
    console.log(`✅ Warmed up ${name} in ${time}ms`);
    return { service: name, status: 'success', time };
  } catch (error) {
    const endTime = performance.now();
    const time = Math.round(endTime - startTime);
    console.warn(`⚠️ Warmup failed for ${name} (${time}ms):`, error);
    return { service: name, status: 'failed', time };
  }
}

/**
 * Warm up all backend services in parallel
 * This should be called when the app initializes
 */
export async function warmupBackendServices(): Promise<WarmupResult[]> {
  console.log('🔥 Starting backend warmup...');
  
  const warmupTasks = [
    warmupEndpoint('VirusTotal', `/api/vt/domains/${TEST_DOMAIN}`, 3000),
    warmupEndpoint('WHOIS', `/api/whois?domain=${TEST_DOMAIN}`, 3000),
    warmupEndpoint('IPQS', `/api/ipqs/check?ip=${TEST_IP}`, 3000),
    warmupEndpoint('AbuseIPDB', `/api/abuseipdb/check?ip=${TEST_IP}`, 3000),
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
  const totalTime = warmupResults.reduce((sum, r) => sum + r.time, 0);
  const avgTime = totalTime / warmupResults.length;
  
  console.log(`🔥 Warmup complete: ${successCount}/${warmupResults.length} services ready (avg ${Math.round(avgTime)}ms)`);
  
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
