import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, ExternalLink, Network, Search } from "lucide-react";

interface SubdomainResultsProps {
    results: {
        subdomains?: string[];
        count?: number;
        error?: string;
        timestamp?: string;
        domain?: string;
    } | null;
}

const SubdomainResults: React.FC<SubdomainResultsProps> = ({ results }) => {
    // If no results yet (loading or not started), don't render anything or render loading state if needed.
    // But based on parent usage, it passes null initially.
    if (!results) return null;

    return (
        <Card className="h-fit border-0 shadow-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
            <CardHeader className="bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-indigo-600/10 border-b border-slate-200/50 dark:border-zinc-800 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                    <CardTitle className="flex items-center space-x-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
                            <Network className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent block">
                                Subdomain Discovery
                            </span>
                            {results.domain && (
                                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                                    for {results.domain}
                                </span>
                            )}
                        </div>
                        {results.count !== undefined && (
                            <Badge className="bg-white/50 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 backdrop-blur-sm shadow-sm">
                                {results.count} Found
                            </Badge>
                        )}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-zinc-900/50">
                {results.error ? (
                    <div className="m-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                        <p className="text-sm text-red-600 dark:text-red-400">
                            <strong>Error:</strong> {results.error}
                        </p>
                    </div>
                ) : (!results.subdomains || results.subdomains.length === 0) ? (
                    <div className="text-center py-12 sm:py-16">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-zinc-800 dark:to-zinc-800/50 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center shadow-inner">
                            <Search className="h-10 w-10 sm:h-12 sm:w-12 text-blue-300 dark:text-zinc-600" />
                        </div>
                        <p className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-2">No subdomains found</p>
                        <p className="text-slate-500 dark:text-zinc-400">We couldn't find any public subdomains for this target.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {results.subdomains.map((sub, index) => (
                                    <div
                                        key={index}
                                        className="group relative flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                <Globe className="h-4 w-4" />
                                            </div>
                                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate">
                                                {sub}
                                            </span>
                                        </div>
                                        <a
                                            href={`https://${sub}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Open in new tab"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer / Timestamp */}
                        {results.timestamp && (
                            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400">
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    Last Updated: {new Date(results.timestamp).toLocaleString()}
                                </span>
                                <span className="font-mono opacity-50">Source: crt.sh</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SubdomainResults;
