import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Globe, AlertTriangle, ListChecks, MapPin, WifiOff, CheckCircle, Server } from "lucide-react";
import { API_BASE_URL } from '../config';

interface SecurityIntelPanelProps {
  results: any[];
}

export default function SecurityIntelPanel({ results }: SecurityIntelPanelProps) {
  const [intelData, setIntelData] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchMissingData = async () => {
      const newIntelData: Record<string, any> = { ...intelData };
      let hasUpdates = false;

      for (const result of results) {
        const ip = result.ip_address;
        if (!ip || ip === '-') continue;

        // 1. Use existing data from props if available (Fastest)
        if (result.ipqs_data || result.abuse_data) {
          if (!newIntelData[ip]) {
            newIntelData[ip] = {
              ipqs: result.ipqs_data || null,
              abuse: result.abuse_data || null,
              dnsbl: null // Will fetch if needed, or we can assume clean if not provided
            };
            hasUpdates = true;
          }
          // If we have IPQS data, we might still want DNSBL, but let's prioritize showing what we have
          continue;
        }

        // 2. If already fetched/stored in state, skip
        if (newIntelData[ip]) continue;

        // 3. Fetch missing data
        try {
          // IPQS
          let ipqs = null;
          try {
            const r = await fetch(`${API_BASE_URL}/api/v1/scan/ipqs?ip=${encodeURIComponent(ip)}`);
            if (r.ok) ipqs = await r.json();
          } catch (e) { console.warn('IPQS fetch failed', e); }

          // AbuseIPDB
          let abuse = null;
          try {
            const r = await fetch(`${API_BASE_URL}/api/v1/scan/abuseipdb?ip=${encodeURIComponent(ip)}`);
            if (r.ok) abuse = await r.json();
          } catch (e) { console.warn('AbuseIPDB fetch failed', e); }

          // DNSBL
          let dnsbl = null;
          try {
            const r = await fetch(`${API_BASE_URL}/api/v1/scan/dnsbl?ip=${encodeURIComponent(ip)}`);
            if (r.ok) dnsbl = await r.json();
          } catch (e) { console.warn('DNSBL fetch failed', e); }

          newIntelData[ip] = { ipqs, abuse, dnsbl };
          hasUpdates = true;
        } catch (err) {
          console.error("Error fetching security intel for", ip, err);
        }
      }

      if (hasUpdates) {
        setIntelData(newIntelData);
      }
    };

    fetchMissingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]); // Re-run when results change

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'bg-red-500';
    if (score >= 50) return 'bg-orange-500';
    if (score >= 25) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getRiskTextColor = (score: number) => {
    if (score >= 75) return 'text-red-700 dark:text-red-300';
    if (score >= 50) return 'text-orange-700 dark:text-orange-300';
    if (score >= 25) return 'text-yellow-700 dark:text-yellow-300';
    return 'text-emerald-700 dark:text-emerald-300';
  };

  return (
    <Card className="h-fit border-0 shadow-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
      <CardHeader className="bg-gradient-to-r from-pink-600/10 via-purple-600/10 to-emerald-600/10 border-b border-slate-200/50 dark:border-zinc-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg shadow-pink-500/20 ring-1 ring-white/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Security Intelligence
            </span>
            <Badge className="bg-white/50 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 backdrop-blur-sm shadow-sm">
              {results.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-zinc-900/50">
        {results.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800/50 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center shadow-inner">
              <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-pink-300 dark:text-zinc-600" />
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-2">No security data yet</p>
            <p className="text-slate-500 dark:text-zinc-400">Intelligence data will appear here after domain scan</p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((result, index) => {
              const ip = result.ip_address;
              const data = intelData[ip] || {};
              const ipqs = data.ipqs || result.ipqs_data || {};
              const abuse = data.abuse || result.abuse_data || {};
              const dnsbl = data.dnsbl || {};

              // Calculate Risk Score
              const fraudScore = ipqs.fraud_score || 0;
              const abuseScore = abuse.data?.abuseConfidenceScore || 0;
              const riskScore = Math.max(fraudScore, abuseScore);

              // Threat Indicators
              const isVpn = ipqs.vpn || ipqs.proxy || result.is_vpn_proxy || false;
              const isTor = ipqs.tor || false;
              const isBot = ipqs.bot_status || (riskScore > 75); // Fallback logic if bot_status missing

              // Location & ISP
              const country = ipqs.country_code || ipqs.country || result.country || '-';
              const isp = ipqs.ISP || ipqs.isp || ipqs.organization || result.isp || '-';

              // Blacklists
              const listedCount = dnsbl.listedCount || 0;
              const listedZones = dnsbl.results?.filter((z: any) => z.listed).map((z: any) => z.zone) || [];

              return (
                <div
                  key={index}
                  className="group relative overflow-hidden border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-lg hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 hover:scale-[1.01] animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Header with Risk Score */}
                  <div className="relative p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30 transition-colors ring-1 ring-pink-100 dark:ring-pink-800">
                        <Shield className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white break-all tracking-tight">
                          {result.domain || result.ip_address}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {isVpn ? (
                            <Badge className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800 text-xs shadow-sm animate-pulse">
                              <WifiOff className="h-3 w-3 mr-1" /> VPN/Proxy Detected
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs shadow-sm">
                              <CheckCircle className="h-3 w-3 mr-1" /> Clean Connection
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Risk Score</span>
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-zinc-700">
                          <div className={`w-2.5 h-2.5 rounded-full ${getRiskColor(riskScore)} shadow-[0_0_8px_currentColor]`} />
                          <span className={`text-lg font-bold ${getRiskTextColor(riskScore)}`}>
                            {riskScore}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Intelligence Grid */}
                  <div className="relative p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* IP Information */}
                    <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-100 dark:border-zinc-800/50">
                      <h4 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-3">
                        <Globe className="h-4 w-4 text-blue-500" />
                        IP Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">IP Address</span>
                          <span className="font-mono font-medium text-slate-700 dark:text-zinc-200">{ip || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">ISP</span>
                          <span className="font-medium text-slate-700 dark:text-zinc-200 truncate max-w-[120px]" title={isp}>{isp}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">Location</span>
                          <span className="font-medium text-slate-700 dark:text-zinc-200 flex items-center gap-1.5">
                            {country !== '-' && (
                              <img
                                src={`https://flagcdn.com/w20/${country?.toLowerCase()}.png`}
                                alt={country}
                                className="w-4 h-auto rounded-sm"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            )}
                            {country}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Threat Intelligence */}
                    <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-100 dark:border-zinc-800/50">
                      <h4 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Threat Intel
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">VPN Detected</span>
                          <Badge variant={isVpn ? "destructive" : "outline"} className="text-xs">
                            {isVpn ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">Tor Node</span>
                          <Badge variant={isTor ? "destructive" : "outline"} className="text-xs">
                            {isTor ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-zinc-400">Bot Traffic</span>
                          <Badge variant={isBot ? "destructive" : "outline"} className="text-xs">
                            {isBot ? "High Probability" : "Low Probability"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Blacklist Status */}
                    <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-100 dark:border-zinc-800/50">
                      <h4 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-3">
                        <ListChecks className="h-4 w-4 text-emerald-500" />
                        Blacklists
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                          <span className="text-slate-600 dark:text-zinc-400">DNSBL Status</span>
                          <Badge className={`${listedCount > 0 ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'} text-xs`}>
                            {listedCount > 0 ? `${listedCount} Listed` : 'Clean'}
                          </Badge>
                        </div>
                        {listedZones.length > 0 && (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                            Listed in: {listedZones.slice(0, 3).join(', ')}{listedZones.length > 3 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    </div>
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
