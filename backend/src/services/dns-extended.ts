import dns from 'node:dns/promises';
import { redis } from '../redis.js';

/**
 * Extended DNS Records Service
 * Provides comprehensive DNS record lookups with caching
 */

export async function getExtendedDNS(domain: string) {
    const cacheKey = `dns_extended:${domain.toLowerCase()}`;

    // Check cache first
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[DNS-Extended] Returning cached result for ${domain}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[DNS-Extended] Redis cache error:', err);
    }

    const results: any = {
        domain,
        timestamp: new Date().toISOString(),
        records: {}
    };

    // Fetch all DNS records in parallel
    const fetchPromises = [
        // A Records (IPv4)
        dns.resolve4(domain).then(r => ({ type: 'A', data: r })).catch(() => ({ type: 'A', data: [] })),

        // AAAA Records (IPv6)
        dns.resolve6(domain).then(r => ({ type: 'AAAA', data: r })).catch(() => ({ type: 'AAAA', data: [] })),

        // MX Records (Mail servers)
        dns.resolveMx(domain).then(r => ({ type: 'MX', data: r })).catch(() => ({ type: 'MX', data: [] })),

        // NS Records (Nameservers)
        dns.resolveNs(domain).then(r => ({ type: 'NS', data: r })).catch(() => ({ type: 'NS', data: [] })),

        // TXT Records
        dns.resolveTxt(domain).then(r => ({ type: 'TXT', data: r.map(arr => arr.join('')) })).catch(() => ({ type: 'TXT', data: [] })),

        // CNAME Records
        dns.resolveCname(domain).then(r => ({ type: 'CNAME', data: r })).catch(() => ({ type: 'CNAME', data: [] })),

        // SOA Records
        dns.resolveSoa(domain).then(r => ({ type: 'SOA', data: r })).catch(() => ({ type: 'SOA', data: null })),

        // CAA Records (Certificate Authority Authorization)
        dns.resolveCaa(domain).then(r => ({ type: 'CAA', data: r })).catch(() => ({ type: 'CAA', data: [] })),
    ];

    const allResults = await Promise.all(fetchPromises);

    // Organize results
    allResults.forEach(result => {
        results.records[result.type] = result.data;
    });

    // Add summary statistics
    results.summary = {
        totalRecordTypes: Object.keys(results.records).filter(k => {
            const data = results.records[k];
            return data && (Array.isArray(data) ? data.length > 0 : true);
        }).length,
        hasIPv4: results.records.A?.length > 0,
        hasIPv6: results.records.AAAA?.length > 0,
        hasMail: results.records.MX?.length > 0,
        nameserverCount: results.records.NS?.length || 0,
        txtRecordCount: results.records.TXT?.length || 0
    };

    // Cache for 1 hour (3600 seconds)
    try {
        await redis.setex(cacheKey, 3600, JSON.stringify(results));
    } catch (err) {
        console.warn('[DNS-Extended] Failed to cache result:', err);
    }

    return results;
}

/**
 * Reverse DNS Lookup (PTR records)
 */
export async function getReverseDNS(ip: string) {
    const cacheKey = `dns_reverse:${ip}`;

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[Reverse-DNS] Cache error:', err);
    }

    try {
        const hostnames = await dns.reverse(ip);
        const result = {
            ip,
            hostnames,
            timestamp: new Date().toISOString()
        };

        await redis.setex(cacheKey, 3600, JSON.stringify(result));
        return result;
    } catch (error: any) {
        return {
            ip,
            hostnames: [],
            error: 'No PTR records found',
            timestamp: new Date().toISOString()
        };
    }
}
