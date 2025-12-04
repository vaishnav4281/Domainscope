import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Server } from "lucide-react";

interface ExtendedDNSResultsProps {
    results: any;
}

const ExtendedDNSResults: React.FC<ExtendedDNSResultsProps> = ({ results }) => {
    if (!results) return null;

    const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA', 'PTR'];

    return (
        <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-blue-100 dark:border-blue-900/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Extended DNS Records
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                    {recordTypes.map(type => {
                        const records = results[type];
                        if (!records || records.length === 0) return null;

                        return (
                            <div key={type} className="space-y-2">
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Server className="h-3 w-3" /> {type} Records
                                </h3>
                                <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <Table>
                                        <TableBody>
                                            {records.map((record: any, idx: number) => (
                                                <TableRow key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <TableCell className="font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                                        {typeof record === 'string' ? record : JSON.stringify(record)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(results).length === 0 && (
                        <div className="text-center text-slate-500 dark:text-slate-400 py-4">
                            No DNS records found.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ExtendedDNSResults;
