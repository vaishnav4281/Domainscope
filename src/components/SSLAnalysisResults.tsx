import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ShieldCheck, Calendar, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SSLAnalysisResultsProps {
    results: any;
}

const SSLAnalysisResults: React.FC<SSLAnalysisResultsProps> = ({ results }) => {
    if (!results || results.error) return null;

    // Handle the nested structure from backend
    const cert = results.certificate || {};
    const validity = results.validity || {};
    const protocol = results.protocol || {};

    const isValid = validity.isValid ?? true;
    const daysRemaining = validity.expiresIn ?? cert.daysRemaining ?? 0;
    const grade = results.grade || 'N/A';
    const score = results.score ?? 0;

    return (
        <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="bg-gradient-to-r from-indigo-600/10 to-violet-600/10 border-b border-indigo-100 dark:border-indigo-900/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                        <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent block">
                            SSL/TLS Analysis
                        </span>
                        {results.domain && (
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                                for {results.domain}
                            </span>
                        )}
                    </div>
                    <Badge variant={isValid ? "default" : "destructive"} className="ml-auto">
                        {isValid ? "Valid" : "Invalid"}
                    </Badge>
                    <Badge
                        variant="outline"
                        className={`${grade.startsWith('A') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            grade === 'B' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                grade === 'C' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                    >
                        Grade: {grade}
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
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {cert.issuer?.O || cert.issuer?.CN || "Unknown"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Expires</p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {cert.validTo ? new Date(cert.validTo).toLocaleDateString() : 'Unknown'}
                                    <span className={`ml-2 text-xs ${daysRemaining < 30 ? 'text-red-500' : 'text-green-500'}`}>
                                        ({daysRemaining} days left)
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Award className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Security Score</p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {score}/100
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Protocol & Cipher</p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{protocol.version || "TLS 1.2+"}</Badge>
                                {protocol.cipher?.name && (
                                    <Badge variant="secondary" className="text-xs">{protocol.cipher.name}</Badge>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Subject Alternative Names</p>
                            <div className="flex flex-wrap gap-1">
                                {(cert.subjectAltNames || []).slice(0, 5).map((san: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                        {san.replace('DNS:', '')}
                                    </Badge>
                                ))}
                                {(cert.subjectAltNames || []).length > 5 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{((cert.subjectAltNames || []).length - 5)} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                        {results.recommendations && results.recommendations.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Recommendations</p>
                                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                    {results.recommendations.slice(0, 3).map((rec: string, i: number) => (
                                        <li key={i}>• {rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SSLAnalysisResults;

