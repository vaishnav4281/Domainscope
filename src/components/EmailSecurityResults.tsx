import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmailSecurityResultsProps {
    results: any;
}

const EmailSecurityResults: React.FC<EmailSecurityResultsProps> = ({ results }) => {
    if (!results) return null;

    const getStatusIcon = (valid: boolean) => {
        return valid ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
    };

    return (
        <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="bg-gradient-to-r from-green-600/10 to-teal-600/10 border-b border-green-100 dark:border-green-900/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent block">
                            Email Security (DMARC/SPF)
                        </span>
                        {results.domain && (
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                                for {results.domain}
                            </span>
                        )}
                    </div>
                    <Badge variant={results.score >= 80 ? "default" : results.score >= 50 ? "secondary" : "destructive"} className="ml-auto">
                        Score: {results.score}/100
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SPF */}
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 dark:text-white">SPF Record</h3>
                            {getStatusIcon(results.spf?.valid)}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 break-all font-mono">
                            {results.spf?.record || "No SPF record found"}
                        </p>
                    </div>

                    {/* DMARC */}
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 dark:text-white">DMARC Policy</h3>
                            {getStatusIcon(results.dmarc?.valid)}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 break-all font-mono">
                            {results.dmarc?.record || "No DMARC record found"}
                        </p>
                        {results.dmarc?.policy && (
                            <Badge variant="outline" className="mt-2">Policy: {results.dmarc.policy}</Badge>
                        )}
                    </div>

                    {/* DKIM */}
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 dark:text-white">DKIM</h3>
                            {/* DKIM is hard to validate without a selector, so we just show presence if we found anything */}
                            {results.dkim ? <CheckCircle className="h-4 w-4 text-blue-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            DKIM records usually require knowing the selector.
                        </p>
                    </div>

                    {/* BIMI */}
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 dark:text-white">BIMI</h3>
                            {getStatusIcon(results.bimi?.valid)}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 break-all font-mono">
                            {results.bimi?.record || "No BIMI record found"}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default EmailSecurityResults;
