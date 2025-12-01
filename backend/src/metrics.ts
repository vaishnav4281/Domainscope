import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for SLO tracking
export const metrics = {
    // HTTP request duration (for latency SLO)
    httpRequestDuration: new client.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.5, 1, 2, 5, 10], // SLO buckets
        registers: [register],
    }),

    // HTTP request counter (for availability SLO)
    httpRequestTotal: new client.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code'],
        registers: [register],
    }),

    // Error rate (for error budget SLO)
    httpRequestErrors: new client.Counter({
        name: 'http_request_errors_total',
        help: 'Total number of HTTP errors',
        labelNames: ['method', 'route', 'error_type'],
        registers: [register],
    }),

    // Cache hit rate
    cacheHits: new client.Counter({
        name: 'cache_hits_total',
        help: 'Total number of cache hits',
        labelNames: ['cache_type'],
        registers: [register],
    }),

    cacheMisses: new client.Counter({
        name: 'cache_misses_total',
        help: 'Total number of cache misses',
        labelNames: ['cache_type'],
        registers: [register],
    }),

    // External API calls
    externalApiCalls: new client.Counter({
        name: 'external_api_calls_total',
        help: 'Total number of external API calls',
        labelNames: ['service', 'status'],
        registers: [register],
    }),

    // Queue metrics
    queueJobsProcessed: new client.Counter({
        name: 'queue_jobs_processed_total',
        help: 'Total number of queue jobs processed',
        labelNames: ['queue_name', 'status'],
        registers: [register],
    }),

    queueJobDuration: new client.Histogram({
        name: 'queue_job_duration_seconds',
        help: 'Duration of queue job processing',
        labelNames: ['queue_name'],
        buckets: [1, 5, 10, 30, 60, 120],
        registers: [register],
    }),

    // Circuit breaker metrics
    circuitBreakerState: new client.Gauge({
        name: 'circuit_breaker_state',
        help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
        labelNames: ['breaker_name'],
        registers: [register],
    }),
};

// SLO Definitions (aligned with Google SRE best practices)
export const SLOs = {
    // 99.9% availability (43.2 minutes downtime per month)
    availability: 0.999,

    // 95% of requests under 500ms (P95 latency)
    latencyP95: 0.5,

    // 99% of requests under 2s (P99 latency)
    latencyP99: 2.0,

    // Error rate below 0.1%
    errorRate: 0.001,
};
