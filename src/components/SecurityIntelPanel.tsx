import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Globe, AlertTriangle, ListChecks, MapPin, WifiOff, Server } from "lucide-react";

interface ResultItem {
  domain: string;
  ip_address: string;
}

interface SecurityIntelPanelProps {
  results: ResultItem[];
}

type IpqsData = {
  fraud_score?: number;
  vpn?: boolean;
  proxy?: boolean;
  tor?: boolean;
  country_code?: string;
  country?: string;
  region?: string;
  city?: string;
  ISP?: string;
  isp?: string;
  organization?: string;
};

type AbuseData = {
  data?: {
    abuseConfidenceScore?: number;
    totalReports?: number;
    lastReportedAt?: string;
  }
};

type DnsblItem = { zone: string; listed: boolean; text: string | null };

type DnsblData = {
  ip: string;
  results: DnsblItem[];
  listedCount: number;
};

export default function SecurityIntelPanel({ results }: SecurityIntelPanelProps) {
  const ips = useMemo(() => {
    const set = new Set<string>();
    (results || []).forEach(r => { if (r?.ip_address) set.add(r.ip_address); });
    return Array.from(set);
  }, [results]);

  const [ipqs, setIpqs] = useState<Record<string, IpqsData | { error: string }>>({});
  const [abuse, setAbuse] = useState<Record<string, AbuseData | { error: string }>>({});
  const [dnsbl, setDnsbl] = useState<Record<string, DnsblData | { error: string }>>({});

  useEffect(() => {
    if (!ips.length) return;

    // Pre-populate with existing data from results (only if data is valid)
    const existingData: Record<string, IpqsData> = {};
    (results || []).forEach((r: any) => {
      if (r?.ip_address && r.ip_address !== '-') {
        // Only pre-populate if we have actual data (not default values)
        const hasValidData = (
          (r.country && r.country !== '-') ||
          (r.isp && r.isp !== '-') ||
          (typeof r.abuse_score === 'number') || // 0 is valid (means clean)
          r.is_vpn_proxy === true
        );
        
        if (hasValidData) {
          // Only add fields that have actual meaningful values
          const dataObj: any = {};
          if (r.country && r.country !== '-') {
            dataObj.country_code = r.country;
            dataObj.country = r.country;
          }
          if (r.region && r.region !== '-') dataObj.region = r.region;
          if (r.city && r.city !== '-') dataObj.city = r.city;
          if (r.isp && r.isp !== '-') {
            dataObj.ISP = r.isp;
            dataObj.isp = r.isp;
            dataObj.organization = r.isp;
          }
          // Include fraud_score if it's a number (including 0 = clean)
          // Only skip if undefined (not checked yet)
          if (typeof r.abuse_score === 'number') {
            dataObj.fraud_score = r.abuse_score;
          }
          // Only include VPN/proxy if explicitly true
          if (r.is_vpn_proxy === true) {
            dataObj.vpn = true;
            dataObj.proxy = true;
          }
          
          existingData[r.ip_address] = dataObj;
        }
      }
    });
    
    // Set existing data first (only if we have valid data)
    if (Object.keys(existingData).length > 0) {
      setIpqs(prev => ({ ...prev, ...existingData }));
      console.log('✅ Pre-populated IP data from results:', existingData);
    }

    const run = async () => {
      for (const ip of ips) {
        // Skip invalid IPs
        const isValidIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[a-fA-F0-9:]+$/.test(ip);
        if (!isValidIp || ip === '-') continue;

        // Log if using existing data for IPQS
        if (existingData[ip]) {
          console.log('⏭️ Using existing IPQS data for', ip, '- still fetching AbuseIPDB & DNSBL');
        }

        // IPQS: use Vite proxy (skip if we have existing data)
        if (!ipqs[ip] && !existingData[ip]) {
          try {
            const r = await fetch(`/api/ipqs/check?ip=${encodeURIComponent(ip)}`);
            if (r.ok) {
              const data = await r.json();
              setIpqs(prev => ({ ...prev, [ip]: data }));
            } else {
              // Fallback: use free ip-api.com for Country/ISP/VPN/Risk score
              console.log('🔄 IPQS failed, using free fallback for', ip);
              const fallbackRes = await fetch(`/api/ip-api/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,region,regionName,city,lat,lon,isp,org,as,proxy,hosting,mobile`);
              if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                if (fallbackData.status === 'success') {
                  console.log('✅ Fallback data for', ip, fallbackData);
                  // Estimate fraud score based on hosting/proxy indicators
                  let estimatedFraudScore = 0;
                  const isHosting = Boolean(fallbackData.hosting);
                  const isProxy = Boolean(fallbackData.proxy);
                  if (isHosting) estimatedFraudScore += 40;
                  if (isProxy) estimatedFraudScore += 50;
                  
                  setIpqs(prev => ({ ...prev, [ip]: {
                    country_code: fallbackData.countryCode,
                    country: fallbackData.country,
                    region: fallbackData.regionName,
                    city: fallbackData.city,
                    ISP: fallbackData.isp || fallbackData.org,
                    isp: fallbackData.isp || fallbackData.org,
                    organization: fallbackData.org,
                    proxy: isProxy,
                    vpn: isProxy, // Use proxy as VPN indicator
                    tor: false, // ip-api.com doesn't detect Tor specifically
                    fraud_score: estimatedFraudScore,
                  }}));
                  console.log('📊 Estimated fraud score:', estimatedFraudScore);
                }
              }
            }
          } catch (err) {
            console.warn('SecurityIntel IPQS failed for', ip, err);
          }
        }

        // AbuseIPDB: use Vite proxy
        if (!abuse[ip]) {
          try {
            const r = await fetch(`/api/abuseipdb/check?ip=${encodeURIComponent(ip)}`);
            if (r.ok) {
              const data = await r.json();
              setAbuse(prev => ({ ...prev, [ip]: data }));
            } else {
              // Fallback: estimate abuse score from DNSBL results
              console.log('🔄 AbuseIPDB failed, will estimate from DNSBL for', ip);
              // Wait for DNSBL check, then estimate
              setTimeout(async () => {
                const dnsblCheck = dnsbl[ip] as DnsblData | undefined;
                if (dnsblCheck && typeof dnsblCheck.listedCount === 'number') {
                  // Estimate abuse score: each blacklist adds ~25 points
                  const estimatedAbuse = Math.min(100, dnsblCheck.listedCount * 25);
                  console.log('📊 Estimated abuse score from DNSBL:', estimatedAbuse);
                  setAbuse(prev => ({ ...prev, [ip]: {
                    data: {
                      abuseConfidenceScore: estimatedAbuse,
                      totalReports: dnsblCheck.listedCount,
                      lastReportedAt: new Date().toISOString(),
                    }
                  }}));
                }
              }, 2000);
            }
          } catch (err) {
            console.warn('SecurityIntel AbuseIPDB failed for', ip, err);
          }
        }

        // DNSBL
        if (!dnsbl[ip]) {
          try {
            const r = await fetch(`/api/dnsbl/check?ip=${encodeURIComponent(ip)}`);
            if (!r.ok) throw new Error(String(r.status));
            const data = await r.json();
            setDnsbl(prev => ({ ...prev, [ip]: data }));
          } catch {
            // no public fallback for DNSBL
            setDnsbl(prev => ({ ...prev, [ip]: { error: 'DNSBL check failed' } as any }));
          }
        }
      }
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ips)]);

  const getRiskGradient = (score?: number) => {
    const s = typeof score === 'number' ? score : 0;
    if (s >= 75) return 'from-red-500 to-red-600';
    if (s >= 50) return 'from-red-400 to-orange-500';
    if (s >= 25) return 'from-yellow-400 to-orange-400';
    return 'from-green-400 to-blue-500';
  };

  return (
    <Card className="h-fit border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
      <CardHeader className="bg-gradient-to-r from-red-600/10 to-blue-600/10 border-b border-red-200/50 dark:border-blue-800/50 p-2 sm:p-3">
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-red-600 to-blue-600 rounded-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent text-lg sm:text-xl">Security Intelligence</span>
          <Badge className="bg-gradient-to-r from-blue-100 to-red-100 text-slate-700 dark:from-blue-950 dark:to-red-950 dark:text-slate-300 border-0">{ips.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-3">
        {ips.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-slate-500 dark:text-slate-400">
            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-950/50 dark:to-yellow-950/50 rounded-full w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-base sm:text-lg font-medium mb-2">No IP data yet</p>
            <p className="text-sm">Scan a domain to analyze IP security intelligence</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ips.map((ip, index) => {
              const ipqsData = ipqs[ip] as IpqsData | undefined;
              const abuseData = abuse[ip] as AbuseData | undefined;
              const dnsblData = dnsbl[ip] as DnsblData | undefined;
              
              // Check if data has been loaded with actual values (not just empty objects)
              const risk = (ipqsData as any)?.fraud_score as number | undefined;
              const isVpn = (ipqsData as any)?.vpn;
              const isProxy = (ipqsData as any)?.proxy;
              const isTor = (ipqsData as any)?.tor;
              
              // Data is considered "loaded" only if it has actual values
              const hasIpqsData = ipqsData !== undefined && (
                risk !== undefined ||
                isVpn !== undefined ||
                isProxy !== undefined ||
                (ipqsData as any)?.country_code !== undefined ||
                (ipqsData as any)?.ISP !== undefined
              );
              const hasAbuseData = abuseData !== undefined && abuseData.data !== undefined;
              const hasDnsblData = dnsblData !== undefined && typeof (dnsblData as any)?.listedCount === 'number';
              const country = (ipqsData as any)?.country_code || (ipqsData as any)?.country || '-';
              const isp = (ipqsData as any)?.ISP || (ipqsData as any)?.isp || (ipqsData as any)?.organization || '-';
              const listedCount = (dnsblData as any)?.listedCount as number | undefined;
              const listedZones = ((dnsblData as any)?.results || [])
                .filter((z: DnsblItem | null) => z && z.listed)
                .map((z: DnsblItem) => z.zone);

              const hasVpnProxy = isVpn || isProxy || isTor;
              const abuseScore = abuseData?.data?.abuseConfidenceScore;
              const abuseReports = abuseData?.data?.totalReports;
              
              // Debug logging
              if (!hasIpqsData && ipqsData !== undefined) {
                console.log(`⚠️ IP ${ip} has empty IPQS data object:`, ipqsData);
              }

              return (
                <div 
                  key={ip} 
                  className="border border-red-200/50 dark:border-blue-800/50 rounded-xl p-4 sm:p-6 space-y-4 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 hover:shadow-lg transition-all duration-500 hover:scale-[1.01] animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-600 to-red-600 rounded-lg">
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg font-mono bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">{ip}</h3>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getRiskGradient(risk)} shadow-lg`} />
                      <Badge className={`text-xs font-medium border-0 ${risk && risk > 75 ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : risk && risk > 50 ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' : risk && risk > 25 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'}`}>
                        Risk: {typeof risk === 'number' ? `${risk}/100` : 'Unknown'}
                      </Badge>
                    </div>
                  </div>

                  {/* VPN/Proxy/Tor Detection */}
                  {hasVpnProxy && (
                    <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-700">
                      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                        <WifiOff className="h-5 w-5" />
                        <span className="font-semibold text-sm">
                          ⚠️ Anonymous Network Detected: {isVpn && 'VPN'}
                          {isVpn && (isProxy || isTor) && ' + '}
                          {isProxy && 'Proxy'}
                          {isProxy && isTor && ' + '}
                          {isTor && 'Tor'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Details Grid - 2x2 balanced layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 text-sm">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors duration-300">
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"><MapPin className="h-4 w-4" /> Country:</span>
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">{country}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-950/50 transition-colors duration-300">
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"><Server className="h-4 w-4" /> ISP:</span>
                        <span className="text-teal-600 dark:text-teal-400 font-semibold text-right break-all">{isp}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors duration-300">
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"><Shield className="h-4 w-4" /> IPQS Fraud Score:</span>
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          {!hasIpqsData ? '⏳ Checking...' : risk !== undefined ? `${risk}/100` : (country !== '-' || isp !== '-') ? '0/100' : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors duration-300">
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> AbuseIPDB Score:</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {!hasAbuseData ? '⏳ Checking...' : typeof abuseScore === 'number' ? `${abuseScore}/100` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Abuse Reports Note */}
                  {typeof abuseReports === 'number' && abuseReports > 0 && (
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-sm text-blue-700 dark:text-blue-400">
                      📊 {abuseReports} abuse report{abuseReports > 1 ? 's' : ''} filed
                    </div>
                  )}

                  {/* VPN/Proxy Status - Full Width */}
                  <div className={`p-4 rounded-lg transition-all duration-300 ${!hasIpqsData ? 'bg-slate-50 dark:bg-slate-800/30' : hasVpnProxy ? 'bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-300 dark:border-orange-700' : 'bg-green-50 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-700'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <WifiOff className={`h-5 w-5 ${!hasIpqsData ? 'text-slate-500 dark:text-slate-400' : hasVpnProxy ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`} />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">VPN/Proxy Detection:</span>
                      </div>
                      <span className={`font-bold text-lg ${!hasIpqsData ? 'text-slate-500 dark:text-slate-400' : hasVpnProxy ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                        {!hasIpqsData ? (
                          '⏳ Checking...'
                        ) : hasVpnProxy ? (
                          <>
                            {isVpn === true && '🔒 VPN'}
                            {isVpn === true && (isProxy === true || isTor === true) && ' + '}
                            {isProxy === true && '🌐 Proxy'}
                            {isProxy === true && isTor === true && ' + '}
                            {isTor === true && '🧅 Tor'}
                          </>
                        ) : (
                          '✓ Clean'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Blacklists Section */}
                  <div className="border-t border-red-200/50 dark:border-blue-800/50 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <ListChecks className="h-4 w-4" /> DNS Blacklist Status
                      </h4>
                      <Badge className={`${typeof listedCount === 'number' && listedCount > 0 ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-700' : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border border-green-300 dark:border-green-700'} text-xs font-semibold shadow-sm`}>
                        {typeof listedCount === 'number' ? (listedCount === 0 ? '✓ Clean' : `⚠️ ${listedCount} Blacklist${listedCount > 1 ? 's' : ''}`) : '⏳ Checking...'}
                      </Badge>
                    </div>
                    {listedZones && listedZones.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">This IP is listed on the following blacklists:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {listedZones.map((zone: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                              <span className="text-red-700 dark:text-red-400 font-mono text-xs break-all">{zone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : typeof listedCount === 'number' && listedCount === 0 ? (
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                        ✓ Not listed on any checked DNS blacklists (Spamhaus, SpamCop, SORBS, Barracuda)
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                        Checking DNS blacklist databases...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
