import CircuitBreaker from 'opossum';

// Circuit Breaker Options
const circuitBreakerOptions = {
    timeout: 5000, // If function takes longer than 5s, trigger failure
    errorThresholdPercentage: 50, // When 50% of requests fail, open circuit
    resetTimeout: 30000, // After 30s, try again (half-open state)
    rollingCountTimeout: 10000, // Measure success/failure over 10s window
    rollingCountBuckets: 10, // Divide window into 10 buckets
    name: 'ExternalAPIBreaker',
};

// Create a generic circuit breaker wrapper
export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: Partial<typeof circuitBreakerOptions> = {}
): CircuitBreaker<Parameters<T>, ReturnType<T>> {
    const breaker = new CircuitBreaker(fn, { ...circuitBreakerOptions, ...options });

    // Event listeners for monitoring
    breaker.on('open', () => {
        console.warn(`⚠️  Circuit breaker OPENED for ${options.name || 'function'}`);
    });

    breaker.on('halfOpen', () => {
        console.info(`🔄 Circuit breaker HALF-OPEN for ${options.name || 'function'}`);
    });

    breaker.on('close', () => {
        console.info(`✅ Circuit breaker CLOSED for ${options.name || 'function'}`);
    });

    breaker.on('fallback', (result) => {
        console.info(`🔀 Fallback triggered for ${options.name || 'function'}`, result);
    });

    return breaker as any; // Type assertion for compatibility
}

// Fallback functions
export const fallbackStrategies = {
    // Return cached data or empty response
    emptyScan: () => ({
        error: 'Service temporarily unavailable',
        cached: false,
        fallback: true,
    }),

    // Return last known good response
    cachedResponse: (cache: any) => cache || fallbackStrategies.emptyScan(),
};
