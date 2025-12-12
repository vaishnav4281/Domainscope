import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics';

// Prometheus exporter on /metrics endpoint
const prometheusExporter = new PrometheusExporter({
    port: 9464, // Metrics available on http://localhost:9464/metrics
}, () => {
    console.log('📊 Prometheus metrics server running on port 9464');
});

// Setup OpenTelemetry SDK
const sdk = new NodeSDK({
    metricReader: prometheusExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': {
                enabled: false, // Disable file system instrumentation (too noisy)
            },
        }),
    ],
});

// Initialize OpenTelemetry
export function initTelemetry() {
    try {
        sdk.start();
        console.log('🔭 OpenTelemetry initialized');
    } catch (error) {
        console.error('Failed to initialize OpenTelemetry:', error);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('OpenTelemetry shut down'))
        .catch((error) => console.error('Error shutting down OpenTelemetry', error))
        .finally(() => process.exit(0));
});
