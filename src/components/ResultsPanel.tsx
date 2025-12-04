import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Shield, Globe, Database, AlertTriangle, Calendar, Clock, Building2, Server, MapPin, Wifi, Search, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface Result {
  id: number;
  domain: string;
  created: string;
  expires: string;
  domain_age: string;
  registrar: string;
  name_servers: string[];
  dns_records?: string;
  passive_dns?: string;
  asn?: string;
  abuse_score: number;
  is_vpn_proxy: boolean;
  ip_address: string;
  country: string;
  region?: string;
  city?: string;
  longitude?: string;
  latitude?: string;
  isp: string;
  timestamp: string;
  // Optional OSINT data attached for CSV export
  extendedDNS?: any;
  emailSecurity?: any;
  sslResults?: any;
  headersResults?: any;
  threatIntel?: any;
  waybackResults?: any;
}

interface VtSummary {
  reputation?: number;
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  risk_level?: string;
}

interface ResultsPanelProps {
  results: Result[];
  vtSummaryByDomain?: Record<string, VtSummary>;
  // New OSINT data
  extendedDNS?: any;
  emailSecurity?: any;
  sslResults?: any;
  headersResults?: any;
  waybackResults?: any;
}

const ResultsPanel = ({
  results,
  vtSummaryByDomain,
  extendedDNS,
  emailSecurity,
  sslResults,
  headersResults,
  waybackResults
}: ResultsPanelProps) => {
  const { toast } = useToast();

  const exportToCsv = () => {
    if (results.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please run some scans first",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      // Domain Information
      "Domain",
      "Domain Age",
      "Created Date",
      "Expires Date",
      "Registrar",
      // Network Information
      "IP Address",
      "Name Servers",
      "DNS Records",
      "Passive DNS",
      // Extended DNS
      "MX Records",
      "TXT Records",
      "AAAA (IPv6)",
      // Geolocation
      "Country",
      "Region",
      "City",
      "Latitude",
      "Longitude",
      "ISP",
      // Email Security
      "SPF Status",
      "DKIM Status",
      "DMARC Status",
      // SSL Certificate
      "SSL Valid",
      "SSL Issuer",
      "SSL Expires",
      "SSL Grade",
      // HTTP Security Headers
      "HSTS",
      "X-Frame-Options",
      "Content-Security-Policy",
      "X-XSS-Protection",
      // Security Intelligence
      "VPN/Proxy Detected",
      "Abuse Score",
      "VT Reputation",
      "VT Malicious Count",
      "VT Risk Level",
      // Metadata
      "Scan Timestamp"
    ];

    const escapeCsv = (val: any) => {
      const s = val === null || val === undefined ? '' : String(val);
      // Quote fields that contain commas, semicolons, quotes, newlines, or start with special characters
      if (/[",;\n\r]/.test(s) || s.startsWith(' ') || s.endsWith(' ')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    // Helper to extract DNS records
    const getDnsRecords = (row: Result, type: string) => {
      const data = row.extendedDNS || extendedDNS;
      if (!data?.records) return "-";
      const records = data.records[type];
      if (!records || (Array.isArray(records) && records.length === 0)) return "-";
      if (Array.isArray(records)) {
        return records.map((r: any) => {
          if (typeof r === 'string') return r;
          if (type === 'MX' && r.exchange) return `${r.exchange} (${r.priority})`;
          return JSON.stringify(r);
        }).join("; ");
      }
      return JSON.stringify(records);
    };

    // Email security helpers
    const getEmailStatus = (row: Result, type: string) => {
      const data = row.emailSecurity || emailSecurity;
      if (!data) return "-";
      const record = data[type];
      if (!record) return "-";
      if (record.exists === false) return "Not configured";
      if (record.valid !== undefined) return record.valid ? "Valid" : "Invalid";
      if (record.record) return "Configured";
      return "-";
    };

    // SSL helpers
    const getSslData = (row: Result, field: string) => {
      const data = row.sslResults || sslResults;
      if (!data || data.error) return "-";
      const cert = data.certificate || {};
      const validity = data.validity || {};
      switch (field) {
        case 'valid': return validity.isValid ? "Yes" : "No";
        case 'issuer': return cert.issuer?.O || cert.issuer?.CN || "-";
        case 'expires': return cert.validTo ? new Date(cert.validTo).toLocaleDateString() : "-";
        case 'grade': return data.grade || "-";
        default: return "-";
      }
    };

    // Headers helpers
    const getHeader = (row: Result, header: string) => {
      const data = row.headersResults || headersResults;
      if (!data?.headers) return "-";
      return data.headers[header] ? "Present" : "Missing";
    };

    // Wayback count
    const getWaybackCount = (row: Result) => {
      const data = row.waybackResults || waybackResults;
      if (!data?.snapshots) return "-";
      return data.snapshots.length || 0;
    };

    const csvContent = [
      headers.join(","),
      ...results.map(result => {
        const vt = vtSummaryByDomain ? vtSummaryByDomain[result.domain] : undefined;
        const vt_rep = vt?.reputation ?? "-";
        const vt_mal = vt?.malicious ?? "-";
        const vt_risk = vt?.risk_level ?? "-";

        return [
          // Domain Information
          escapeCsv(result.domain),
          escapeCsv(result.domain_age),
          escapeCsv(result.created),
          escapeCsv(result.expires),
          escapeCsv(result.registrar),
          // Network Information
          escapeCsv(result.ip_address),
          escapeCsv((result.name_servers || []).join("; ")),
          escapeCsv(result.dns_records || "-"),
          escapeCsv(result.passive_dns || "-"),
          // Extended DNS
          escapeCsv(getDnsRecords(result, 'MX')),
          escapeCsv(getDnsRecords(result, 'TXT')),
          escapeCsv(getDnsRecords(result, 'AAAA')),
          // Geolocation
          escapeCsv(result.country),
          escapeCsv(result.region || "-"),
          escapeCsv(result.city || "-"),
          escapeCsv(result.latitude || "-"),
          escapeCsv(result.longitude || "-"),
          escapeCsv(result.isp),
          // Email Security
          escapeCsv(getEmailStatus(result, 'spf')),
          escapeCsv(getEmailStatus(result, 'dkim')),
          escapeCsv(getEmailStatus(result, 'dmarc')),
          // SSL Certificate
          escapeCsv(getSslData(result, 'valid')),
          escapeCsv(getSslData(result, 'issuer')),
          escapeCsv(getSslData(result, 'expires')),
          escapeCsv(getSslData(result, 'grade')),
          // HTTP Security Headers
          escapeCsv(getHeader(result, 'Strict-Transport-Security')),
          escapeCsv(getHeader(result, 'X-Frame-Options')),
          escapeCsv(getHeader(result, 'Content-Security-Policy')),
          escapeCsv(getHeader(result, 'X-XSS-Protection')),
          // Security Intelligence
          escapeCsv(result.is_vpn_proxy),
          escapeCsv(result.abuse_score),
          escapeCsv(vt_rep),
          escapeCsv(vt_mal),
          escapeCsv(vt_risk),
          // Metadata
          escapeCsv(result.timestamp)
        ].join(",");
      })

    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `domain_intelligence_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);

    toast({
      title: "Export Complete",
      description: `Exported ${results.length} results to CSV with OSINT data`,
    });
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return "bg-gradient-to-r from-red-500 to-red-600";
    if (score >= 50) return "bg-gradient-to-r from-red-400 to-orange-500";
    if (score >= 25) return "bg-gradient-to-r from-yellow-400 to-orange-400";
    return "bg-gradient-to-r from-emerald-400 to-teal-500";
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 75) return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800";
    if (score >= 50) return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800";
    if (score >= 25) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  };

  return (
    <Card className="h-fit border-0 shadow-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
      <CardHeader className="bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-cyan-600/10 border-b border-slate-200/50 dark:border-zinc-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Scan Results
            </span>
            <Badge className="bg-white/50 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 backdrop-blur-sm shadow-sm">
              {results.length} Found
            </Badge>
          </CardTitle>
          {results.length > 0 && (
            <Button
              onClick={exportToCsv}
              size="sm"
              className="bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm hover:shadow transition-all duration-300"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-zinc-900/50">
        {results.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-zinc-800 dark:to-zinc-800/50 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center shadow-inner">
              <Search className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-300 dark:text-zinc-600" />
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-2">No results found</p>
            <p className="text-slate-500 dark:text-zinc-400">Try scanning a different domain</p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div
                key={result.id}
                className="group relative overflow-hidden border border-slate-200 dark:border-zinc-800 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-900 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:scale-[1.01] animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Header Section */}
                <div className="relative p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors ring-1 ring-emerald-100 dark:ring-emerald-800">
                      <Globe className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white break-all tracking-tight">
                        {result.domain || result.ip_address}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-zinc-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Scanned {result.timestamp}</span>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Risk Badge */}
                  {result.abuse_score !== undefined && (
                    <div className={`px-4 py-2 rounded-xl border ${getRiskBadgeColor(result.abuse_score)} shadow-sm flex items-center gap-2`}>
                      <div className={`w-2 h-2 rounded-full ${getRiskColor(result.abuse_score)} animate-pulse`} />
                      <span className="font-bold text-slate-700 dark:text-slate-200">Score: {result.abuse_score}</span>
                    </div>
                  )}
                </div>

                {/* Content Grid */}
                <div className="relative p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-800/30 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700">
                      <Server className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">IP Address</p>
                        <p className="font-mono text-sm font-semibold text-slate-700 dark:text-zinc-200 mt-0.5">{result.ip_address || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-800/30 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700">
                      <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Location</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {result.country !== '-' && (
                            <img
                              src={`https://flagcdn.com/w20/${result.country.toLowerCase()}.png`}
                              alt={result.country}
                              className="w-5 h-auto rounded-sm shadow-sm"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          )}
                          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                            {[result.city, result.region, result.country].filter(x => x && x !== '-').join(', ') || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-800/30 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700">
                      <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Created Date</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 mt-0.5">{result.created || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-800/30 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700">
                      <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Domain Age</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 mt-0.5">{result.domain_age || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-800/30 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700">
                      <Building className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Registrar</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 mt-0.5 truncate max-w-[200px]" title={result.registrar}>
                          {result.registrar || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-800/30 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700">
                      <Wifi className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">ISP</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 mt-0.5 truncate max-w-[200px]" title={result.isp}>
                          {result.isp || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultsPanel;
