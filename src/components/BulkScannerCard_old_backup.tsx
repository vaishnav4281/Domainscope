
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Database, Upload, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkScannerCardProps {
  onResults: (result: any) => void;
  onMetascraperResults?: (result: any) => void;
  onVirusTotalResults?: (result: any) => void;
}

const BulkScannerCard = ({ onResults, onMetascraperResults, onVirusTotalResults }: BulkScannerCardProps) => {
  const fetchWithTimeout = async (url: string, timeout = 10000) => {
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

  // Helper to process domains in parallel batches
  const BATCH_SIZE = 5; // Process 5 domains concurrently

  // Optimized single domain scan with parallel API calls
  const scanSingleDomain = async (domain: string, index: number) => {
    try {
      // Start all API calls in parallel
      const [vtDataResult, whoisResult] = await Promise.allSettled([
        // VirusTotal
        (async () => {
          try {
            const vtUrl = `/api/vt/domains/${encodeURIComponent(domain)}`;
            let vtResponse = await fetchWithTimeout(vtUrl, 10000);
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
            const whoisRes = await fetch(`/api/whois?domain=${encodeURIComponent(domain)}`);
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
        whoisCreated = whoisData.created || whoisData.creation_date || whoisCreated;
        whoisExpires = whoisData.expires || whoisData.expiry_date || whoisExpires;
        whoisRegistrar = whoisData.registrar || whoisRegistrar;
      }

      // IP intelligence in parallel
      let abuseScore = 0, isVpnProxy = false, locCountry = "-", locRegion = "-", locCity = "-";
      let locLatitude = "-", locLongitude = "-", locIsp = "-";
      const ip = aRecord;
      const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[a-fA-F0-9:]+$/.test(ip);
      
      if (isIp) {
        const [ipqsResult, abuseResult] = await Promise.allSettled([
          fetch(`/api/ipqs/check?ip=${encodeURIComponent(ip)}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/abuseipdb/check?ip=${encodeURIComponent(ip)}`).then(r => r.ok ? r.json() : null)
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

      const dnsRecordsString = lastDns.length > 0 ? lastDns.map((r: any) => `${r.type}: ${r.value}`).join('; ') : '-';
      const result = {
        id: Date.now() + index,
        domain,
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
      };
      onResults(result);

      // Metascraper & VirusTotal results in parallel background
      Promise.allSettled([
        onMetascraperResults ? (async () => {
          try {
            const targetUrl = `https://${domain}`;
            const corsProxies = [
              `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
              `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
              `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
            ];
            // Race proxies in parallel for faster response
            let metascraperResponse: Response | null = null;
            const proxyPromises = corsProxies.map(async (proxyUrl) => {
              try {
                const resp = await fetchWithTimeout(proxyUrl, 5000);
                if (resp.ok) return resp;
                throw new Error('Not OK');
              } catch { throw new Error('Failed'); }
            });
            for (const promise of proxyPromises) {
              try { metascraperResponse = await promise; break; } catch { continue; }
            }
            
            if (!metascraperResponse || !metascraperResponse.ok) {
              throw new Error('All CORS proxies failed');
            }
            const html = await metascraperResponse.text();
            const metaData: any = { id: Date.now() + index + 1, domain, timestamp: new Date().toLocaleString() };
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
            const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
            metaData.title = (ogTitleMatch?.[1] || twitterTitleMatch?.[1] || titleMatch?.[1] || '').trim();
            const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
            const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
            const twitterDescMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i);
            metaData.description = (ogDescMatch?.[1] || twitterDescMatch?.[1] || descMatch?.[1] || '').trim();
            const totalFields = 30;
            const filledFields = Object.keys(metaData).filter(key => key !== 'id' && key !== 'domain' && key !== 'timestamp' && key !== 'jsonLd' && metaData[key]).length;
            metaData.completenessScore = Math.round((filledFields / totalFields) * 100);
            onMetascraperResults(metaData);
          } catch (e: any) {
            onMetascraperResults({ id: Date.now() + index + 1, domain, timestamp: new Date().toLocaleString(), error: e?.message || 'Failed' });
          }
        })() : Promise.resolve(),
        onVirusTotalResults ? (async () => {
          const virusTotalResult = {
            id: Date.now() + index + 2,
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
        })() : Promise.resolve()
      ]);
    } catch (error: any) {
      toast({
        title: `Scan failed for ${domain}`,
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

    setIsScanning(true);
    setScanProgress(0);
    
    let completed = 0;
    // Process domains in parallel batches
    for (let i = 0; i < domainList.length; i += BATCH_SIZE) {
      const batch = domainList.slice(i, i + BATCH_SIZE);
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
    <Card className="h-fit border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]";
        try {
          const vtUrl = `/api/vt/domains/${encodeURIComponent(domain)}`;
          let vtResponse = await fetchWithTimeout(vtUrl, 15000);
          if (!vtResponse.ok) {
            if (
              (vtResponse as any).status === 401 &&
              import.meta.env.DEV &&
              import.meta.env.VITE_VIRUSTOTAL_API_KEY
            ) {
              const direct = await fetch(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain)}`, {
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
          console.warn(`⚠️ VirusTotal fetch failed for ${domain}:`, vtError);
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
          const whoisRes = await fetch(`/api/whois?domain=${encodeURIComponent(domain)}`);
          if (whoisRes.ok) {
            const whoisData = await whoisRes.json();
            const wd = whoisData || {};
            whoisCreated = wd.created || wd.creation_date || whoisCreated;
            whoisExpires = wd.expires || wd.expiry_date || whoisExpires;
            whoisRegistrar = wd.registrar || whoisRegistrar;
          }
        } catch {}

        // IP intelligence (IPQS, AbuseIPDB) via Vite proxy
        let abuseScore = 0;
        let isVpnProxy = false;
        let locCountry = "-";
        let locRegion = "-";
        let locCity = "-";
        let locLatitude = "-";
        let locLongitude = "-";
        let locIsp = "-";
        const ip = aRecord;
        const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[a-fA-F0-9:]+$/.test(ip);
        if (isIp) {
          try {
            const ipqsRes = await fetch(`/api/ipqs/check?ip=${encodeURIComponent(ip)}`);
            if (ipqsRes.ok) {
              const ipqs = await ipqsRes.json();
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
            }
          } catch {}
          try {
            const abuseRes = await fetch(`/api/abuseipdb/check?ip=${encodeURIComponent(ip)}`);
            if (abuseRes.ok) {
              const abuse = await abuseRes.json();
              const score = abuse?.data?.abuseConfidenceScore;
              if (typeof score === 'number') abuseScore = Math.max(abuseScore, score);
            }
          } catch {}
        }

        // Format DNS records for CSV export
        const dnsRecordsString = lastDns.length > 0 
          ? lastDns.map((r: any) => `${r.type}: ${r.value}`).join('; ')
          : '-';

        const result = {
          id: Date.now() + i,
          domain,
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

        // Metascraper (optional)
        if (onMetascraperResults) {
          try {
            const targetUrl = `https://${domain}`;
            const corsProxies = [
              `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
              `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
              `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
            ];
            let metascraperResponse: Response | null = null;
            let lastError: any = null;
            for (const proxyUrl of corsProxies) {
              try {
                metascraperResponse = await fetchWithTimeout(proxyUrl, 8000);
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
            const metaData: any = {
              id: Date.now() + i + 1,
              domain: domain,
              timestamp: new Date().toLocaleString()
            };
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
              } catch (e) { /* ignore parse errors */ }
            }
            const totalFields = 30;
            const filledFields = Object.keys(metaData).filter(key => key !== 'id' && key !== 'domain' && key !== 'timestamp' && key !== 'jsonLd' && metaData[key]).length;
            metaData.completenessScore = Math.round((filledFields / totalFields) * 100);
            onMetascraperResults(metaData);
          } catch (metaError: any) {
            onMetascraperResults({
              id: Date.now() + i + 1,
              domain: domain,
              timestamp: new Date().toLocaleString(),
              error: metaError?.message || 'Failed to fetch metadata'
            });
          }
        }
        // Send VirusTotal detailed data (we already fetched attrs above)
        if (onVirusTotalResults) {
          const data = attrs;
          const virusTotalResult = {
            id: Date.now() + i + 2,
            domain: domain,
            timestamp: new Date().toLocaleString(),
            reputation: data.reputation || 0,
            last_analysis_stats: data.last_analysis_stats || {},
            total_votes: data.total_votes || {},
            categories: data.categories || {},
            popularity_ranks: data.popularity_ranks || {},
            whois: data.whois || null,
            whois_date: data.whois_date ? new Date(data.whois_date * 1000).toLocaleString() : null,
            creation_date: data.creation_date ? new Date(data.creation_date * 1000).toLocaleString() : null,
            last_update_date: data.last_update_date ? new Date(data.last_update_date * 1000).toLocaleString() : null,
            last_modification_date: data.last_modification_date ? new Date(data.last_modification_date * 1000).toLocaleString() : null,
            last_analysis_date: data.last_analysis_date ? new Date(data.last_analysis_date * 1000).toLocaleString() : null,
            last_dns_records: data.last_dns_records || [],
            last_dns_records_date: data.last_dns_records_date ? new Date(data.last_dns_records_date * 1000).toLocaleString() : null,
            last_https_certificate: data.last_https_certificate || null,
            last_https_certificate_date: data.last_https_certificate_date ? new Date(data.last_https_certificate_date * 1000).toLocaleString() : null,
            tags: data.tags || [],
            registrar: data.registrar || null,
            jarm: data.jarm || null,
            last_analysis_results: data.last_analysis_results || {},
            malicious_score: data.last_analysis_stats?.malicious || 0,
            suspicious_score: data.last_analysis_stats?.suspicious || 0,
            harmless_score: data.last_analysis_stats?.harmless || 0,
            undetected_score: data.last_analysis_stats?.undetected || 0,
            risk_level: (() => {
              const malicious = data.last_analysis_stats?.malicious || 0;
              const suspicious = data.last_analysis_stats?.suspicious || 0;
              if (malicious > 5) return 'High';
              if (malicious > 0 || suspicious > 3) return 'Medium';
              if (suspicious > 0) return 'Low';
              return 'Clean';
            })()
          };
          onVirusTotalResults(virusTotalResult);
        }
        // Removed artificial throttling to speed up bulk scanning
      } catch (error: any) {
        toast({
          title: `Scan failed for ${domain}`,
          description: error.message || "Unknown error",
          variant: "destructive",
        });
        if (onMetascraperResults) {
          try {
            const targetUrl = `https://${domain}`;
            const corsProxies = [
              `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
              `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
              `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
            ];
            let metascraperResponse: Response | null = null;
            let lastError: any = null;
            for (const proxyUrl of corsProxies) {
              try {
                metascraperResponse = await fetchWithTimeout(proxyUrl, 8000);
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
            const metaData: any = {
              id: Date.now() + i + 1,
              domain: domain,
              timestamp: new Date().toLocaleString()
            };
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
              const atomUrl = html.match(/<link[^>]*type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/i)[1].trim();
              metaData.atomFeed = atomUrl.startsWith('http') ? atomUrl : `https://${domain}${atomUrl.startsWith('/') ? '' : '/'}${atomUrl}`;
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
              } catch (e) { /* ignore parse errors */ }
            }
            const totalFields = 30;
            const filledFields = Object.keys(metaData).filter(key => key !== 'id' && key !== 'domain' && key !== 'timestamp' && key !== 'jsonLd' && metaData[key]).length;
            metaData.completenessScore = Math.round((filledFields / totalFields) * 100);
            onMetascraperResults(metaData);
          } catch (metaError: any) {
            onMetascraperResults({
              id: Date.now() + i + 1,
              domain: domain,
              timestamp: new Date().toLocaleString(),
              error: metaError?.message || 'Failed to fetch metadata'
            });
          }
        }
      }

      setScanProgress(((i + 1) / domainList.length) * 100);
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
      <CardContent className="space-y-6 p-6">
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
              Scanning ({Math.round(scanProgress)}%)
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
