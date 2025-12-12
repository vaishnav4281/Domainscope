
import React, { useState } from "react";
import { API_BASE_URL } from '../config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Database, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchThroughCorsProxy } from "@/lib/cors-proxy";
import { computeAge } from "@/lib/date-utils";

const cleanDomain = (raw: string): string => {
  if (!raw) return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[\s\/?#]/)[0]
    .split(":")[0]
    .replace(/\.+$/, "");
};

interface BulkScannerCardProps {
  onResults: (result: any) => void;
  onMetascraperResults?: (result: any) => void;
  onVirusTotalResults?: (result: any) => void;
  onSubdomainResults?: (result: any) => void;
  // New OSINT handlers
  onExtendedDNSResults?: (result: any) => void;
  onEmailSecurityResults?: (result: any) => void;
  onSSLResults?: (result: any) => void;
  onHeadersResults?: (result: any) => void;
  onThreatIntelResults?: (result: any) => void;
  onWaybackResults?: (result: any) => void;

  onStartScan?: () => void;
  enabledModules: {
    core: boolean;
    security: boolean;
    subdomains: boolean;
    virustotal: boolean;
    metadata: boolean;
    // New modules
    extendedDns: boolean;
    emailSecurity: boolean;
    ssl: boolean;
    headers: boolean;
    threatIntel: boolean;
    wayback: boolean;
  };
  setEnabledModules: React.Dispatch<React.SetStateAction<{
    core: boolean;
    security: boolean;
    subdomains: boolean;
    virustotal: boolean;
    metadata: boolean;
    extendedDns: boolean;
    emailSecurity: boolean;
    ssl: boolean;
    headers: boolean;
    threatIntel: boolean;
    wayback: boolean;
  }>>;
}

const BulkScannerCard = ({
  onResults,
  onMetascraperResults,
  onVirusTotalResults,
  onSubdomainResults,
  onExtendedDNSResults,
  onEmailSecurityResults,
  onSSLResults,
  onHeadersResults,
  onThreatIntelResults,
  onWaybackResults,
  onStartScan,
  enabledModules,
  setEnabledModules
}: BulkScannerCardProps) => {
  const fetchWithTimeout = async (url: string, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err: any) {
      clearTimeout(id);
      throw err;
    }
  };

  const [domains, setDomains] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const { toast } = useToast();

  const BATCH_SIZE = 1; // Process 1 domain at a time to respect rate limits

  // Optimized single domain scan with parallel API calls
  const scanSingleDomain = async (rawDomain: string, index: number) => {
    try {
      const domain = cleanDomain(rawDomain) || rawDomain.trim();

      // OPTIMIZED: All API calls in parallel with shorter timeouts
      const [vtDataResult, whoisResult] = await Promise.allSettled([
        // VirusTotal
        (async () => {
          try {
            const vtUrl = `${API_BASE_URL}/api/v1/scan/vt?domain=${encodeURIComponent(domain)}`;
            let vtResponse = await fetchWithTimeout(vtUrl, 20000);
            if (!vtResponse.ok && vtResponse.status === 401 && import.meta.env.DEV && import.meta.env.VITE_VIRUSTOTAL_API_KEY) {
              const direct = await fetch(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain)}`, {
                headers: { 'x-apikey': import.meta.env.VITE_VIRUSTOTAL_API_KEY }
              });
              if (direct.ok) return await direct.json();
            } else if (vtResponse.ok) {
              return await vtResponse.json();
            }
          } catch (e) { }
          return null;
        })(),
        // WHOIS
        (async () => {
          try {
            const whoisRes = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/whois?domain=${encodeURIComponent(domain)}`, 5000);
            if (whoisRes.ok) return await whoisRes.json();
          } catch (e) { }
          return null;
        })()
      ]);

      const vtData = vtDataResult.status === 'fulfilled' ? vtDataResult.value : null;
      const whoisData = whoisResult.status === 'fulfilled' ? whoisResult.value : null;
      const attrs = vtData?.data?.attributes || {};

      const creationDateStr = attrs.creation_date ? new Date(attrs.creation_date * 1000).toLocaleString() : "-";
      const lastDns: any[] = Array.isArray(attrs.last_dns_records) ? attrs.last_dns_records : [];
      const nsRecords = lastDns.filter(r => r?.type === 'NS').map(r => r?.value).filter(Boolean);
      const aRecord = (lastDns.find(r => r?.type === 'A')?.value) || (lastDns.find(r => r?.type === 'AAAA')?.value) || "-";



      let whoisCreated = creationDateStr;
      let whoisExpires = attrs.last_modification_date ? new Date(attrs.last_modification_date * 1000).toLocaleString() : "-";
      let whoisRegistrar = attrs.registrar || "-";
      if (whoisData) {
        whoisCreated = whoisData.created || whoisData.creation_date || whoisCreated;
        whoisExpires = whoisData.expires || whoisData.expiry_date || whoisExpires;
        whoisRegistrar = whoisData.registrar || whoisRegistrar;
      }

      // OPTIMIZED: IP intelligence with faster timeouts
      let abuseScore = 0, isVpnProxy = false, locCountry = "-", locRegion = "-", locCity = "-";
      let locLatitude = "-", locLongitude = "-", locIsp = "-";

      // Resolve IP first using our new backend endpoint
      let ip = aRecord;
      const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[a-fA-F0-9:]+$/.test(ip);

      if (!isIp || ip === '-') {
        try {
          const dnsRes = await fetch(`${API_BASE_URL}/api/v1/scan/dns?domain=${encodeURIComponent(domain)}`);
          if (dnsRes.ok) {
            const dnsData = await dnsRes.json();
            if (dnsData.ip) ip = dnsData.ip;
          }
        } catch (e) {
          console.warn('DNS resolution failed for', domain);
        }
      }

      const validIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[a-fA-F0-9:]+$/.test(ip);

      let fallbackIpData = null;
      let ipqs = null;
      let abuse = null;

      if (validIp && ip !== '-' && enabledModules.security) {
        const [ipqsResult, abuseResult] = await Promise.allSettled([
          fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/ipqs?ip=${encodeURIComponent(ip)}`, 10000).then(r => r.ok ? r.json() : null),
          fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/abuseipdb?ip=${encodeURIComponent(ip)}`, 10000).then(r => r.ok ? r.json() : null)
        ]);

        ipqs = ipqsResult.status === 'fulfilled' ? ipqsResult.value : null;
        abuse = abuseResult.status === 'fulfilled' ? abuseResult.value : null;

        if (ipqs) {
          const fraud = typeof ipqs.fraud_score === 'number' ? ipqs.fraud_score : 0;
          abuseScore = Math.max(abuseScore, fraud);
          isVpnProxy = Boolean(ipqs.vpn || ipqs.proxy || ipqs.tor);
          locCountry = (ipqs.country_code || ipqs.country || locCountry) as string;
          locRegion = (ipqs.region || locRegion) as string;
          locCity = (ipqs.city || locCity) as string;
          locLatitude = (ipqs.latitude !== undefined && ipqs.latitude !== null) ? String(ipqs.latitude) : locLatitude;
          locLongitude = (ipqs.longitude !== undefined && ipqs.longitude !== null) ? String(ipqs.longitude) : locLongitude;
          locIsp = (ipqs.ISP || ipqs.isp || ipqs.organization || locIsp) as string;
        }
        if (abuse?.data?.abuseConfidenceScore) {
          abuseScore = Math.max(abuseScore, abuse.data.abuseConfidenceScore);
        }

        // Fallback IP-API if needed (matches DomainAnalysisCard logic)
        if (!ipqs?.country_code && !ipqs?.country) {
          try {
            const fallbackRes = await fetchThroughCorsProxy(`http://ip-api.com/json/${ip}`, { timeout: 3000 });
            if (fallbackRes.ok) fallbackIpData = await fallbackRes.json();
          } catch (e) { /* ignore */ }
        }
      }

      if (fallbackIpData && (locCountry === '-' || locIsp === '-')) {
        if (fallbackIpData.status === 'success') {
          locCountry = fallbackIpData.country || locCountry;
          locRegion = fallbackIpData.regionName || locRegion;
          locCity = fallbackIpData.city || locCity;
          locIsp = fallbackIpData.isp || locIsp;
          locLatitude = fallbackIpData.lat ? String(fallbackIpData.lat) : locLatitude;
          locLongitude = fallbackIpData.lon ? String(fallbackIpData.lon) : locLongitude;
        }
      }

      const baseId = Date.now() + index;
      const dnsRecordsString = lastDns.length > 0 ? lastDns.map((r: any) => `${r.type}: ${r.value}`).join('; ') : '-';

      // Extract Passive DNS from VT resolutions if available
      const resolutions = vtData?.resolutions || [];
      const passiveDnsString = resolutions.length > 0
        ? resolutions.map((r: any) => `${r.attributes.ip_address} (${new Date(r.attributes.date * 1000).toISOString().split('T')[0]})`).join('; ')
        : '-';

      const result = {
        id: baseId,
        domain,
        created: whoisCreated,
        expires: whoisExpires,
        domain_age: computeAge(whoisCreated),
        registrar: whoisRegistrar,
        name_servers: nsRecords,
        dns_records: dnsRecordsString,
        passive_dns: passiveDnsString,
        abuse_score: abuseScore,
        is_vpn_proxy: isVpnProxy,
        ip_address: ip !== '-' ? ip : aRecord,
        country: locCountry,
        region: locRegion,
        city: locCity,
        longitude: locLongitude,
        latitude: locLatitude,
        isp: locIsp,
        timestamp: new Date().toLocaleString(),
        type: 'bulk',
        ipqs_data: ipqs,
        abuse_data: abuse,
      };
      onResults(result);



      // OPTIMIZED: Metascraper & VirusTotal results with parallel CORS proxy
      // Await this to prevent flooding the network and ensure reliability
      await Promise.allSettled([
        (onMetascraperResults && enabledModules.metadata) ? (async () => {
          try {
            const targetUrl = `https://${domain}`;
            let html: string | null = null;
            let usedBackendFallback = false;

            // Try CORS proxies first
            try {
              const metascraperResponse = await fetchThroughCorsProxy(targetUrl, { timeout: 5000, parallelAttempts: 3 });
              html = await metascraperResponse.text();
            } catch (corsError: any) {
              console.warn(`[Bulk] Metascraper CORS failed for ${domain}, trying backend fallback...`);

              // Fallback to backend metadata extraction
              try {
                const backendRes = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/metadata?domain=${encodeURIComponent(domain)}`, 15000);
                if (backendRes.ok) {
                  const backendData = await backendRes.json();
                  if (!backendData.error) {
                    usedBackendFallback = true;
                    const metaData: any = {
                      id: baseId + 1,
                      domain,
                      timestamp: new Date().toLocaleString(),
                      ...backendData,
                      source: 'backend'
                    };
                    onMetascraperResults(metaData);
                    return;
                  }
                }
              } catch (backendErr) {
                console.warn(`[Bulk] Backend fallback also failed for ${domain}`);
              }

              if (!usedBackendFallback) {
                throw corsError;
              }
            }

            if (html && !usedBackendFallback) {
              const metaData: any = { id: baseId + 1, domain, timestamp: new Date().toLocaleString() };

              // Extract basic metadata
              const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
              const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
              const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
              metaData.title = (ogTitleMatch?.[1] || twitterTitleMatch?.[1] || titleMatch?.[1] || '').trim();

              const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
              const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
              const twitterDescMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i);
              metaData.description = (ogDescMatch?.[1] || twitterDescMatch?.[1] || descMatch?.[1] || '').trim();

              const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
              if (keywordsMatch) metaData.keywords = keywordsMatch[1].trim();
              const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
              const articleAuthorMatch = html.match(/<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']+)["']/i);
              if (authorMatch || articleAuthorMatch) metaData.author = (articleAuthorMatch?.[1] || authorMatch?.[1] || '').trim();
              const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
              const ogLocaleMatch = html.match(/<meta[^>]*property=["']og:locale["'][^>]*content=["']([^"']+)["']/i);
              if (langMatch || ogLocaleMatch) metaData.lang = (langMatch?.[1] || ogLocaleMatch?.[1] || '').trim();
              const publisherMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
              if (publisherMatch) metaData.publisher = publisherMatch[1].trim();
              const ogTypeMatch = html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i);
              if (ogTypeMatch) metaData.type = ogTypeMatch[1].trim();
              const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
              const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
              if (imageMatch || twitterImageMatch) metaData.image = (imageMatch?.[1] || twitterImageMatch?.[1] || '').trim();
              const imageAltMatch = html.match(/<meta[^>]*property=["']og:image:alt["'][^>]*content=["']([^"']+)["']/i);
              if (imageAltMatch) metaData.imageAlt = imageAltMatch[1].trim();
              const ogUrlMatch = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
              const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
              metaData.url = (ogUrlMatch?.[1] || canonicalMatch?.[1] || targetUrl).trim();
              const twitterCardMatch = html.match(/<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']+)["']/i);
              if (twitterCardMatch) metaData.twitterCard = twitterCardMatch[1].trim();
              const twitterSiteMatch = html.match(/<meta[^>]*name=["']twitter:site["'][^>]*content=["']([^"']+)["']/i);
              if (twitterSiteMatch) metaData.twitterSite = twitterSiteMatch[1].trim();
              const twitterCreatorMatch = html.match(/<meta[^>]*name=["']twitter:creator["'][^>]*content=["']([^"']+)["']/i);
              if (twitterCreatorMatch) metaData.twitterCreator = twitterCreatorMatch[1].trim();
              const publishedMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
              const dateMatch = html.match(/<meta[^>]*name=["']date["'][^>]*content=["']([^"']+)["']/i);
              if (publishedMatch || dateMatch) metaData.date = (publishedMatch?.[1] || dateMatch?.[1] || '').trim();
              const modifiedMatch = html.match(/<meta[^>]*property=["']article:modified_time["'][^>]*content=["']([^"']+)["']/i);
              if (modifiedMatch) metaData.modifiedDate = modifiedMatch[1].trim();
              const sectionMatch = html.match(/<meta[^>]*property=["']article:section["'][^>]*content=["']([^"']+)["']/i);
              if (sectionMatch) metaData.category = sectionMatch[1].trim();
              const articleTagsMatches = html.match(/<meta[^>]*property=["']article:tag["'][^>]*content=["']([^"']+)["']/gi);
              if (articleTagsMatches) {
                metaData.tags = articleTagsMatches.map((tag: string) => {
                  const match = tag.match(/content=["']([^"']+)["']/i);
                  return match ? match[1] : '';
                }).filter(Boolean).join(', ');
              }
              const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
              if (faviconMatch) {
                const faviconUrl = faviconMatch[1].trim();
                metaData.favicon = faviconUrl.startsWith('http') ? faviconUrl : `https://${domain}${faviconUrl.startsWith('/') ? '' : '/'}${faviconUrl}`;
              }

              const appleTouchMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
              if (appleTouchMatch) {
                const appleUrl = appleTouchMatch[1].trim();
                metaData.logo = appleUrl.startsWith('http') ? appleUrl : `https://${domain}${appleUrl.startsWith('/') ? '' : '/'}${appleUrl}`;
              }
              const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
              if (robotsMatch) metaData.robots = robotsMatch[1].trim();
              const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i);
              if (viewportMatch) metaData.viewport = viewportMatch[1].trim();
              const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i);
              if (themeColorMatch) metaData.themeColor = themeColorMatch[1].trim();
              const charsetMatch = html.match(/<meta[^>]*charset=["']?([^"'\s>]+)["']?/i);
              if (charsetMatch) metaData.charset = charsetMatch[1].trim();
              const generatorMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i);
              if (generatorMatch) metaData.generator = generatorMatch[1].trim();
              const rssFeedMatch = html.match(/<link[^>]*type=["']application\/rss\+xml["'][^>]*href=["']([^"']+)["']/i);
              if (rssFeedMatch) {
                const rssUrl = rssFeedMatch[1].trim();
                metaData.rssFeed = rssUrl.startsWith('http') ? rssUrl : `https://${domain}${rssUrl.startsWith('/') ? '' : '/'}${rssUrl}`;
              }
              const atomFeedMatch = html.match(/<link[^>]*type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/i);
              if (atomFeedMatch) {
                const atomUrl = atomFeedMatch[1].trim();
                metaData.atomFeed = atomUrl.startsWith('http') ? atomUrl : `https://${domain}${atomUrl.startsWith('/') ? '' : '/'}${atomUrl}`;
              }
              // JSON-LD
              const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
              if (jsonLdMatches) {
                try {
                  const jsonLdData = jsonLdMatches.map(script => {
                    const content = script.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
                    if (content && content[1]) {
                      try { return JSON.parse(content[1]); } catch { return null; }
                    }
                    return null;
                  }).filter(Boolean);
                  if (jsonLdData.length > 0) {
                    metaData.jsonLd = jsonLdData;
                    const firstSchema = Array.isArray(jsonLdData[0]) ? jsonLdData[0][0] : jsonLdData[0];
                    if (firstSchema) {
                      if (firstSchema['@type']) metaData.schemaType = firstSchema['@type'];
                      if (firstSchema.name && !metaData.title) metaData.title = firstSchema.name;
                      if (firstSchema.description && !metaData.description) metaData.description = firstSchema.description;
                    }
                  }
                } catch (e) { /* ignore */ }
              }

              const totalFields = 30;
              const filledFields = Object.keys(metaData).filter(key => key !== 'id' && key !== 'domain' && key !== 'timestamp' && key !== 'jsonLd' && metaData[key]).length;
              metaData.completenessScore = Math.round((filledFields / totalFields) * 100);
              metaData.source = 'cors_proxy';
              onMetascraperResults(metaData);
            }
          } catch (e: any) {
            const errorMsg = e?.message?.includes('CORS') ? 'CORS proxy timeout' : (e?.message || 'Failed');
            onMetascraperResults({ id: baseId + 1, domain, timestamp: new Date().toLocaleString(), error: errorMsg });
          }
        })() : Promise.resolve(),
        onVirusTotalResults && enabledModules.virustotal ? (async () => {
          const virusTotalResult = {
            id: baseId + 2,
            domain,
            timestamp: new Date().toLocaleString(),
            reputation: attrs.reputation || 0,
            last_analysis_stats: attrs.last_analysis_stats || {},
            total_votes: attrs.total_votes || {},
            categories: attrs.categories || {},
            popularity_ranks: attrs.popularity_ranks || {},
            whois: attrs.whois || null,
            whois_date: attrs.whois_date ? new Date(attrs.whois_date * 1000).toLocaleString() : null,
            creation_date: attrs.creation_date ? new Date(attrs.creation_date * 1000).toLocaleString() : null,
            last_update_date: attrs.last_update_date ? new Date(attrs.last_update_date * 1000).toLocaleString() : null,
            last_modification_date: attrs.last_modification_date ? new Date(attrs.last_modification_date * 1000).toLocaleString() : null,
            last_analysis_date: attrs.last_analysis_date ? new Date(attrs.last_analysis_date * 1000).toLocaleString() : null,
            last_dns_records: attrs.last_dns_records || [],
            last_dns_records_date: attrs.last_dns_records_date ? new Date(attrs.last_dns_records_date * 1000).toLocaleString() : null,
            last_https_certificate: attrs.last_https_certificate || null,
            last_https_certificate_date: attrs.last_https_certificate_date ? new Date(attrs.last_https_certificate_date * 1000).toLocaleString() : null,
            tags: attrs.tags || [],
            registrar: attrs.registrar || null,
            jarm: attrs.jarm || null,
            resolutions: resolutions,
            last_analysis_results: attrs.last_analysis_results || {},
            malicious_score: attrs.last_analysis_stats?.malicious || 0,
            suspicious_score: attrs.last_analysis_stats?.suspicious || 0,
            harmless_score: attrs.last_analysis_stats?.harmless || 0,
            undetected_score: attrs.last_analysis_stats?.undetected || 0,
            risk_level: (() => {
              const malicious = attrs.last_analysis_stats?.malicious || 0;
              const suspicious = attrs.last_analysis_stats?.suspicious || 0;
              if (malicious > 5) return 'High';
              if (malicious > 0 || suspicious > 3) return 'Medium';
              if (suspicious > 0) return 'Low';
              return 'Clean';
            })()
          };
          onVirusTotalResults(virusTotalResult);
        })() : Promise.resolve(),
        onSubdomainResults && enabledModules.subdomains ? (async () => {
          try {
            const subRes = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/subdomain?domain=${encodeURIComponent(domain)}`, 20000);
            if (subRes.ok) {
              const subData = await subRes.json();
              onSubdomainResults({ ...subData, domain });
            } else {
              onSubdomainResults({ error: 'Failed to fetch subdomains', domain });
            }
          } catch (e) {
            onSubdomainResults({ error: 'Subdomain scan timed out or failed', domain });
          }
        })() : Promise.resolve(),
        // NEW OSINT MODULES
        onExtendedDNSResults && enabledModules.extendedDns ? (async () => {
          try {
            const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/dns-extended?domain=${encodeURIComponent(domain)}`, 15000);
            if (res.ok) {
              const data = await res.json();
              onExtendedDNSResults({ ...data, domain });
            }
          } catch (e) { console.warn('Extended DNS failed:', e); }
        })() : Promise.resolve(),
        onEmailSecurityResults && enabledModules.emailSecurity ? (async () => {
          try {
            const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/email-security?domain=${encodeURIComponent(domain)}`, 15000);
            if (res.ok) {
              const data = await res.json();
              onEmailSecurityResults({ ...data, domain });
            }
          } catch (e) { console.warn('Email Security failed:', e); }
        })() : Promise.resolve(),
        onSSLResults && enabledModules.ssl ? (async () => {
          try {
            const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/ssl-cert?domain=${encodeURIComponent(domain)}`, 20000);
            if (res.ok) {
              const data = await res.json();
              onSSLResults({ ...data, domain });
            }
          } catch (e) { console.warn('SSL Analysis failed:', e); }
        })() : Promise.resolve(),
        onHeadersResults && enabledModules.headers ? (async () => {
          try {
            const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/http-headers?domain=${encodeURIComponent(domain)}`, 15000);
            if (res.ok) {
              const data = await res.json();
              onHeadersResults({ ...data, domain });
            }
          } catch (e) { console.warn('HTTP Headers failed:', e); }
        })() : Promise.resolve(),
        onThreatIntelResults && enabledModules.threatIntel ? (async () => {
          try {
            const [urlScanRes, otxRes] = await Promise.allSettled([
              fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/urlscan-search?domain=${encodeURIComponent(domain)}`, 30000),
              fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/alienvault-otx?domain=${encodeURIComponent(domain)}`, 15000)
            ]);
            const results: any = { domain };
            if (urlScanRes.status === 'fulfilled' && urlScanRes.value.ok) {
              results.urlScan = await urlScanRes.value.json();
            }
            if (otxRes.status === 'fulfilled' && otxRes.value.ok) {
              results.otx = await otxRes.value.json();
            }
            if (Object.keys(results).length > 1) onThreatIntelResults(results); // > 1 because 'domain' is always there
          } catch (e) { console.warn('Threat Intel failed:', e); }
        })() : Promise.resolve(),
        onWaybackResults && enabledModules.wayback ? (async () => {
          try {
            const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/wayback?domain=${encodeURIComponent(domain)}`, 20000);
            if (res.ok) {
              const data = await res.json();
              onWaybackResults({ ...data, domain });
            }
          } catch (e) { console.warn('Wayback failed:', e); }
        })() : Promise.resolve()
      ]);
    } catch (error: any) {
      toast({
        title: `Scan failed for ${rawDomain}`,
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setDomains(content);
      };
      reader.readAsText(file);
    }
  };

  const handleBulkScan = async () => {
    const domainList = domains.trim().split('\n').filter(d => d.trim());

    if (domainList.length === 0) {
      toast({
        title: "No Domains Found",
        description: "Please enter domains or upload a file",
        variant: "destructive",
      });
      return;
    }

    // Notify parent that scan is starting
    if (onStartScan) onStartScan();

    setIsScanning(true);
    setScanProgress(0);

    let completed = 0;
    // Process domains in parallel batches
    // Process domains sequentially with delay
    for (let i = 0; i < domainList.length; i += BATCH_SIZE) {
      const batch = domainList.slice(i, i + BATCH_SIZE);

      // Update status to show we are waiting if this isn't the first batch
      if (i > 0) {
        // Wait 5 seconds between requests (optimized for 3 keys * 4 req/min = 12 req/min)
        const DELAY_MS = 5000;

        // Show countdown
        for (let t = 5; t > 0; t--) {
          // Update a temporary status state if we had one, or just rely on the progress bar stalling
          // For now we'll just wait
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      await Promise.allSettled(
        batch.map((domain, batchIndex) => scanSingleDomain(domain.trim(), i + batchIndex))
      );
      completed += batch.length;
      setScanProgress((completed / domainList.length) * 100);
    }

    setIsScanning(false);
    toast({
      title: "Bulk Scan Complete",
      description: `Successfully scanned ${domainList.length} domains`,
    });
  };

  return (
    <Card className="h-fit border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
      <CardHeader className="bg-gradient-to-r from-blue-600/10 to-red-600/10 border-b border-blue-200/50 dark:border-red-800/50">
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-red-600 rounded-lg">
            <Database className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">Bulk Domain Scanner</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="space-y-3">
          <Label htmlFor="file-upload" className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload Domain List (.txt)</Label>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="w-full border-blue-200 dark:border-red-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-red-50 dark:hover:from-blue-950/50 dark:hover:to-red-950/50 transition-all duration-300" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </label>
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="domains-text" className="text-sm font-medium text-slate-700 dark:text-slate-300">Or paste domains (one per line)</Label>
          <textarea
            id="domains-text"
            className="w-full h-32 px-3 py-2 text-sm border border-blue-200 dark:border-red-800 bg-background rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-red-500/20 focus:border-blue-500 dark:focus:border-red-500 transition-all duration-300"
            placeholder={`google.com\ngithub.com\nexample.com`}
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
          />
        </div>

        {/* Module Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Modules to Scan</Label>
            <button
              type="button"
              onClick={() => {
                const allChecked = Object.values(enabledModules).every(v => v);
                const newState = !allChecked;
                setEnabledModules({
                  core: newState,
                  security: newState,
                  subdomains: newState,
                  virustotal: newState,
                  metadata: newState,
                  extendedDns: newState,
                  emailSecurity: newState,
                  ssl: newState,
                  headers: newState,
                  threatIntel: newState,
                  wayback: newState,
                });
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {Object.values(enabledModules).every(v => v) ? 'Uncheck All' : 'Check All'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.core}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, core: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Core Analysis</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.security}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, security: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Security Intel</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.subdomains}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, subdomains: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Subdomains</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.virustotal}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, virustotal: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">VirusTotal</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.metadata}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, metadata: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Metadata</span>
            </label>
            {/* New OSINT Modules */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.extendedDns}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, extendedDns: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Extended DNS</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.emailSecurity}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, emailSecurity: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Email Security</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.ssl}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, ssl: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">SSL Analysis</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.headers}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, headers: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">HTTP Headers</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.threatIntel}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, threatIntel: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Threat Intel</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.wayback}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, wayback: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Wayback Machine</span>
            </label>
          </div>
        </div>

        {isScanning && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span className="bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">Scanning progress...</span>
              <span className="bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">{Math.round(scanProgress)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-red-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleBulkScan}
          disabled={isScanning}
          className="w-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning {Math.round(scanProgress)}%
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Start Bulk Scan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BulkScannerCard;
