import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertOctagon, ExternalLink, Activity, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ThreatIntelResultsProps {
    safeBrowsing?: any;
    urlScan?: any;
    otx?: any;
    domain?: string;
}

const ThreatIntelResults: React.FC<ThreatIntelResultsProps> = ({ safeBrowsing, urlScan, otx, domain }) => {
    if (!safeBrowsing && !urlScan && !otx) return null;

    return (
        <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="bg-gradient-to-r from-red-600/10 to-orange-600/10 border-b border-red-100 dark:border-red-900/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                        <AlertOctagon className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent block">
                            Advanced Threat Intelligence
                        </span>
                        {domain && (
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                                for {domain}
                            </span>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

                {/* Google Safe Browsing */}
                {safeBrowsing && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" /> Google Safe Browsing
                        </h3>
                        <div className={`p-4 rounded-xl border ${safeBrowsing.matches ? 'bg-red-50 dark:bg-red-900/10 border-red-200' : 'bg-green-50 dark:bg-green-900/10 border-green-200'}`}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {safeBrowsing.matches ? "Threats Detected!" : "No Threats Found"}
                                </span>
                                <Badge variant={safeBrowsing.matches ? "destructive" : "outline"} className={!safeBrowsing.matches ? "text-green-600 border-green-200" : ""}>
                                    {safeBrowsing.matches ? "UNSAFE" : "CLEAN"}
                                </Badge>
                            </div>
                            {safeBrowsing.matches && (
                                <div className="mt-2 text-sm text-red-600">
                                    {JSON.stringify(safeBrowsing.matches)}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* URLScan.io */}
                {urlScan && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Activity className="h-4 w-4" /> URLScan.io Analysis
                        </h3>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            {urlScan.results && urlScan.results.length > 0 ? (
                                <div className="space-y-2">
                                    {urlScan.results.slice(0, 3).map((scan: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span className="truncate max-w-[200px]">{scan.url}</span>
                                            {scan.resultUrl && (
                                                <a href={scan.resultUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                    View Report <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">No recent scans found.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* AlienVault OTX */}
                {otx && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <AlertOctagon className="h-4 w-4" /> AlienVault OTX Pulses
                        </h3>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            {otx.pulses && otx.pulses.length > 0 ? (
                                <div className="space-y-3">
                                    {otx.pulses.slice(0, 3).map((pulse: any, i: number) => (
                                        <div key={i} className="border-b border-slate-200 dark:border-slate-700 last:border-0 pb-2 last:pb-0">
                                            <p className="font-medium text-slate-900 dark:text-white truncate">{pulse.name}</p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px]">{pulse.subscriber_count} subscribers</Badge>
                                                <Badge variant="outline" className="text-[10px]">{new Date(pulse.modified).toLocaleDateString()}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">No OTX pulses found for this domain.</p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ThreatIntelResults;
