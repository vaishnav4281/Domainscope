import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ShieldCheck, AlertTriangle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SSLAnalysisResultsProps {
    results: any;
}

const SSLAnalysisResults: React.FC<SSLAnalysisResultsProps> = ({ results }) => {
    if (!results || results.error) return null;

    const isValid = results.valid;
    const daysRemaining = results.daysRemaining;

    return (
        <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="bg-gradient-to-r from-indigo-600/10 to-violet-600/10 border-b border-indigo-100 dark:border-indigo-900/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                        <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        SSL/TLS Analysis
                    </span>
                    <Badge variant={isValid ? "default" : "destructive"} className="ml-auto">
                        {isValid ? "Valid" : "Invalid"}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Issuer</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{results.issuer?.O || results.issuer?.CN || "Unknown"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Expires</p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {new Date(results.validTo).toLocaleDateString()}
                                    <span className={`ml-2 text-xs ${daysRemaining < 30 ? 'text-red-500' : 'text-green-500'}`}>
                                        ({daysRemaining} days left)
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Protocol Support</p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{results.protocol || "TLS 1.2+"}</Badge>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Subject Alternative Names</p>
                            <div className="flex flex-wrap gap-1">
                                {(results.subjectaltname || "").split(', ').slice(0, 5).map((san: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{san.replace('DNS:', '')}</Badge>
                                ))}
                                {(results.subjectaltname || "").split(', ').length > 5 && (
                                    <Badge variant="secondary" className="text-xs">+{((results.subjectaltname || "").split(', ').length - 5)} more</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SSLAnalysisResults;
