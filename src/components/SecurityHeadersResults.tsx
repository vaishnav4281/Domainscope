import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SecurityHeadersResultsProps {
    results: any;
}

const SecurityHeadersResults: React.FC<SecurityHeadersResultsProps> = ({ results }) => {
    if (!results) return null;

    const headers = [
        { key: 'strict-transport-security', label: 'HSTS', desc: 'Enforces HTTPS connections' },
        { key: 'content-security-policy', label: 'CSP', desc: 'Prevents XSS attacks' },
        { key: 'x-frame-options', label: 'X-Frame-Options', desc: 'Prevents clickjacking' },
        { key: 'x-content-type-options', label: 'X-Content-Type', desc: 'Prevents MIME sniffing' },
        { key: 'referrer-policy', label: 'Referrer Policy', desc: 'Controls referrer information' },
        { key: 'permissions-policy', label: 'Permissions Policy', desc: 'Controls browser features' },
    ];

    const score = results.score || 0;
    const grade = results.grade || 'F';

    const getGradeColor = (g: string) => {
        if (g.startsWith('A')) return 'bg-green-500';
        if (g.startsWith('B')) return 'bg-blue-500';
        if (g.startsWith('C')) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="bg-gradient-to-r from-orange-600/10 to-red-600/10 border-b border-orange-100 dark:border-orange-900/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                        <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent block">
                            HTTP Security Headers
                        </span>
                        {results.domain && (
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                                for {results.domain}
                            </span>
                        )}
                    </div>
                    <div className={`ml-auto px-3 py-1 rounded-full text-white font-bold ${getGradeColor(grade)}`}>
                        Grade: {grade}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {headers.map((header) => {
                        const value = results.headers?.[header.key];
                        const present = !!value;

                        return (
                            <div key={header.key} className={`p-4 rounded-xl border ${present ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-slate-900 dark:text-white">{header.label}</h4>
                                    {present ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{header.desc}</p>
                                {present && (
                                    <code className="text-[10px] bg-white dark:bg-slate-950 p-1 rounded block truncate">
                                        {value.length > 30 ? value.substring(0, 30) + '...' : value}
                                    </code>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default SecurityHeadersResults;
