import { useState, useEffect, useMemo } from "react";
import SEO from '@/components/SEO';
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Shield,
    Search,
    Database,
    History as HistoryIcon,
    LogOut,
    Moon,
    Sun,
    Menu,
    X,
    Trash2,
    LayoutDashboard,
    ChevronRight,
    User,
    Settings,
    Bell
} from "lucide-react";
import DomainAnalysisCard from "@/components/DomainAnalysisCard";
import BulkScannerCard from "@/components/BulkScannerCard";
import ResultsPanel from "@/components/ResultsPanel";
import MetascraperResults from "@/components/MetascraperResults";
import VirusTotalResults from "@/components/VirusTotalResults";

import SecurityIntelPanel from "@/components/SecurityIntelPanel";
import SubdomainResults from "@/components/SubdomainResults";
import ExtendedDNSResults from "@/components/ExtendedDNSResults";
import EmailSecurityResults from "@/components/EmailSecurityResults";
import SSLAnalysisResults from "@/components/SSLAnalysisResults";
import SecurityHeadersResults from "@/components/SecurityHeadersResults";
import ThreatIntelResults from "@/components/ThreatIntelResults";
import WaybackResults from "@/components/WaybackResults";
import { API_BASE_URL } from '../config';
import Footer from '@/components/Footer';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Dashboard = () => {
    const { token, logout, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'history'>('single');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Data States
    const [history, setHistory] = useState<any[]>([]);
    const [results, setResults] = useState([]);
    const [metascraperResults, setMetascraperResults] = useState([]);
    const [virusTotalResults, setVirusTotalResults] = useState([]);
    const [subdomainResults, setSubdomainResults] = useState<any[]>([]);

    // New OSINT Data States
    const [extendedDNSResults, setExtendedDNSResults] = useState<any[]>([]);
    const [emailSecurityResults, setEmailSecurityResults] = useState<any[]>([]);
    const [sslResults, setSSLResults] = useState<any[]>([]);
    const [headersResults, setHeadersResults] = useState<any[]>([]);
    const [threatIntelResults, setThreatIntelResults] = useState<any[]>([]);
    const [waybackResults, setWaybackResults] = useState<any[]>([]);

    // Module Selection State
    const [enabledModules, setEnabledModules] = useState({
        core: true,
        security: true,
        subdomains: true,
        virustotal: true,
        metadata: true,
        // New Modules
        extendedDns: true,
        emailSecurity: true,
        ssl: true,
        headers: true,
        threatIntel: true,
        wayback: true
    });


    // Theme Toggle
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        if (!isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    // History Management
    const fetchHistory = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                logout();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            console.error('Failed to fetch history', e);
        }
    };

    const saveHistory = async (target: string, result: any) => {
        if (!token) return;
        try {
            await fetch(`${API_BASE_URL}/api/v1/history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ target, result })
            });
        } catch (e) {
            console.error('Failed to save history', e);
        }
    };

    const clearHistory = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/history`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setHistory([]);
        } catch (e) {
            console.error('Failed to clear history', e);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
    }, [activeTab]);

    // Start Scan Handler
    const handleStartScan = () => {
        setResults([]);
        setMetascraperResults([]);
        setVirusTotalResults([]);
        setSubdomainResults([]);
        // Reset New States
        setExtendedDNSResults([]);
        setEmailSecurityResults([]);
        setSSLResults([]);
        setHeadersResults([]);
        setThreatIntelResults([]);
        setWaybackResults([]);
    };

    // Result Handlers
    const handleSingleResults = (newResult: any) => {
        // For single scan, we ensure we only have one result (though handleStartScan should have cleared it)
        setResults([newResult]);
        // Only save to history if the result is complete (not a partial progressive update)
        if (!newResult.partial) {
            saveHistory(newResult.domain || newResult.ip, newResult);
        }
    };

    const handleMetascraperResults = (newResult: any) => {
        setMetascraperResults(prev => [newResult, ...prev]);
    };

    const handleVirusTotalResults = (newResult: any) => {
        setVirusTotalResults(prev => [newResult, ...prev]);
    };

    const handleSubdomainResults = (newResult: any) => {
        setSubdomainResults(prev => [newResult, ...prev]);
    };

    const handleBulkResults = (newResult: any) => {
        setResults(prev => [newResult, ...prev]);
        saveHistory(newResult.domain || newResult.ip, newResult);
    };


    // New Handlers
    const handleExtendedDNSResults = (res: any) => {
        setExtendedDNSResults(prev => [res, ...prev]);
        setResults(prev => prev.map(r => r.domain === res.domain ? { ...r, extendedDNS: res } : r));
    };
    const handleEmailSecurityResults = (res: any) => {
        setEmailSecurityResults(prev => [res, ...prev]);
        setResults(prev => prev.map(r => r.domain === res.domain ? { ...r, emailSecurity: res } : r));
    };
    const handleSSLResults = (res: any) => {
        setSSLResults(prev => [res, ...prev]);
        setResults(prev => prev.map(r => r.domain === res.domain ? { ...r, sslResults: res } : r));
    };
    const handleHeadersResults = (res: any) => {
        setHeadersResults(prev => [res, ...prev]);
        setResults(prev => prev.map(r => r.domain === res.domain ? { ...r, headersResults: res } : r));
    };
    const handleThreatIntelResults = (res: any) => {
        setThreatIntelResults(prev => [res, ...prev]);
        if (res.domain) {
            setResults(prev => prev.map(r => r.domain === res.domain ? { ...r, threatIntel: res } : r));
        }
    };
    const handleWaybackResults = (res: any) => {
        setWaybackResults(prev => [res, ...prev]);
        setResults(prev => prev.map(r => r.domain === res.domain ? { ...r, waybackResults: res } : r));
    };

    const vtSummaryByDomain = useMemo(() => {
        const map: Record<string, any> = {};
        (virusTotalResults || []).forEach((r: any) => {
            if (!r || !r.domain) return;
            map[r.domain] = {
                reputation: r.reputation,
                risk_level: r.risk_level,
                malicious: r.malicious_score,
            };
        });
        return map;
    }, [virusTotalResults]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300 flex flex-col">
            <SEO
                title="Dashboard"
                description="Manage your domain scans, view history, and analyze security intelligence data."
            />

            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            {/* Mobile Menu Trigger */}
                            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden mr-2">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
                                    <div className="flex flex-col gap-6 mt-6">
                                        <div className="flex items-center gap-2 px-2">
                                            <div className="bg-gradient-to-br from-red-600 to-blue-600 p-2 rounded-lg shadow-lg shadow-red-500/20">
                                                <Shield className="h-5 w-5 text-white" />
                                            </div>
                                            <span className="text-lg font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                                                DomainScope
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() => { setActiveTab('single'); setIsMobileMenuOpen(false); }}
                                                className={`justify-start text-base font-medium h-12 ${activeTab === 'single' ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}
                                            >
                                                <Search className="mr-3 h-5 w-5" />
                                                Single Scan
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => { setActiveTab('bulk'); setIsMobileMenuOpen(false); }}
                                                className={`justify-start text-base font-medium h-12 ${activeTab === 'bulk' ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}
                                            >
                                                <Database className="mr-3 h-5 w-5" />
                                                Bulk Scanner
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
                                                className={`justify-start text-base font-medium h-12 ${activeTab === 'history' ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'}`}
                                            >
                                                <HistoryIcon className="mr-3 h-5 w-5" />
                                                History
                                            </Button>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>

                            <div className="bg-gradient-to-br from-red-600 to-blue-600 p-2 rounded-lg shadow-lg shadow-red-500/20 hidden md:block">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent hidden md:block">
                                DomainScope
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                onClick={() => setActiveTab('single')}
                                className={`text-sm font-medium transition-colors ${activeTab === 'single' ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <Search className="mr-2 h-4 w-4" />
                                Single Scan
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setActiveTab('bulk')}
                                className={`text-sm font-medium transition-colors ${activeTab === 'bulk' ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <Database className="mr-2 h-4 w-4" />
                                Bulk Scanner
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setActiveTab('history')}
                                className={`text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <HistoryIcon className="mr-2 h-4 w-4" />
                                History
                            </Button>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleDarkMode}
                                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-medium">
                                                {user?.email?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user?.email?.split('@')[0]}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
                <div className="space-y-8 pb-20">

                    {/* Page Title & Description */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {activeTab === 'single' && 'Single Domain Analysis'}
                                {activeTab === 'bulk' && 'Bulk Domain Scanner'}
                                {activeTab === 'history' && 'Scan History'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                                {activeTab === 'single' && 'Deep dive into a single domain\'s security posture.'}
                                {activeTab === 'bulk' && 'Analyze multiple domains simultaneously for efficiency.'}
                                {activeTab === 'history' && 'Review your past scans and reports.'}
                            </p>
                        </div>

                        {activeTab === 'history' && history.length > 0 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="shadow-lg shadow-red-500/20">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Clear History
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white dark:bg-slate-900">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your scan history.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={clearHistory} className="bg-red-600 text-white hover:bg-red-700">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>

                    {/* Content Views */}
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        {activeTab === 'single' && (
                            <div className="space-y-8">
                                <DomainAnalysisCard
                                    onStartScan={handleStartScan}
                                    onResults={handleSingleResults}
                                    onMetascraperResults={handleMetascraperResults}
                                    onVirusTotalResults={handleVirusTotalResults}
                                    onSubdomainResults={handleSubdomainResults}
                                    // Pass new handlers
                                    onExtendedDNSResults={handleExtendedDNSResults}
                                    onEmailSecurityResults={handleEmailSecurityResults}
                                    onSSLResults={handleSSLResults}
                                    onHeadersResults={handleHeadersResults}
                                    onThreatIntelResults={handleThreatIntelResults}
                                    onWaybackResults={handleWaybackResults}

                                    enabledModules={enabledModules}
                                    setEnabledModules={setEnabledModules}
                                />
                                {results.length > 0 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                        {/* Priority Cards: Core Results → Security Intel → VirusTotal */}
                                        {enabledModules.core && (
                                            <ResultsPanel
                                                results={results}
                                                vtSummaryByDomain={vtSummaryByDomain}
                                                extendedDNS={extendedDNSResults}
                                                emailSecurity={emailSecurityResults}
                                                sslResults={sslResults}
                                                headersResults={headersResults}
                                                waybackResults={waybackResults}
                                            />
                                        )}
                                        {enabledModules.security && <SecurityIntelPanel results={results as any} />}
                                        {enabledModules.virustotal && <VirusTotalResults results={virusTotalResults} />}

                                        {/* Secondary Cards */}
                                        {enabledModules.subdomains && subdomainResults.map((res, i) => (
                                            <SubdomainResults key={i} results={res} />
                                        ))}
                                        {enabledModules.metadata && <MetascraperResults results={metascraperResults} />}

                                        {/* New OSINT Modules */}
                                        {enabledModules.extendedDns && extendedDNSResults.map((res, i) => (
                                            <ExtendedDNSResults key={i} results={res} />
                                        ))}
                                        {enabledModules.emailSecurity && emailSecurityResults.map((res, i) => (
                                            <EmailSecurityResults key={i} results={res} />
                                        ))}
                                        {enabledModules.ssl && sslResults.map((res, i) => (
                                            <SSLAnalysisResults key={i} results={res} />
                                        ))}
                                        {enabledModules.headers && headersResults.map((res, i) => (
                                            <SecurityHeadersResults key={i} results={res} />
                                        ))}
                                        {enabledModules.threatIntel && threatIntelResults.map((res, i) => (
                                            <ThreatIntelResults
                                                key={i}
                                                safeBrowsing={res.safeBrowsing}
                                                urlScan={res.urlScan}
                                                otx={res.otx}
                                                domain={res.domain}
                                            />
                                        ))}
                                        {enabledModules.wayback && waybackResults.map((res, i) => (
                                            <WaybackResults key={i} results={res} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'bulk' && (
                            <div className="space-y-8">
                                <BulkScannerCard
                                    onStartScan={handleStartScan}
                                    onResults={handleBulkResults}
                                    onMetascraperResults={handleMetascraperResults}
                                    onVirusTotalResults={handleVirusTotalResults}
                                    onSubdomainResults={handleSubdomainResults}
                                    // New OSINT handlers
                                    onExtendedDNSResults={handleExtendedDNSResults}
                                    onEmailSecurityResults={handleEmailSecurityResults}
                                    onSSLResults={handleSSLResults}
                                    onHeadersResults={handleHeadersResults}
                                    onThreatIntelResults={handleThreatIntelResults}
                                    onWaybackResults={handleWaybackResults}

                                    enabledModules={enabledModules}
                                    setEnabledModules={setEnabledModules}
                                />
                                {results.length > 0 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                        {/* Priority Cards */}
                                        {enabledModules.core && (
                                            <ResultsPanel
                                                results={results}
                                                vtSummaryByDomain={vtSummaryByDomain}
                                                extendedDNS={extendedDNSResults}
                                                emailSecurity={emailSecurityResults}
                                                sslResults={sslResults}
                                                headersResults={headersResults}
                                                waybackResults={waybackResults}
                                            />
                                        )}
                                        {enabledModules.security && <SecurityIntelPanel results={results as any} />}
                                        {enabledModules.virustotal && <VirusTotalResults results={virusTotalResults} />}

                                        {/* Secondary Cards */}
                                        {enabledModules.subdomains && subdomainResults.map((res, i) => (
                                            <SubdomainResults key={i} results={res} />
                                        ))}
                                        {enabledModules.metadata && <MetascraperResults results={metascraperResults} />}

                                        {/* New OSINT Cards */}
                                        {enabledModules.extendedDns && extendedDNSResults.map((res, i) => (
                                            <ExtendedDNSResults key={i} results={res} />
                                        ))}
                                        {enabledModules.emailSecurity && emailSecurityResults.map((res, i) => (
                                            <EmailSecurityResults key={i} results={res} />
                                        ))}
                                        {enabledModules.ssl && sslResults.map((res, i) => (
                                            <SSLAnalysisResults key={i} results={res} />
                                        ))}
                                        {enabledModules.headers && headersResults.map((res, i) => (
                                            <SecurityHeadersResults key={i} results={res} />
                                        ))}
                                        {enabledModules.threatIntel && threatIntelResults.map((res, i) => (
                                            <ThreatIntelResults
                                                key={i}
                                                safeBrowsing={res.safeBrowsing}
                                                urlScan={res.urlScan}
                                                otx={res.otx}
                                                domain={res.domain}
                                            />
                                        ))}
                                        {enabledModules.wayback && waybackResults.map((res, i) => (
                                            <WaybackResults key={i} results={res} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {history.length === 0 ? (
                                            <div className="text-center py-20">
                                                <div className="bg-slate-100 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <HistoryIcon className="h-10 w-10 text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No scan history</h3>
                                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                                    Your recent scans will appear here. Start a new scan to build your history.
                                                </p>
                                                <Button
                                                    className="mt-6 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                                                    onClick={() => setActiveTab('single')}
                                                >
                                                    Start Scanning
                                                </Button>
                                            </div>
                                        ) : (
                                            history.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`p-3 rounded-xl ${item.type === 'bulk' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                                            {item.type === 'bulk' ? <Database className="h-6 w-6" /> : <Search className="h-6 w-6" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900 dark:text-white text-lg">{item.target}</p>
                                                            <div className="flex items-center gap-3 mt-1">


                                                                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                                                    {new Date(item.createdAt).toLocaleString(undefined, {
                                                                        dateStyle: 'medium',
                                                                        timeStyle: 'short'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))

                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Dashboard;
