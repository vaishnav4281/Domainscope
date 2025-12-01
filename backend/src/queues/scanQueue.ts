import dns from 'node:dns/promises';
import { Queue, Worker } from 'bullmq';
import { redis } from '../redis.js';
import { checkDnsbl } from '../services/dnsbl.js';
import { getWhois } from '../services/whois.js';
import { checkVirusTotal } from '../services/vt.js';
import { checkIPQS } from '../services/ipqs.js';
import { checkAbuseIPDB } from '../services/abuseipdb.js';
import { prisma } from '../app.js';

export const scanQueue = new Queue('scan-queue', { connection: redis });

const worker = new Worker('scan-queue', async (job: any) => {
    const { target, userId, scanId } = job.data;
    console.log(`Processing scan for ${target} (Job ${job.id})`);

    try {
        // Resolve domain to IP for IP-based checks
        let ip = target;
        if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(target)) {
            try {
                const resolved = await dns.resolve4(target);
                ip = resolved[0];
            } catch (e) {
                console.warn(`Could not resolve IP for ${target}, skipping IP-based checks`);
                ip = null;
            }
        }

        // Run all checks in parallel using allSettled to prevent one failure from stopping others
        const [dnsbl, whois, vt, ipqs, abuseipdb] = await Promise.allSettled([
            ip ? checkDnsbl(ip) : Promise.resolve(null),
            getWhois(target),
            checkVirusTotal(target),
            ip ? checkIPQS(ip) : Promise.resolve(null),
            ip ? checkAbuseIPDB(ip) : Promise.resolve(null)
        ]);

        const result = {
            dnsbl: dnsbl.status === 'fulfilled' ? dnsbl.value : { error: 'Failed to fetch' },
            whois: whois.status === 'fulfilled' ? whois.value : { error: 'Failed to fetch' },
            vt: vt.status === 'fulfilled' ? vt.value : { error: 'Failed to fetch' },
            ipqs: ipqs.status === 'fulfilled' ? ipqs.value : { error: 'Failed to fetch' },
            abuseipdb: abuseipdb.status === 'fulfilled' ? abuseipdb.value : { error: 'Failed to fetch' },
            timestamp: new Date().toISOString()
        };

        // Update scan history with result
        if (scanId) {
            await prisma.scanHistory.update({
                where: { id: scanId },
                data: { result }
            });
        }

        return result;
    } catch (error: any) {
        console.error(`Scan failed for ${target}:`, error);
        throw error;
    }
}, { connection: redis });

worker.on('completed', (job: any) => {
    console.log(`Scan job ${job.id} completed`);
});

worker.on('failed', (job: any, err: any) => {
    console.error(`Scan job ${job?.id} failed:`, err);
});
