import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, Globe, Server, Lock, FileText, Activity, Award, Calendar, Tag, Building2 } from "lucide-react";

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
      case 'Clean': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
      case 'Medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
      case 'Low': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
      case 'Clean': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  return (
  <Card className="h-fit border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
  <CardHeader className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-b border-green-200/50 dark:border-emerald-800/50 p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent text-lg sm:text-xl">
              VirusTotal Security Analysis
            </span>
            <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-slate-700 dark:from-green-950 dark:to-emerald-950 dark:text-slate-300 border-0">
              {results.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
  <CardContent className="p-2 sm:p-3">
        {results.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-slate-500 dark:text-slate-400">
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 rounded-full w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-base sm:text-lg font-medium mb-2">No VirusTotal data yet</p>
            <p className="text-sm">Security analysis will appear here after domain scan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div 
                key={result.id} 
                className="border border-green-200/50 dark:border-emerald-800/50 rounded-xl p-4 sm:p-6 space-y-4 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 hover:shadow-lg transition-all duration-500 hover:scale-[1.01] animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header with Risk Level */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-3 border-b border-green-200/50 dark:border-emerald-800/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent break-all">
                        {result.domain}
                      </h3>
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-0 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {result.risk_level && (
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getRiskColor(result.risk_level)}`}></div>
                        <Badge className={`text-xs font-medium border-0 ${getRiskBadge(result.risk_level)}`}>
                          Risk: {result.risk_level}
                        </Badge>
                      </div>
                    )}
                    {result.reputation !== undefined && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-0 text-xs">
                        Rep: {result.reputation}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {result.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <strong>Error:</strong> {result.error}
                    </p>
                  </div>
                )}

                {!result.error && (
                  <Tabs defaultValue="security" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-green-100 dark:bg-green-950">
                      <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
                      <TabsTrigger value="detection" className="text-xs">Detection</TabsTrigger>
                      <TabsTrigger value="reputation" className="text-xs">Reputation</TabsTrigger>
                      <TabsTrigger value="categories" className="text-xs">Categories</TabsTrigger>
                      <TabsTrigger value="dns" className="text-xs">DNS/SSL</TabsTrigger>
                      <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
                    </TabsList>

                    {/* SECURITY TAB */}
                    <TabsContent value="security" className="space-y-3 mt-4">
                      {result.last_analysis_stats && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Malicious</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.last_analysis_stats.malicious || 0}</p>
                          </div>
                          
                          <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Suspicious</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{result.last_analysis_stats.suspicious || 0}</p>
                          </div>
                          
                          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Harmless</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.last_analysis_stats.harmless || 0}</p>
                          </div>
                          
                          <div className="p-3 bg-gray-50 dark:bg-gray-950/30 rounded-lg border border-gray-200 dark:border-gray-800">
                            <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Undetected</p>
                            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{result.last_analysis_stats.undetected || 0}</p>
                          </div>
                        </div>
                      )}

                      {result.total_votes && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">Community Votes</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium">Harmless:</span> <span className="text-green-600 dark:text-green-400">{result.total_votes.harmless || 0}</span>
                            </div>
                            <div>
                              <span className="font-medium">Malicious:</span> <span className="text-red-600 dark:text-red-400">{result.total_votes.malicious || 0}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* DETECTION TAB */}
                    <TabsContent value="detection" className="space-y-3 mt-4">
                      {result.last_analysis_results && Object.keys(result.last_analysis_results).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(result.last_analysis_results).map(([vendor, data]: [string, any]) => (
                            <div key={vendor} className="p-2 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{vendor}</span>
                                <Badge className={`text-xs ${
                                  data.category === 'malicious' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                                  data.category === 'suspicious' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                                  data.category === 'harmless' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300'
                                }`}>
                                  {data.category}
                                </Badge>
                              </div>
                              {data.result && data.result !== 'clean' && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{data.result}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No detection results available</p>
                      )}
                    </TabsContent>

                    {/* REPUTATION TAB */}
                    <TabsContent value="reputation" className="space-y-3 mt-4">
                      {result.popularity_ranks && Object.keys(result.popularity_ranks).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4" />
                            <span>Popularity Rankings</span>
                          </p>
                          {Object.entries(result.popularity_ranks).map(([source, data]: [string, any]) => (
                            <div key={source} className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium capitalize">{source}</span>
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 text-xs">
                                  Rank: {data.rank ? data.rank.toLocaleString() : 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {result.last_analysis_date && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg">
                          <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400 mb-1" />
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Last Analysis</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{result.last_analysis_date}</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* CATEGORIES TAB */}
                    <TabsContent value="categories" className="space-y-3 mt-4">
                      {result.categories && Object.keys(result.categories).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(result.categories).map(([source, category]) => (
                            <div key={source} className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{source}</p>
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">{category}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No categories available</p>
                      )}

                      {result.registrar && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1" />
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Registrar</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">{result.registrar}</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* DNS/SSL TAB */}
                    <TabsContent value="dns" className="space-y-3 mt-4">
                      {result.last_dns_records && result.last_dns_records.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center space-x-2">
                            <Server className="h-4 w-4" />
                            <span>DNS Records ({result.last_dns_records.length})</span>
                          </p>
                          <div className="space-y-2">
                            {result.last_dns_records.slice(0, 10).map((record, idx) => (
                              <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-950/50 rounded text-xs">
                                <div className="flex items-center justify-between">
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs">
                                    {record.type}
                                  </Badge>
                                  <span className="text-slate-600 dark:text-slate-400 font-mono">{record.value}</span>
                                </div>
                                {record.ttl && <p className="text-slate-500 mt-1">TTL: {record.ttl}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.last_https_certificate && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-xs font-semibold text-green-600 dark:text-green-400">SSL Certificate</p>
                          </div>
                          <div className="space-y-1 text-xs">
                            {result.last_https_certificate.subject && (
                              <div><span className="font-medium">Subject:</span> {result.last_https_certificate.subject.CN}</div>
                            )}
                            {result.last_https_certificate.issuer && (
                              <div><span className="font-medium">Issuer:</span> {result.last_https_certificate.issuer.O}</div>
                            )}
                            {result.last_https_certificate_date && (
                              <div><span className="font-medium">Last Seen:</span> {result.last_https_certificate_date}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {result.jarm && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">JARM Fingerprint</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-mono break-all">{result.jarm}</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* INFO TAB */}
                    <TabsContent value="info" className="space-y-3 mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.creation_date && (
                          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Creation Date</p>
                            <p className="text-sm text-green-600 dark:text-green-400">{result.creation_date}</p>
                          </div>
                        )}

                        {result.last_update_date && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Last Update</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">{result.last_update_date}</p>
                          </div>
                        )}

                        {result.whois_date && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">WHOIS Date</p>
                            <p className="text-sm text-purple-600 dark:text-purple-400">{result.whois_date}</p>
                          </div>
                        )}
                      </div>

                      {result.whois && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">WHOIS Information</p>
                          <pre className="text-xs bg-white dark:bg-slate-900 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                            {result.whois}
                          </pre>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}

                {/* Timestamp */}
                <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-green-200/50 dark:border-emerald-800/50 pt-3 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-2">
                  <span className="font-medium">Analyzed:</span> {result.timestamp}
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
