
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DomainAnalysisCardProps {
  onResults: (result: any) => void;
  onMetascraperResults: (result: any) => void;
  onVirusTotalResults: (result: any) => void;
}

const DomainAnalysisCard = ({ onResults, onMetascraperResults, onVirusTotalResults }: DomainAnalysisCardProps) => {
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const fetchWithTimeout = async (url: string, timeout = 8000) => {
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

  const handleScan = async () => {
    if (!domain.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid domain name",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    
    try {
      // Fetch VirusTotal data (non-blocking, continue even if it fails)
      let vtData: any = null;
      let attrs: any = {};
      try {
        const vtUrl = `/api/vt/domains/${encodeURIComponent(domain.trim())}`;
        let vtResponse = await fetch(vtUrl);
        if (!vtResponse.ok) {
          // Dev-only fallback: call VT directly if proxy didn't inject the key
          if (
            vtResponse.status === 401 &&
            import.meta.env.DEV &&
            import.meta.env.VITE_VIRUSTOTAL_API_KEY
          ) {
            const direct = await fetch(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain.trim())}`, {
              headers: { 'x-apikey': import.meta.env.VITE_VIRUSTOTAL_API_KEY }
            });
            if (direct.ok) {
              vtData = await direct.json();
            }
          }
        } else {
          vtData = await vtResponse.json();
        }
        attrs = vtData?.data?.attributes || {};
      } catch (vtError) {
        console.warn('⚠️ VirusTotal fetch failed:', vtError);
        // Continue with empty VT data
      }

      const creationDateStr = attrs.creation_date ? new Date(attrs.creation_date * 1000).toLocaleString() : "-";
      const lastDns: any[] = Array.isArray(attrs.last_dns_records) ? attrs.last_dns_records : [];
      const nsRecords = lastDns.filter(r => r?.type === 'NS').map(r => r?.value).filter(Boolean);
      const aRecord = (lastDns.find(r => r?.type === 'A')?.value) || (lastDns.find(r => r?.type === 'AAAA')?.value) || "-";

      const computeAge = (created: string) => {
        if (!created || created === '-') return '-';
        const d = new Date(created);
        if (isNaN(d.getTime())) return created;
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        const days = Math.floor((diffDays % 365) % 30);
        const parts = [] as string[];
        if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
        if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
        if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
        return parts.length ? parts.join(" ") : "Less than 1 day";
      };

      let whoisCreated = creationDateStr;
      let whoisExpires = attrs.last_modification_date ? new Date(attrs.last_modification_date * 1000).toLocaleString() : "-";
      let whoisRegistrar = attrs.registrar || "-";
      try {
        const whoisRes = await fetch(`/api/whois?domain=${encodeURIComponent(domain.trim())}`);
        if (whoisRes.ok) {
          const whoisData = await whoisRes.json();
          const wd = whoisData || {};
          whoisCreated = wd.created || wd.creation_date || whoisCreated;
          whoisExpires = wd.expires || wd.expiry_date || whoisExpires;
          whoisRegistrar = wd.registrar || whoisRegistrar;
        }
      } catch {}

      // IP intelligence (IPQS, AbuseIPDB)
      let abuseScore = 0;
      let isVpnProxy = false;
      let locCountry = "-";
      let locRegion = "-";
      let locCity = "-";
      let locLatitude = "-";
      let locLongitude = "-";
      let locIsp = "-";
      const ipqsKey = import.meta.env.VITE_IPQS_API_KEY as string | undefined;
      const abuseKey = import.meta.env.VITE_ABUSEIPDB_API_KEY as string | undefined;
      const ip = aRecord;
      const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[a-fA-F0-9:]+$/.test(ip);
      if (isIp) {
        console.log('🔍 Checking IP:', ip);
        // Use Vite dev proxy to avoid ad blockers and CORS
        try {
          const ipqsUrl = `/api/ipqs/check?ip=${encodeURIComponent(ip)}`;
          console.log('📡 Calling IPQS via proxy...');
          const ipqsRes = await fetch(ipqsUrl);
          console.log('📡 IPQS response status:', ipqsRes.status);
          if (ipqsRes.ok) {
            const ipqs = await ipqsRes.json();
            console.log('✅ IPQS full response:', JSON.stringify(ipqs, null, 2));
            console.log('✅ IPQS extracted data:', JSON.stringify({
              fraud_score: ipqs.fraud_score,
              vpn: ipqs.vpn,
              proxy: ipqs.proxy,
              tor: ipqs.tor,
              country_code: ipqs.country_code,
              region: ipqs.region,
              city: ipqs.city,
              latitude: ipqs.latitude,
              longitude: ipqs.longitude,
              ISP: ipqs.ISP
            }, null, 2));
            const fraud = typeof ipqs.fraud_score === 'number' ? ipqs.fraud_score : 0;
            abuseScore = Math.max(abuseScore, fraud);
            const vpn = Boolean(ipqs.vpn);
            const proxy = Boolean(ipqs.proxy);
            const tor = Boolean(ipqs.tor);
            isVpnProxy = isVpnProxy || vpn || proxy || tor;
            locCountry = (ipqs.country_code || ipqs.country || locCountry) as string;
            locRegion = (ipqs.region || locRegion) as string;
            locCity = (ipqs.city || locCity) as string;
            locLatitude = (ipqs.latitude !== undefined && ipqs.latitude !== null) ? String(ipqs.latitude) : locLatitude;
            locLongitude = (ipqs.longitude !== undefined && ipqs.longitude !== null) ? String(ipqs.longitude) : locLongitude;
            locIsp = (ipqs.ISP || ipqs.isp || ipqs.organization || locIsp) as string;
            console.log('✅ After IPQS processing:', JSON.stringify({ locCountry, locRegion, locCity, locIsp, abuseScore, isVpnProxy }, null, 2));
          } else {
            const errorText = await ipqsRes.text();
            console.error('❌ IPQS failed:', ipqsRes.status, errorText.substring(0, 200));
          }
        } catch (err) {
          console.error('❌ IPQS error:', err);
        }

        // No external fallback needed - VirusTotal provides all necessary data

        try {
          const abuseUrl = `/api/abuseipdb/check?ip=${encodeURIComponent(ip)}`;
          const abuseRes = await fetch(abuseUrl);
          if (abuseRes.ok) {
            const abuse = await abuseRes.json();
            const score = abuse?.data?.abuseConfidenceScore;
            if (typeof score === 'number') abuseScore = Math.max(abuseScore, score);
            console.log('✅ AbuseIPDB score:', score);
          } else if (abuseScore === 0) {
            // Fallback: check DNSBL for abuse indicators
            console.log('🔄 AbuseIPDB failed, checking DNSBL for abuse indicators...');
            try {
              const dnsblRes = await fetch(`/api/dnsbl/check?ip=${encodeURIComponent(ip)}`);
              if (dnsblRes.ok) {
                const dnsblData = await dnsblRes.json();
                const listedCount = dnsblData?.listedCount || 0;
                // Estimate abuse score: each blacklist adds ~25 points
                const estimatedAbuse = Math.min(100, listedCount * 25);
                if (estimatedAbuse > 0) {
                  abuseScore = Math.max(abuseScore, estimatedAbuse);
                  console.log('📊 Estimated abuse score from DNSBL:', estimatedAbuse, 'blacklists:', listedCount);
                }
              }
            } catch (dnsblErr) {
              console.warn('⚠️ DNSBL fallback also failed:', dnsblErr);
            }
          }
        } catch (err) {
          console.error('❌ AbuseIPDB error:', err);
        }
      }

      // Format DNS records for CSV export
      const dnsRecordsString = lastDns.length > 0 
        ? lastDns.map((r: any) => `${r.type}: ${r.value}`).join('; ')
        : '-';

      const result = {
        id: Date.now(),
        domain: domain.trim(),
        created: whoisCreated,
        expires: whoisExpires,
        domain_age: whoisCreated !== "-" ? computeAge(whoisCreated) : "-",
        registrar: whoisRegistrar,
        name_servers: nsRecords,
        dns_records: dnsRecordsString,
        abuse_score: abuseScore,
        is_vpn_proxy: isVpnProxy,
        ip_address: aRecord,
        country: locCountry,
        region: locRegion,
        city: locCity,
        longitude: locLongitude,
        latitude: locLatitude,
        isp: locIsp,
        timestamp: new Date().toLocaleString(),
      } as any;

      onResults(result);

      // Send full VirusTotal result
      const virusTotalResult = {
        id: Date.now() + 2,
        domain: domain.trim(),
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
      
      // Kick off Metascraper in background (non-blocking)
      void (async () => {
        try {
          const targetUrl = `https://${domain.trim()}`;
          const corsProxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
          ];
          let metascraperResponse: Response | null = null;
          let lastError: any = null;
          for (const proxyUrl of corsProxies) {
            try {
              metascraperResponse = await fetchWithTimeout(proxyUrl, 3000);
              if (metascraperResponse.ok) break;
            } catch (err) {
              lastError = err;
              continue;
            }
          }
          if (!metascraperResponse || !metascraperResponse.ok) {
            throw lastError || new Error('All CORS proxies failed');
          }
          const html = await metascraperResponse.text();
          const metaData: any = { id: Date.now() + 1, domain: domain.trim(), timestamp: new Date().toLocaleString() };
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
            metaData.tags = articleTagsMatches.map(tag => {
              const match = tag.match(/content=["']([^"']+)["']/i);
              return match ? match[1] : '';
            }).filter(Boolean).join(', ');
          }
          const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
          if (faviconMatch) {
            const faviconUrl = faviconMatch[1].trim();
            metaData.favicon = faviconUrl.startsWith('http') ? faviconUrl : `https://${domain.trim()}${faviconUrl.startsWith('/') ? '' : '/'}${faviconUrl}`;
          }
          const appleTouchMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
          if (appleTouchMatch) {
            const appleUrl = appleTouchMatch[1].trim();
            metaData.logo = appleUrl.startsWith('http') ? appleUrl : `https://${domain.trim()}${appleUrl.startsWith('/') ? '' : '/'}${appleUrl}`;
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
            metaData.rssFeed = rssUrl.startsWith('http') ? rssUrl : `https://${domain.trim()}${rssUrl.startsWith('/') ? '' : '/'}${rssUrl}`;
          }
          const atomFeedMatch = html.match(/<link[^>]*type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/i);
          if (atomFeedMatch) {
            const atomUrl = atomFeedMatch[1].trim();
            metaData.atomFeed = atomUrl.startsWith('http') ? atomUrl : `https://${domain.trim()}${atomUrl.startsWith('/') ? '' : '/'}${atomUrl}`;
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
          onMetascraperResults(metaData);
        } catch (metaError: any) {
          const errorMessage = metaError.name === 'AbortError'
            ? 'Request timed out while fetching metadata (try again or website may be slow)'
            : metaError.message || 'Failed to fetch metadata';
          onMetascraperResults({ id: Date.now() + 1, domain: domain.trim(), timestamp: new Date().toLocaleString(), error: errorMessage });
        }
      })();
      
      // Removed background VT fetch (we already fetched it above)
      setIsScanning(false);
      setDomain("");

      toast({
        title: "Scan Complete",
        description: `Successfully analyzed ${domain.trim()}`,
      });
    } catch (error: any) {
      setIsScanning(false);
      toast({
        title: "Scan Failed",
        description: error.message || "Something went wrong while fetching data.",
        variant: "destructive",
      });
      // Still try to fetch Metascraper even if VT fails
      void (async () => {
        try {
          const targetUrl = `https://${domain.trim()}`;
          const corsProxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
          ];
          let metascraperResponse: Response | null = null;
          let lastError: any = null;
          for (const proxyUrl of corsProxies) {
            try {
              metascraperResponse = await fetchWithTimeout(proxyUrl, 3000);
              if (metascraperResponse.ok) break;
            } catch (err) {
              lastError = err;
              continue;
            }
          }
          if (!metascraperResponse || !metascraperResponse.ok) {
            throw lastError || new Error('All CORS proxies failed');
          }
          const html = await metascraperResponse.text();
          const metaData: any = { id: Date.now() + 1, domain: domain.trim(), timestamp: new Date().toLocaleString() };
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
            metaData.tags = articleTagsMatches.map(tag => {
              const match = tag.match(/content=["']([^"']+)["']/i);
              return match ? match[1] : '';
            }).filter(Boolean).join(', ');
          }
          const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
          if (faviconMatch) {
            const faviconUrl = faviconMatch[1].trim();
            metaData.favicon = faviconUrl.startsWith('http') ? faviconUrl : `https://${domain.trim()}${faviconUrl.startsWith('/') ? '' : '/'}${faviconUrl}`;
          }
          const appleTouchMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
          if (appleTouchMatch) {
            const appleUrl = appleTouchMatch[1].trim();
            metaData.logo = appleUrl.startsWith('http') ? appleUrl : `https://${domain.trim()}${appleUrl.startsWith('/') ? '' : '/'}${appleUrl}`;
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
            metaData.rssFeed = rssUrl.startsWith('http') ? rssUrl : `https://${domain.trim()}${rssUrl.startsWith('/') ? '' : '/'}${rssUrl}`;
          }
          const atomFeedMatch = html.match(/<link[^>]*type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/i);
          if (atomFeedMatch) {
            const atomUrl = atomFeedMatch[1].trim();
            metaData.atomFeed = atomUrl.startsWith('http') ? atomUrl : `https://${domain.trim()}${atomUrl.startsWith('/') ? '' : '/'}${atomUrl}`;
          }
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
          onMetascraperResults(metaData);
        } catch (metaError: any) {
          const errorMessage = metaError.name === 'AbortError'
            ? 'Request timed out while fetching metadata (try again or website may be slow)'
            : metaError.message || 'Failed to fetch metadata';
          onMetascraperResults({ id: Date.now() + 1, domain: domain.trim(), timestamp: new Date().toLocaleString(), error: errorMessage });
        }
      })();
    }
  };

  return (
    <Card className="h-fit border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
      <CardHeader className="bg-gradient-to-r from-red-600/10 to-blue-600/10 border-b border-red-200/50 dark:border-blue-800/50">
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-red-600 to-blue-600 rounded-lg">
            <Search className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">Domain Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-3">
          <Label htmlFor="domain" className="text-sm font-medium text-slate-700 dark:text-slate-300">Domain Name</Label>
          <Input
            id="domain"
            type="text"
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleScan()}
            className="border-red-200 dark:border-blue-800 focus:border-red-500 dark:focus:border-blue-500 focus:ring-red-500/20 dark:focus:ring-blue-500/20 transition-all duration-300"
          />
        </div>

        <Button 
          onClick={handleScan} 
          disabled={isScanning}
          className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Analyze Domain
            </>
          )}
        </Button>

        
      </CardContent>
    </Card>
  );
};

export default DomainAnalysisCard;
