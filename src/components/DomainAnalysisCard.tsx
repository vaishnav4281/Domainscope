import React, { useState, useEffect } from "react";
import { API_BASE_URL } from '../config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchThroughCorsProxy } from "@/lib/cors-proxy";
import { computeAge } from "@/lib/date-utils";


interface DomainAnalysisCardProps {
  onResults: (result: any) => void;
  onMetascraperResults: (result: any) => void;
  onVirusTotalResults: (result: any) => void;
  onSubdomainResults: (result: any) => void;
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

const DomainAnalysisCard = ({
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
}: DomainAnalysisCardProps) => {
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
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

    // Notify parent that scan is starting
    if (onStartScan) onStartScan();

    // Sanitize domain: remove protocol, trailing slashes, and normalize to lowercase
    const sanitizedDomain = domain.trim()
      .toLowerCase()                // Normalize to lowercase
      .replace(/^https?:\/\//, '')  // Remove http:// or https://
      .replace(/\/+$/, '')          // Remove trailing slashes
      .replace(/^www\./, '')
      .split(/[\s\/?#]/)[0]
      .split(':')[0]
      .replace(/\.+$/, '');

    setIsScanning(true);
    setIsCoolingDown(true); // Start cooldown immediately

    // Enforce 15s cooldown
    setTimeout(() => {
      setIsCoolingDown(false);
    }, 15000);

    // --- PROGRESSIVE LOADING STRATEGY (3-STAGE) ---
    // Stage 1: DNS + IP Intelligence (Fastest, ~1-2s) -> Emit Partial
    // Stage 2: WHOIS (Fast, ~2-4s) -> Emit Partial
    // Stage 3: VirusTotal (Slow, ~10-15s) -> Emit Final

    const vtPromise = (async () => {
      try {
        const vtUrl = `${API_BASE_URL}/api/v1/scan/vt?domain=${encodeURIComponent(sanitizedDomain)}`;
        let vtResponse = await fetchWithTimeout(vtUrl, 20000); // Long timeout for VT

        if (!vtResponse.ok && vtResponse.status === 401 && import.meta.env.DEV && import.meta.env.VITE_VIRUSTOTAL_API_KEY) {
          console.warn('⚠️ Backend VT fetch failed (401), trying direct fallback...');
          const vtKey = import.meta.env.VITE_VIRUSTOTAL_API_KEY;
          const [directReport, directResolutions] = await Promise.allSettled([
            fetch(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(sanitizedDomain)}`, {
              headers: { 'x-apikey': vtKey }
            }).then(r => r.json()),
            fetch(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(sanitizedDomain)}/resolutions?limit=10`, {
              headers: { 'x-apikey': vtKey }
            }).then(r => r.json())
          ]);

          const reportData = directReport.status === 'fulfilled' ? directReport.value : {};
          const resolutionsData = directResolutions.status === 'fulfilled' ? directResolutions.value : {};

          if (reportData.data) {
            return {
              ...reportData,
              resolutions: resolutionsData.data || []
            };
          }
        } else if (vtResponse.ok) {
          return await vtResponse.json();
        }
      } catch (e) {
        console.warn('⚠️ VirusTotal fetch failed:', e);
      }
      return null;
    })();

    const whoisPromise = (async () => {
      try {
        const whoisRes = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/whois?domain=${encodeURIComponent(sanitizedDomain)}`, 15000);
        if (whoisRes.ok) return await whoisRes.json();
      } catch (e) {
        console.warn('⚠️ WHOIS fetch failed:', e);
      }
      return null;
    })();

    const dnsPromise = (async () => {
      try {
        const dnsRes = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/dns?domain=${encodeURIComponent(sanitizedDomain)}`, 4000);
        if (dnsRes.ok) return await dnsRes.json();
      } catch (e) {
        console.warn('⚠️ DNS fetch failed:', e);
      }
      return null;
    })();

    // --- STAGE 1: DNS + IP Intelligence ---
    try {
      const dnsData = await dnsPromise;

      // Determine IP from DNS (Fastest)
      let aRecord = "-";
      if (dnsData && dnsData.ip) {
        aRecord = dnsData.ip;
      }

      // IP Intelligence (IPQS, AbuseIPDB) - Depends on IP
      let ipqsData = null;
      let abuseData = null;
      let fallbackIpData = null;

      if (aRecord !== "-" && aRecord) {
        const ip = aRecord;
        const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[a-fA-F0-9:]+$/.test(ip);

        if (isIp) {
          const [ipqsResult, abuseResult] = await Promise.allSettled([
            fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/ipqs?ip=${encodeURIComponent(ip)}`, 10000).then(r => r.ok ? r.json() : null),
            fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/abuseipdb?ip=${encodeURIComponent(ip)}`, 10000).then(r => r.ok ? r.json() : null)
          ]);
          ipqsData = ipqsResult.status === 'fulfilled' ? ipqsResult.value : null;
          abuseData = abuseResult.status === 'fulfilled' ? abuseResult.value : null;

          // Fallback IP-API if needed
          if (!ipqsData?.country_code && !ipqsData?.country) {
            try {
              const fallbackRes = await fetchThroughCorsProxy(`http://ip-api.com/json/${ip}`, { timeout: 3000 });
              if (fallbackRes.ok) fallbackIpData = await fallbackRes.json();
            } catch (e) { /* ignore */ }
          }
        }
      }

      // --- CONSTRUCT STAGE 1 RESULT ---
      let abuseScore = 0;
      let isVpnProxy = false;
      let locCountry = "-";
      let locRegion = "-";
      let locCity = "-";
      let locLatitude = "-";
      let locLongitude = "-";
      let locIsp = "-";

      if (ipqsData) {
        const fraud = typeof ipqsData.fraud_score === 'number' ? ipqsData.fraud_score : 0;
        abuseScore = Math.max(abuseScore, fraud);
        isVpnProxy = Boolean(ipqsData.vpn || ipqsData.proxy || ipqsData.tor);
        locCountry = (ipqsData.country_code || ipqsData.country || locCountry) as string;
        locRegion = (ipqsData.region || locRegion) as string;
        locCity = (ipqsData.city || locCity) as string;
        locLatitude = (ipqsData.latitude !== undefined && ipqsData.latitude !== null) ? String(ipqsData.latitude) : locLatitude;
        locLongitude = (ipqsData.longitude !== undefined && ipqsData.longitude !== null) ? String(ipqsData.longitude) : locLongitude;
        locIsp = (ipqsData.ISP || ipqsData.isp || ipqsData.organization || locIsp) as string;
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

      if (abuseData?.data?.abuseConfidenceScore) {
        abuseScore = Math.max(abuseScore, abuseData.data.abuseConfidenceScore);
      }

      // Format DNS records for CSV export (using backend DNS data if available)
      const dnsRecordsString = dnsData && Array.isArray(dnsData.records)
        ? dnsData.records.map((r: any) => `${r.type}: ${r.value}`).join('; ')
        : '-';

      const stage1Result = {
        id: Date.now(),
        domain: sanitizedDomain,
        created: "Loading...", // WHOIS pending
        expires: "Loading...",
        domain_age: "Loading...",
        registrar: "Loading...",
        name_servers: dnsData?.ns || [],
        dns_records: dnsRecordsString,
        passive_dns: "Loading...", // VT pending
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
        partial: true, // MARK AS PARTIAL
        ipqs_data: ipqsData,
        abuse_data: abuseData,
      } as any;

      // EMIT STAGE 1 (DNS + IP)
      console.log('🚀 Stage 1 (DNS+IP) Ready, emitting...');
      onResults(stage1Result);

      toast({
        title: "Scan Started",
        description: `Analyzing ${sanitizedDomain}...`,
      });

      setDomain(""); // Clear input

      // --- STAGE 2: WHOIS ---
      const whoisData = await whoisPromise;

      let whoisCreated = "-";
      let whoisExpires = "-";
      let whoisRegistrar = "-";

      if (whoisData) {
        whoisCreated = whoisData.created || whoisData.creation_date || "-";
        whoisExpires = whoisData.expires || whoisData.expiry_date || "-";
        whoisRegistrar = whoisData.registrar || "-";
      }



      const stage2Result = {
        ...stage1Result,
        created: whoisCreated,
        expires: whoisExpires,
        domain_age: computeAge(whoisCreated),
        registrar: whoisRegistrar,
        partial: true // STILL PARTIAL (VT pending)
      };

      // EMIT STAGE 2 (WHOIS)
      console.log('🚀 Stage 2 (WHOIS) Ready, emitting...');
      onResults(stage2Result);

      // --- STAGE 3: VirusTotal (Final) ---
      const vtData = await vtPromise;

      if (vtData) {
        console.log('🐢 VirusTotal Data Ready');

        if (vtData.error) {
          console.warn('VT Backend Error:', vtData.error);
          toast({
            title: "VirusTotal Error",
            description: vtData.error,
            variant: "destructive",
          });
        }

        const attrs: any = vtData?.data?.attributes || {};
        const resolutions: any[] = vtData?.resolutions || [];

        // Update Result with VT Data (Passive DNS, better Registrar/Dates if missing)
        const finalResult = { ...stage2Result };

        // Passive DNS
        finalResult.passive_dns = resolutions.length > 0
          ? resolutions.map((r: any) => `${r.attributes.ip_address} (${new Date(r.attributes.date * 1000).toISOString().split('T')[0]})`).join('; ')
          : '-';

        // Fallback for Registrar/Dates if WHOIS failed
        if (finalResult.registrar === "-" && attrs.registrar) finalResult.registrar = attrs.registrar;
        if (finalResult.created === "-" && attrs.creation_date) {
          finalResult.created = new Date(attrs.creation_date * 1000).toLocaleString();
          finalResult.domain_age = computeAge(finalResult.created);
        }

        finalResult.partial = false; // FINAL RESULT

        // Re-emit updated results
        onResults(finalResult);

        // Emit VT Results
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
      } else {
        // If VT failed, we still need to mark as final so history saves
        const finalResult = { ...stage2Result, passive_dns: '-', partial: false };
        onResults(finalResult);
      }

    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Something went wrong while fetching data.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false); // Data fetching done
    }

    // Kick off Metascraper (Independent) with Backend Fallback
    void (async () => {
      try {
        const targetUrl = `https://${sanitizedDomain}`;
        let html: string | null = null;
        let usedBackendFallback = false;

        // Try CORS proxies first
        try {
          const metascraperResponse = await fetchThroughCorsProxy(targetUrl, { timeout: 5000, parallelAttempts: 3 });
          html = await metascraperResponse.text();
          console.log('✅ Metascraper: CORS proxy succeeded');
        } catch (corsError: any) {
          console.warn('⚠️ Metascraper: All CORS proxies failed, trying backend fallback...', corsError.message);

          // Fallback to backend metadata extraction
          try {
            const backendRes = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/metadata?domain=${encodeURIComponent(sanitizedDomain)}`, 15000);
            if (backendRes.ok) {
              const backendData = await backendRes.json();

              // Check if backend returned valid data (not just an error)
              if (!backendData.error) {
                console.log('✅ Metascraper: Backend fallback succeeded');
                usedBackendFallback = true;

                // Convert backend data to frontend format
                const metaData: any = {
                  id: Date.now() + 1,
                  domain: sanitizedDomain,
                  timestamp: new Date().toLocaleString(),
                  ...backendData,
                  source: 'backend' // Mark that this came from backend
                };

                onMetascraperResults(metaData);
                return; // Exit early since we got data from backend
              } else {
                console.warn('⚠️ Metascraper: Backend returned error:', backendData.error);
              }
            }
          } catch (backendErr) {
            console.warn('⚠️ Metascraper: Backend fallback also failed:', backendErr);
          }

          // If both CORS and backend failed, show error
          if (!usedBackendFallback) {
            throw corsError; // Re-throw original CORS error
          }
        }

        // If we got HTML from CORS proxy, parse it
        if (html && !usedBackendFallback) {
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
            metaData.tags = articleTagsMatches.map((tag: string) => {
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
          metaData.source = 'cors_proxy'; // Mark that this came from CORS proxy
          onMetascraperResults(metaData);
        }
      } catch (metaError: any) {
        console.warn('Metascraper error:', metaError);
        const errorMessage = metaError.name === 'AbortError'
          ? 'Request timed out while fetching metadata (try again or website may be slow)'
          : metaError.message || 'Failed to fetch metadata';
        onMetascraperResults({ id: Date.now() + 1, domain: sanitizedDomain, timestamp: new Date().toLocaleString(), error: errorMessage });
      }
    })();


    // Kick off Subdomain Scan (Independent) with retry logic for mobile
    // Only run if subdomains module is enabled
    if (enabledModules.subdomains) {
      void (async () => {
        // Small delay to allow UI to settle and prevent network contention on mobile
        await new Promise(resolve => setTimeout(resolve, 1000));

        const maxRetries = 2;
        let attempt = 0;

        while (attempt <= maxRetries) {
          try {
            attempt++;
            console.log(`[Subdomain] Attempt ${attempt}/${maxRetries + 1}...`);

            // Increased timeout to 90s for mobile networks and slow crt.sh responses
            const subRes = await fetchWithTimeout(
              `${API_BASE_URL}/api/v1/scan/subdomain?domain=${encodeURIComponent(sanitizedDomain)}`,
              90000 // Increased to 90s
            );

            if (subRes.ok) {
              const subData = await subRes.json();
              console.log('[Subdomain] Success:', subData);
              onSubdomainResults(subData);
              toast({
                title: "Subdomain Scan Complete",
                description: `Found ${subData.count || 0} subdomains.`,
              });
              return; // Success, exit retry loop
            } else {
              console.warn(`[Subdomain] Attempt ${attempt} failed with status ${subRes.status}`);

              // If this was the last attempt, show error
              if (attempt > maxRetries) {
                console.error('[Subdomain] All attempts failed.');
                onSubdomainResults({ error: 'Failed to fetch subdomains (API unavailable or timed out)' });
                toast({
                  title: "Subdomain Scan Failed",
                  description: "Could not fetch subdomains. Please try again.",
                  variant: "destructive",
                });
              }
            }
          } catch (e: any) {
            console.warn(`[Subdomain] Attempt ${attempt} error:`, e.message);

            // If this was the last attempt, show error
            if (attempt > maxRetries) {
              const errorMessage = e.name === 'AbortError'
                ? 'Subdomain scan timed out (slow network or crt.sh unavailable)'
                : 'Subdomain scan failed (Network Error)';
              console.error('[Subdomain] Final Error:', errorMessage);
              onSubdomainResults({ error: errorMessage });
              toast({
                title: "Subdomain Scan Failed",
                description: errorMessage,
                variant: "destructive",
              });
            } else {
              // Wait before retrying (exponential backoff: 2s, 4s)
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
          }
        }
      })();
    }

    // --- NEW OSINT MODULES (Run in parallel, conditionally) ---

    // Extended DNS
    if (enabledModules.extendedDns && onExtendedDNSResults) {
      void (async () => {
        try {
          const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/dns-extended?domain=${encodeURIComponent(sanitizedDomain)}`, 15000);
          if (res.ok) {
            const data = await res.json();
            onExtendedDNSResults(data);
          }
        } catch (e) {
          console.warn('Extended DNS fetch failed:', e);
        }
      })();
    }

    // Email Security (SPF, DKIM, DMARC)
    if (enabledModules.emailSecurity && onEmailSecurityResults) {
      void (async () => {
        try {
          const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/email-security?domain=${encodeURIComponent(sanitizedDomain)}`, 15000);
          if (res.ok) {
            const data = await res.json();
            onEmailSecurityResults(data);
          }
        } catch (e) {
          console.warn('Email Security fetch failed:', e);
        }
      })();
    }

    // SSL Analysis
    if (enabledModules.ssl && onSSLResults) {
      void (async () => {
        try {
          const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/ssl-cert?domain=${encodeURIComponent(sanitizedDomain)}`, 20000);
          if (res.ok) {
            const data = await res.json();
            onSSLResults(data);
          }
        } catch (e) {
          console.warn('SSL Analysis fetch failed:', e);
        }
      })();
    }

    // HTTP Security Headers
    if (enabledModules.headers && onHeadersResults) {
      void (async () => {
        try {
          const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/http-headers?domain=${encodeURIComponent(sanitizedDomain)}`, 15000);
          if (res.ok) {
            const data = await res.json();
            onHeadersResults(data);
          }
        } catch (e) {
          console.warn('HTTP Headers fetch failed:', e);
        }
      })();
    }

    // Threat Intelligence (URLScan.io, AlienVault OTX)
    if (enabledModules.threatIntel && onThreatIntelResults) {
      // URLScan.io
      void (async () => {
        try {
          const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/urlscan-search?domain=${encodeURIComponent(sanitizedDomain)}`, 30000);
          if (res.ok) {
            const data = await res.json();
            onThreatIntelResults({ urlScan: data });
          }
        } catch (e) {
          console.warn('URLScan fetch failed:', e);
        }
      })();

      // AlienVault OTX
      void (async () => {
        try {
          const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/alienvault-otx?domain=${encodeURIComponent(sanitizedDomain)}`, 15000);
          if (res.ok) {
            const data = await res.json();
            onThreatIntelResults({ otx: data });
          }
        } catch (e) {
          console.warn('OTX fetch failed:', e);
        }
      })();
    }

    // Wayback Machine
    if (enabledModules.wayback && onWaybackResults) {
      void (async () => {
        try {
          const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/scan/wayback?domain=${encodeURIComponent(sanitizedDomain)}`, 20000);
          if (res.ok) {
            const data = await res.json();
            onWaybackResults(data);
          }
        } catch (e) {
          console.warn('Wayback fetch failed:', e);
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
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="space-y-3">
          <Label htmlFor="domain" className="text-sm font-medium text-slate-700 dark:text-slate-300">Domain Name</Label>
          <Input
            id="domain"
            type="text"
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isScanning && !isCoolingDown && handleScan()}
            className="border-red-200 dark:border-blue-800 focus:border-red-500 dark:focus:border-blue-500 focus:ring-red-500/20 dark:focus:ring-blue-500/20 transition-all duration-300"
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
                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Core Analysis</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledModules.security}
                onChange={(e) => setEnabledModules(prev => ({ ...prev, security: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
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
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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

        <Button
          onClick={handleScan}
          disabled={isScanning || isCoolingDown}
          className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : isCoolingDown ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cooling down...
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
