import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ExternalLink } from "lucide-react";

interface WaybackResultsProps {
    results: any;
}

const WaybackResults: React.FC<WaybackResultsProps> = ({ results }) => {
    if (!results) return null;

    return (
        <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="bg-gradient-to-r from-yellow-600/10 to-amber-600/10 border-b border-yellow-100 dark:border-yellow-900/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                        <History className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                        <span className="bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent block">
                            Wayback Machine History
                        </span>
                        {results.domain && (
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                                for {results.domain}
                            </span>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-sm text-slate-500 dark:text-slate-400">First Seen</p>
                        <p className="font-bold text-lg text-slate-900 dark:text-white">
                            {results.firstSnapshot?.date
                                ? results.firstSnapshot.date.split(' ')[0]
                                : (results.first_scan ? new Date(results.first_scan).toLocaleDateString() : "Unknown")}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Last Seen</p>
                        <p className="font-bold text-lg text-slate-900 dark:text-white">
                            {results.lastSnapshot?.date
                                ? results.lastSnapshot.date.split(' ')[0]
                                : (results.last_scan ? new Date(results.last_scan).toLocaleDateString() : "Unknown")}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Snapshots</p>
                        <p className="font-bold text-lg text-slate-900 dark:text-white">
                            {(results.totalSnapshots ?? results.total_scans)?.toLocaleString() || 0}
                        </p>
                    </div>
                </div>
                {(results.lastSnapshot?.url || results.link || results.domain) && (
                    <div className="mt-6 text-center">
                        <a
                            href={results.lastSnapshot?.url || results.link || `https://web.archive.org/web/${results.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                        >
                            View Timeline on Internet Archive <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default WaybackResults;
