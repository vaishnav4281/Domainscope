
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchThroughCorsProxy } from "@/lib/cors-proxy";

interface DomainAnalysisCardProps {
  onResults: (result: any) => void;
  onMetascraperResults: (result: any) => void;
  onVirusTotalResults: (result: any) => void;
}

const DomainAnalysisCard = ({ onResults, onMetascraperResults, onVirusTotalResults }: DomainAnalysisCardProps) => {
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const fetchWithTimeout = async (url: string, timeout = 6000) => {
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

    // Sanitize domain: remove protocol and trailing slashes
    const sanitizedDomain = domain.trim()
      .replace(/^https?:\/\//, '')  // Remove http:// or https://
      .replace(/\/+$/, '')          // Remove trailing slashes
      .replace(/^www\./, '')
      .split(/[\s\/?#]/)[0]
      .split(':')[0]
      .replace(/\.+$/, '');

    setIsScanning(true);
    
    try {
      // OPTIMIZED: Fetch VirusTotal AND WHOIS in parallel for speed
      const [vtResult, whoisResult] = await Promise.allSettled([
        // VirusTotal
        (async () => {
          try {
            const vtUrl = `/api/vt/domains/${encodeURIComponent(sanitizedDomain)}`;
            let vtResponse = await fetchWithTimeout(vtUrl, 5000);
            if (!vtResponse.ok && vtResponse.status === 401 && import.meta.env.DEV && import.meta.env.VITE_VIRUSTOTAL_API_KEY) {
              const direct = await fetch(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(sanitizedDomain)}`, {
                headers: { 'x-apikey': import.meta.env.VITE_VIRUSTOTAL_API_KEY }
              });
              if (direct.ok) return await direct.json();
            } else if (vtResponse.ok) {
              return await vtResponse.json();
            }
          } catch (e) {
            console.warn('⚠️ VirusTotal fetch failed:', e);
          }
          return null;
        })(),
        // WHOIS
        (async () => {
          try {
            const whoisRes = await fetchWithTimeout(`/api/whois?domain=${encodeURIComponent(sanitizedDomain)}`, 5000);
            if (whoisRes.ok) return await whoisRes.json();
          } catch (e) {
            console.warn('⚠️ WHOIS fetch failed:', e);
          }
          return null;
        })()
      ]);
      
      const vtData: any = vtResult.status === 'fulfilled' ? vtResult.value : null;
      const whoisData: any = whoisResult.status === 'fulfilled' ? whoisResult.value : null;
      const attrs: any = vtData?.data?.attributes || {};

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
      
      if (whoisData) {
        const wd = whoisData || {};
        whoisCreated = wd.created || wd.creation_date || whoisCreated;
        whoisExpires = wd.expires || wd.expiry_date || whoisExpires;
        whoisRegistrar = wd.registrar || whoisRegistrar;
      }

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
      // OPTIMIZED: Run IP intelligence checks in parallel
      if (isIp) {
        console.log('🔍 Checking IP:', ip);
        const [ipqsResult, abuseResult] = await Promise.allSettled([
          fetchWithTimeout(`/api/ipqs/check?ip=${encodeURIComponent(ip)}`, 4000).then(r => r.ok ? r.json() : null),
          fetchWithTimeout(`/api/abuseipdb/check?ip=${encodeURIComponent(ip)}`, 4000).then(r => r.ok ? r.json() : null)
        ]);
        
        const ipqs = ipqsResult.status === 'fulfilled' ? ipqsResult.value : null;
        const abuse = abuseResult.status === 'fulfilled' ? abuseResult.value : null;
        
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
      }

      // Format DNS records for CSV export
      const dnsRecordsString = lastDns.length > 0 
        ? lastDns.map((r: any) => `${r.type}: ${r.value}`).join('; ')
        : '-';

      const result = {
        id: Date.now(),
        domain: sanitizedDomain,
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
        domain: sanitizedDomain,
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
      
      // Kick off Metascraper in background (non-blocking) with parallel CORS proxy
      void (async () => {
        try {
          const targetUrl = `https://${sanitizedDomain}`;
          const metascraperResponse = await fetchThroughCorsProxy(targetUrl, { timeout: 5000, parallelAttempts: 3 });
          const html = await metascraperResponse.text();
          const metaData: any = { id: Date.now() + 1, domain: sanitizedDomain, timestamp: new Date().toLocaleString() };
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
            metaData.favicon = faviconUrl.startsWith('http') ? faviconUrl : `https://${sanitizedDomain}${faviconUrl.startsWith('/') ? '' : '/'}${faviconUrl}`;
          }
          const appleTouchMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
          if (appleTouchMatch) {
            const appleUrl = appleTouchMatch[1].trim();
            metaData.logo = appleUrl.startsWith('http') ? appleUrl : `https://${sanitizedDomain}${appleUrl.startsWith('/') ? '' : '/'}${appleUrl}`;
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
            metaData.rssFeed = rssUrl.startsWith('http') ? rssUrl : `https://${sanitizedDomain}${rssUrl.startsWith('/') ? '' : '/'}${rssUrl}`;
          }
          const atomFeedMatch = html.match(/<link[^>]*type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/i);
          if (atomFeedMatch) {
            const atomUrl = atomFeedMatch[1].trim();
            metaData.atomFeed = atomUrl.startsWith('http') ? atomUrl : `https://${sanitizedDomain}${atomUrl.startsWith('/') ? '' : '/'}${atomUrl}`;
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
          onMetascraperResults({ id: Date.now() + 1, domain: sanitizedDomain, timestamp: new Date().toLocaleString(), error: errorMessage });
        }
      })();
      
      // Removed background VT fetch (we already fetched it above)
      setIsScanning(false);
      setDomain("");

      toast({
        title: "Scan Complete",
        description: `Successfully analyzed ${sanitizedDomain}`,
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
          const targetUrl = `https://${sanitizedDomain}`;
          const metascraperResponse = await fetchThroughCorsProxy(targetUrl, { timeout: 5000, parallelAttempts: 3 });
          const html = await metascraperResponse.text();
          const metaData: any = { id: Date.now() + 1, domain: sanitizedDomain, timestamp: new Date().toLocaleString() };
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
            metaData.favicon = faviconUrl.startsWith('http') ? faviconUrl : `https://${sanitizedDomain}${faviconUrl.startsWith('/') ? '' : '/'}${faviconUrl}`;
          }
          const appleTouchMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
          if (appleTouchMatch) {
            const appleUrl = appleTouchMatch[1].trim();
            metaData.logo = appleUrl.startsWith('http') ? appleUrl : `https://${sanitizedDomain}${appleUrl.startsWith('/') ? '' : '/'}${appleUrl}`;
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
            metaData.rssFeed = rssUrl.startsWith('http') ? rssUrl : `https://${sanitizedDomain}${rssUrl.startsWith('/') ? '' : '/'}${rssUrl}`;
          }
          const atomFeedMatch = html.match(/<link[^>]*type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/i);
          if (atomFeedMatch) {
            const atomUrl = atomFeedMatch[1].trim();
            metaData.atomFeed = atomUrl.startsWith('http') ? atomUrl : `https://${sanitizedDomain}${atomUrl.startsWith('/') ? '' : '/'}${atomUrl}`;
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
          onMetascraperResults({ id: Date.now() + 1, domain: sanitizedDomain, timestamp: new Date().toLocaleString(), error: errorMessage });
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
