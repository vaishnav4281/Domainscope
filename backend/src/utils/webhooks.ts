import crypto from 'crypto';
import { prisma } from '../app.js';

interface WebhookPayload {
    event: string;
    timestamp: string;
    data: any;
}

// Generate HMAC signature for webhook security
function generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Exponential backoff retry logic
async function deliverWithRetry(
    url: string,
    payload: WebhookPayload,
    secret: string,
    maxRetries = 3
): Promise<boolean> {
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, secret);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': payload.event,
                    'User-Agent': 'DomainScope-Webhooks/1.0',
                },
                body: payloadString,
                signal: AbortSignal.timeout(10000), // 10s timeout
            });

            if (response.ok) {
                console.log(`✅ Webhook delivered successfully to ${url}`);
                return true;
            }

            // Retry on 5xx errors
            if (response.status >= 500 && response.status < 600) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
                console.warn(`⚠️  Webhook failed (${response.status}), retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Don't retry on 4xx errors
            console.error(`❌ Webhook rejected (${response.status}): ${url}`);
            return false;

        } catch (error: any) {
            const delay = Math.pow(2, attempt) * 1000;
            console.error(`❌ Webhook delivery error (attempt ${attempt + 1}):`, error.message);

            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`❌ Webhook delivery failed after ${maxRetries} attempts: ${url}`);
    return false;
}

// Trigger webhooks for a specific event
export async function triggerWebhooks(event: string, data: any, userId?: number) {
    try {
        // Find active webhooks for this event
        const webhooks = await prisma.webhook.findMany({
            where: {
                isActive: true,
                ...(userId && { userId }),
                events: {
                    has: event,
                },
            },
        });

        if (webhooks.length === 0) {
            console.log(`No active webhooks for event: ${event}`);
            return;
        }

        const payload: WebhookPayload = {
            event,
            timestamp: new Date().toISOString(),
            data,
        };

        // Deliver webhooks in parallel
        const deliveryPromises = webhooks.map(async (webhook: any) => {
            const success = await deliverWithRetry(webhook.url, payload, webhook.secret);

            // Update webhook stats
            await prisma.webhook.update({
                where: { id: webhook.id },
                data: {
                    lastTriggered: new Date(),
                    failureCount: success ? 0 : webhook.failureCount + 1,
                    // Auto-disable after 10 consecutive failures
                    isActive: webhook.failureCount + 1 < 10,
                },
            });

            return success;
        });

        const results = await Promise.allSettled(deliveryPromises);
        const successCount = results.filter((r: any) => r.status === 'fulfilled' && r.value).length;

        console.log(`📤 Triggered ${successCount}/${webhooks.length} webhooks for event: ${event}`);

    } catch (error) {
        console.error('Error triggering webhooks:', error);
    }
}
