import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, Globe, Server, Lock, FileText, Activity, Award, Calendar, Clock, Tag, Building2 } from "lucide-react";

interface VirusTotalData {
  id: number;
  domain: string;
  timestamp: string;
  reputation?: number;
  last_analysis_stats?: {
    malicious?: number;
    suspicious?: number;
    harmless?: number;
    undetected?: number;
  };
  total_votes?: {
    harmless?: number;
    malicious?: number;
  };
  categories?: { [key: string]: string };
  popularity_ranks?: { [key: string]: any };
  whois?: string;
  whois_date?: string;
  creation_date?: string;
  last_update_date?: string;
  last_modification_date?: string;
  last_analysis_date?: string;
  last_dns_records?: any[];
  last_dns_records_date?: string;
  last_https_certificate?: any;
  last_https_certificate_date?: string;
  tags?: string[];
  registrar?: string;
  jarm?: string;

  resolutions?: any[];
  last_analysis_results?: { [key: string]: any };
  malicious_score?: number;
  suspicious_score?: number;
  harmless_score?: number;
  undetected_score?: number;
  risk_level?: string;
  error?: string;
}

interface VirusTotalResultsProps {
  results: VirusTotalData[];
}

const VirusTotalResults = ({ results }: VirusTotalResultsProps) => {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-orange-500';
      case 'Low': return 'bg-yellow-500';
      case 'Clean': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
      case 'Medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
      case 'Low': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
      case 'Clean': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300';
    }
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
              VirusTotal Security Analysis
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
            <p className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-2">No VirusTotal data yet</p>
            <p className="text-slate-500 dark:text-zinc-400">Security analysis will appear here after domain scan</p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div
                key={result.id}
                className="group relative overflow-hidden border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-lg hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 hover:scale-[1.01] animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Header with Risk Level */}
                <div className="relative p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30 transition-colors ring-1 ring-pink-100 dark:ring-pink-800">
                      <Shield className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white break-all tracking-tight">
                        {result.domain}
                      </h3>
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {result.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs shadow-sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {result.risk_level && (
                      <div className="flex items-center space-x-2 bg-slate-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-zinc-700">
                        <div className={`w-2.5 h-2.5 rounded-full ${getRiskColor(result.risk_level)} shadow-[0_0_8px_currentColor]`} />
                        <Badge className={`text-xs font-medium border-0 ${getRiskBadge(result.risk_level)}`}>
                          Risk: {result.risk_level}
                        </Badge>
                      </div>
                    )}
                    {result.reputation !== undefined && (
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs shadow-sm">
                        Rep: {result.reputation}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {result.error && (
                  <div className="m-5 sm:m-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <strong>Error:</strong> {result.error}
                    </p>
                  </div>
                )}

                {!result.error && (
                  <div className="p-5 sm:p-6">
                    <Tabs defaultValue="security" className="w-full">
                      <TabsList className="w-full h-auto flex flex-wrap justify-start bg-slate-100/50 dark:bg-zinc-800/50 p-1.5 rounded-xl gap-1">
                        <TabsTrigger value="security" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Security</TabsTrigger>
                        <TabsTrigger value="detection" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Detection</TabsTrigger>
                        <TabsTrigger value="reputation" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Reputation</TabsTrigger>
                        <TabsTrigger value="categories" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Categories</TabsTrigger>
                        <TabsTrigger value="dns" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">DNS/SSL</TabsTrigger>
                        <TabsTrigger value="passive-dns" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Passive DNS</TabsTrigger>
                        <TabsTrigger value="info" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Info</TabsTrigger>
                      </TabsList>

                      {/* SECURITY TAB */}
                      <TabsContent value="security" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Analysis Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-800/50 text-center hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-md hover:shadow-red-500/10">
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{result.malicious_score}</div>
                            <div className="text-xs text-red-600/80 dark:text-red-400/80 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                              <XCircle className="h-3 w-3" /> Malicious
                            </div>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50 text-center hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-md hover:shadow-orange-500/10">
                            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">{result.suspicious_score}</div>
                            <div className="text-xs text-orange-600/80 dark:text-orange-400/80 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Suspicious
                            </div>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 text-center hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-md hover:shadow-emerald-500/10">
                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{result.harmless_score}</div>
                            <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Harmless
                            </div>
                          </div>
                          <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-700 text-center hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-md">
                            <div className="text-3xl font-bold text-slate-600 dark:text-zinc-400 mb-1">{result.undetected_score}</div>
                            <div className="text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider">Undetected</div>
                          </div>
                        </div>

                        {result.total_votes && (
                          <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wider">Community Votes</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded-lg border border-blue-100 dark:border-zinc-700 shadow-sm">
                                <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">Harmless</span>
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">{result.total_votes.harmless || 0}</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded-lg border border-blue-100 dark:border-zinc-700 shadow-sm">
                                <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">Malicious</span>
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0">{result.total_votes.malicious || 0}</Badge>
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* DETECTION TAB */}
                      <TabsContent value="detection" className="space-y-3 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {result.last_analysis_results && Object.keys(result.last_analysis_results).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(result.last_analysis_results).map(([vendor, data]: [string, any]) => (
                              <div key={vendor} className="p-3 bg-slate-50/50 dark:bg-zinc-900/50 rounded-lg border border-slate-100 dark:border-zinc-800 hover:border-pink-200 dark:hover:border-pink-800 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 truncate pr-2">{vendor}</span>
                                  <Badge className={`text-[10px] px-1.5 py-0.5 border-0 ${data.category === 'malicious' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                    data.category === 'suspicious' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                      data.category === 'harmless' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                        'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                                    }`}>
                                    {data.category}
                                  </Badge>
                                </div>
                                {data.result && data.result !== 'clean' && (
                                  <p className="text-xs text-slate-500 dark:text-zinc-400 truncate" title={data.result}>{data.result}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                            <p className="text-slate-500 dark:text-zinc-400">No detection results available</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* REPUTATION TAB */}
                      <TabsContent value="reputation" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {result.popularity_ranks && Object.keys(result.popularity_ranks).length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2 uppercase tracking-wider">
                              <TrendingUp className="h-4 w-4" />
                              Popularity Rankings
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {Object.entries(result.popularity_ranks).map(([source, data]: [string, any]) => (
                                <div key={source} className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/50 flex items-center justify-between">
                                  <span className="text-sm font-medium capitalize text-slate-700 dark:text-zinc-300">{source}</span>
                                  <Badge className="bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 shadow-sm">
                                    #{data.rank ? data.rank.toLocaleString() : 'N/A'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.last_analysis_date && (
                          <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800 flex items-center gap-4">
                            <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                              <Calendar className="h-5 w-5 text-slate-500 dark:text-zinc-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Last Analysis Date</p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{result.last_analysis_date}</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* CATEGORIES TAB */}
                      <TabsContent value="categories" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {result.categories && Object.keys(result.categories).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(result.categories).map(([source, category]) => (
                              <div key={source} className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors">
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">{source}</p>
                                <div className="flex items-center gap-2">
                                  <Tag className="h-3.5 w-3.5 text-blue-500" />
                                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{category}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                            <p className="text-slate-500 dark:text-zinc-400">No categories available</p>
                          </div>
                        )}

                        {result.registrar && (
                          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-4">
                            <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                              <Building2 className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Registrar</p>
                              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{result.registrar}</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* DNS/SSL TAB */}
                      <TabsContent value="dns" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {result.last_dns_records && result.last_dns_records.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
                              <Server className="h-4 w-4" />
                              DNS Records ({result.last_dns_records.length})
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {result.last_dns_records.slice(0, 10).map((record, idx) => (
                                <div key={idx} className="p-3 bg-slate-50/50 dark:bg-zinc-900/50 rounded-lg border border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 w-12 justify-center">
                                      {record.type}
                                    </Badge>
                                    <span className="text-xs sm:text-sm font-mono text-slate-600 dark:text-zinc-300 break-all">{record.value}</span>
                                  </div>
                                  {record.ttl && <span className="text-xs text-slate-400 font-mono whitespace-nowrap">TTL: {record.ttl}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.last_https_certificate && (
                          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/50 space-y-3">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                              <Lock className="h-4 w-4" />
                              <span>SSL Certificate</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              {result.last_https_certificate.subject && (
                                <div className="space-y-1">
                                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium uppercase tracking-wider">Subject</span>
                                  <p className="font-medium text-slate-700 dark:text-zinc-300 break-all">{result.last_https_certificate.subject.CN}</p>
                                </div>
                              )}
                              {result.last_https_certificate.issuer && (
                                <div className="space-y-1">
                                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium uppercase tracking-wider">Issuer</span>
                                  <p className="font-medium text-slate-700 dark:text-zinc-300 break-all">{result.last_https_certificate.issuer.O}</p>
                                </div>
                              )}
                              {result.last_https_certificate_date && (
                                <div className="space-y-1 sm:col-span-2">
                                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium uppercase tracking-wider">Last Seen</span>
                                  <p className="font-medium text-slate-700 dark:text-zinc-300">{result.last_https_certificate_date}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {result.jarm && (
                          <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">JARM Fingerprint</p>
                            <p className="text-xs font-mono text-slate-600 dark:text-zinc-300 break-all bg-white dark:bg-zinc-800 p-2 rounded border border-slate-200 dark:border-zinc-700">{result.jarm}</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* PASSIVE DNS TAB */}
                      <TabsContent value="passive-dns" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {result.resolutions && result.resolutions.length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2 uppercase tracking-wider">
                              <Activity className="h-4 w-4" />
                              Passive DNS Resolutions ({result.resolutions.length})
                            </p>
                            <div className="space-y-2">
                              {result.resolutions.map((res: any, idx) => (
                                <div key={idx} className="p-3 bg-purple-50/30 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0">
                                      {res.attributes?.host_name || result.domain}
                                    </Badge>
                                    <span className="text-xs sm:text-sm font-mono text-slate-600 dark:text-zinc-300 break-all">
                                      {res.attributes?.ip_address}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {res.attributes?.date ? new Date(res.attributes.date * 1000).toLocaleDateString() : 'Unknown'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                            <p className="text-slate-500 dark:text-zinc-400">No passive DNS data available</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* INFO TAB */}
                      <TabsContent value="info" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3.5 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group/item">
                              <span className="font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-2.5">
                                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400 group-hover/item:scale-110 transition-transform">
                                  <Globe className="h-3.5 w-3.5" />
                                </div>
                                Registrar
                              </span>
                              <span className="text-slate-900 dark:text-white font-semibold text-right break-all max-w-[50%] truncate">{result.registrar || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group/item">
                              <span className="font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-2.5">
                                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400 group-hover/item:scale-110 transition-transform">
                                  <Calendar className="h-3.5 w-3.5" />
                                </div>
                                Created
                              </span>
                              <span className="text-slate-900 dark:text-white font-semibold">{result.creation_date || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3.5 bg-violet-50/50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-800/50 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group/item">
                              <span className="font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-2.5">
                                <div className="p-1.5 bg-violet-100 dark:bg-violet-900/50 rounded-lg text-violet-600 dark:text-violet-400 group-hover/item:scale-110 transition-transform">
                                  <Shield className="h-3.5 w-3.5" />
                                </div>
                                Reputation
                              </span>
                              <span className={`font-bold ${result.reputation < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{result.reputation}</span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 bg-violet-50/50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-800/50 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group/item">
                              <span className="font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-2.5">
                                <div className="p-1.5 bg-violet-100 dark:bg-violet-900/50 rounded-lg text-violet-600 dark:text-violet-400 group-hover/item:scale-110 transition-transform">
                                  <Clock className="h-3.5 w-3.5" />
                                </div>
                                Last Analysis
                              </span>
                              <span className="text-slate-900 dark:text-white font-semibold">{result.last_analysis_date || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {result.whois && (
                          <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">WHOIS Information</p>
                              <Badge variant="outline" className="text-[10px]">Raw Data</Badge>
                            </div>
                            <pre className="text-xs bg-white dark:bg-zinc-950 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 overflow-x-auto whitespace-pre-wrap font-mono text-slate-600 dark:text-zinc-400 max-h-60 overflow-y-auto custom-scrollbar">
                              {result.whois}
                            </pre>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* Timestamp */}
                <div className="relative px-6 py-3 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400">
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                    Analyzed: {result.timestamp}
                  </span>
                  <span className="font-mono opacity-50">ID: {result.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VirusTotalResults;
