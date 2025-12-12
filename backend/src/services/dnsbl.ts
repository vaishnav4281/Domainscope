import dns from 'dns/promises';

const ZONES = [
    'zen.spamhaus.org',
    'bl.spamcop.net',
    'dnsbl.sorbs.net',
    'b.barracudacentral.org',
];

function reverseIp(ip: string): string | null {
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        return ip.split('.').reverse().join('.');
    }
    return null;
}

async function checkZone(ip: string, zone: string) {
    const rev = reverseIp(ip);
    if (!rev) return { zone, listed: false, text: null };
    const fqdn = `${rev}.${zone}`;
    try {
        await dns.resolve4(fqdn);
        let txt: string[] = [];
        try {
            const records = await dns.resolveTxt(fqdn);
            txt = records.flat();
        } catch { }
        return { zone, listed: true, text: txt.join(' ') || null };
    } catch {
        return { zone, listed: false, text: null };
    }
}

import { redis } from '../redis.js';

export async function checkDnsbl(ip: string) {
    const cacheKey = `dnsbl:${ip}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    const results = await Promise.all(ZONES.map(z => checkZone(ip, z)));
    const listed = results.filter(r => r && r.listed);
    const response = { ip, results, listedCount: listed.length };

    await redis.set(cacheKey, JSON.stringify(response), 'EX', 3600); // 1 hour cache
    return response;
}
