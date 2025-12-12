import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Globe, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExtendedDNSResultsProps {
    results: any;
}

const ExtendedDNSResults: React.FC<ExtendedDNSResultsProps> = ({ results }) => {
    if (!results || results.error) return null;

    // Handle nested structure from backend (results.records.A, etc.)
    const records = results.records || results;
    const summary = results.summary || {};

    const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA'];

    // Format a record value for display
    const formatRecord = (record: any, type: string): string => {
        if (typeof record === 'string') return record;

        // Handle MX records
        if (type === 'MX' && record.exchange) {
            return `${record.exchange} (priority: ${record.priority})`;
        }

        // Handle SOA records
        if (type === 'SOA' && record.nsname) {
            return `${record.nsname} (${record.hostmaster})`;
        }

        // Handle CAA records
        if (type === 'CAA' && record.value) {
            return `${record.flags} ${record.tag} "${record.value}"`;
        }

        // Fallback: stringify the object
        return JSON.stringify(record);
    };

    // Check if there are any records at all
    const hasRecords = recordTypes.some(type => {
        const data = records[type];
        return data && (Array.isArray(data) ? data.length > 0 : true);
    });

    return (
        <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="bg-gradient-to-r from-cyan-600/10 to-blue-600/10 border-b border-cyan-100 dark:border-cyan-900/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg">
                        <Globe className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                        <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent block">
                            Extended DNS Records
                        </span>
                        {results.domain && (
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                                for {results.domain}
                            </span>
                        )}
                    </div>
                    {summary.totalRecordTypes && (
                        <Badge variant="secondary" className="ml-auto">
                            {summary.totalRecordTypes} record types
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                    {recordTypes.map(type => {
                        const data = records[type];
                        if (!data) return null;

                        // Handle SOA as single object
                        if (type === 'SOA' && data && !Array.isArray(data)) {
                            return (
                                <div key={type} className="space-y-2">
                                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <Server className="h-3 w-3" /> {type} Record
                                    </h3>
                                    <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                                        <Table>
                                            <TableBody>
                                                <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <TableCell className="font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                                        NS: {data.nsname} | Hostmaster: {data.hostmaster} | Serial: {data.serial}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            );
                        }

                        // Handle arrays
                        if (!Array.isArray(data) || data.length === 0) return null;

                        return (
                            <div key={type} className="space-y-2">
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Server className="h-3 w-3" /> {type} Records
                                    <Badge variant="outline" className="ml-1 text-xs">{data.length}</Badge>
                                </h3>
                                <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <Table>
                                        <TableBody>
                                            {data.slice(0, 10).map((record: any, idx: number) => (
                                                <TableRow key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <TableCell className="font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300 break-all">
                                                        {formatRecord(record, type)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {data.length > 10 && (
                                                <TableRow>
                                                    <TableCell className="text-xs text-slate-400 text-center">
                                                        +{data.length - 10} more records...
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        );
                    })}
                    {!hasRecords && (
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
