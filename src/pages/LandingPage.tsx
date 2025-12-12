import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Globe, Database, Activity, ArrowRight, CheckCircle2, Lock, Zap, Sun, Moon, LayoutDashboard, Menu, LogIn, UserPlus, Network, FileSearch, RefreshCw, Smartphone, Server, TrendingUp, MapPin, Clock, AlertOctagon, Layers, Terminal, Code, Cpu, Fingerprint, Search, ShieldCheck, Users, MessageSquare, ChevronRight, Star, Building, AlertTriangle, Calendar } from 'lucide-react';
import Globe3D from '@/components/Globe3D';
import { useAuth } from '@/context/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import Footer from '@/components/Footer';

import SEO from '@/components/SEO';

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-slate-900 dark:text-slate-50 transition-colors duration-300 relative overflow-hidden font-sans flex flex-col">
            <SEO
                title="DomainScope"
                description="Advanced domain intelligence platform built by an expert Software Engineer. Features WHOIS, DNS, Threat Intel, and more."
            />


            {/* Animated gradient background */}
            {/* Animated gradient background - Light mode only, hidden in dark mode for pure black */}
            <div className="absolute inset-0 pointer-events-none dark:hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] via-purple-500/[0.02] to-blue-500/[0.03] animate-gradient" />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.02] via-transparent to-red-500/[0.02] animate-gradient" style={{ animationDelay: '1s', animationDuration: '4s' }} />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 border-b border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-[#050505]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="bg-gradient-to-br from-red-600 to-blue-600 p-2 rounded-lg shadow-lg shadow-red-500/20">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                                DomainScope
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    const isDark = document.documentElement.classList.toggle('dark');
                                    localStorage.setItem('theme', isDark ? 'dark' : 'light');
                                }}
                                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hidden sm:flex"
                            >
                                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>

                            <div className="hidden md:flex items-center space-x-4">
                                {isAuthenticated ? (
                                    <Link to="/dashboard">
                                        <Button className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            Dashboard
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/login">
                                            <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                                                Log in
                                            </Button>
                                        </Link>
                                        <Link to="/signup">
                                            <Button className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                                                Get Started
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Mobile Menu */}
                            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden">
                                        <Menu className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
                                    <div className="flex flex-col gap-6 mt-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-slate-900 dark:text-white">Menu</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    const isDark = document.documentElement.classList.toggle('dark');
                                                    localStorage.setItem('theme', isDark ? 'dark' : 'light');
                                                }}
                                                className="text-slate-600 dark:text-slate-300"
                                            >
                                                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {isAuthenticated ? (
                                                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                                    <Button className="w-full justify-start bg-gradient-to-r from-red-600 to-blue-600 text-white">
                                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                                        Dashboard
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <>
                                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                                        <Button variant="outline" className="w-full justify-start border-slate-200 dark:border-slate-800">
                                                            <LogIn className="mr-2 h-4 w-4" />
                                                            Log in
                                                        </Button>
                                                    </Link>
                                                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                                                        <Button className="w-full justify-start bg-gradient-to-r from-red-600 to-blue-600 text-white">
                                                            <UserPlus className="mr-2 h-4 w-4" />
                                                            Get Started
                                                        </Button>
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Overflow Visible for Globe */}
            <div className="relative pt-20 pb-16 sm:pt-32 sm:pb-32 overflow-visible flex-grow flex items-center min-h-[85vh]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full overflow-visible">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center overflow-visible">
                        {/* Left Column: Text Content */}
                        <div className="lg:col-span-7 text-center lg:text-left relative z-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6 animate-fade-in-up">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Trusted by Law Enforcement & Cyber Defense Teams
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight text-gray-900 dark:text-white">
                                Domain Intelligence for <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600 drop-shadow-sm">
                                    Digital Forensics
                                </span>
                            </h1>

                            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl leading-relaxed font-light">
                                The elite OSINT platform for advanced domain reconnaissance.
                                Used by intelligence agencies and security professionals to uncover threats, map infrastructure, and secure digital borders.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-5 animate-fade-in-up animation-delay-300">
                                {isAuthenticated ? (
                                    <Link to="/dashboard">
                                        <Button size="lg" className="h-14 px-10 text-lg bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-200 border-0 shadow-xl transition-all duration-300 rounded-xl font-bold group">
                                            Go to Dashboard <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/signup">
                                            <Button size="lg" className="h-14 px-10 text-lg bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white border-0 shadow-xl hover:shadow-blue-500/25 transition-all duration-300 rounded-xl font-bold group">
                                                Start Scanning <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                        <Link to="/login">
                                            <Button size="lg" variant="ghost" className="h-14 px-10 text-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 rounded-xl font-bold border-2 border-transparent hover:border-gray-200 dark:hover:border-white/20">
                                                Login
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Column: 3D Globe - Completely Unbounded */}
                        <div className="lg:col-span-5 relative min-h-[600px] overflow-visible">
                            <div className="absolute inset-0 -inset-x-32 -inset-y-32 overflow-visible">
                                <Globe3D />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Powered By Section */}
            <div className="py-10 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-[#080808]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm font-semibold text-slate-500 dark:text-slate-500 mb-8 uppercase tracking-wider">Powered by Industry-Leading Intelligence</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300" title="VirusTotal"><Shield className="h-6 w-6" /> VirusTotal</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300" title="AlienVault OTX"><Database className="h-6 w-6" /> AlienVault</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300" title="crt.sh"><FileSearch className="h-6 w-6" /> crt.sh</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300" title="URLScan.io"><Globe className="h-6 w-6" /> URLScan.io</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-700 dark:text-slate-300" title="Google Safe Browsing"><ShieldCheck className="h-6 w-6" /> Google Safe Browsing</div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="relative py-12 bg-gradient-to-r from-red-600/5 via-purple-600/5 to-blue-600/5 dark:from-red-600/10 dark:via-purple-600/10 dark:to-blue-600/10 border-y border-slate-200/50 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="space-y-2">
                            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">8+</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Analysis Modules</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">99.9%</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Uptime</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent">&lt;2s</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Avg Response</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">24/7</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Monitoring</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Terminal Section */}
            <div className="py-24 bg-white dark:bg-[#050505] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <Badge variant="outline" className="mb-6 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 px-4 py-1.5 text-sm">Real-time Intelligence</Badge>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
                                See what others <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">miss in seconds.</span>
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                Our advanced scanning engine aggregates data from 15+ sources instantly.
                                Watch as we uncover hidden subdomains, expose vulnerable records, and map attack surfaces in real-time.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    "Instant DNS Propagation Checks",
                                    "Live SSL/TLS Vulnerability Scanning",
                                    "Automated Threat Scoring",
                                    "Historical WHOIS & Wayback Data"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center text-slate-700 dark:text-slate-300">
                                        <div className="mr-3 p-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl opacity-20 blur-2xl animate-pulse"></div>
                            <div className="relative rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans">
                                {/* Browser Toolbar */}
                                <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]/50">
                                    <div className="flex space-x-2 mr-4">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    </div>
                                    <div className="flex-1 bg-white dark:bg-[#0F172A] rounded-md px-3 py-1 text-xs text-slate-500 flex items-center justify-center border border-slate-200 dark:border-slate-700 font-mono">
                                        <Lock className="h-3 w-3 mr-2 text-green-500" /> https://Domainscope.gov.in
                                    </div>
                                </div>
                                {/* Dashboard Content */}
                                <div className="p-6 h-[320px] overflow-hidden bg-slate-50/50 dark:bg-[#0B1120]">
                                    {/* Result Header */}
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-xl border border-red-200 dark:border-red-500/30">
                                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">secure-update-bank.com</h3>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>Scanned Just Now</span>
                                                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 flex items-center gap-2 shadow-sm">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="font-bold text-red-700 dark:text-red-400">Score: 92 (Critical)</span>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                                                <Server className="h-4 w-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">IP Address</span>
                                            </div>
                                            <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white">185.220.101.4</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                                                <MapPin className="h-4 w-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">Panama City, PA</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                                                <Building className="h-4 w-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Registrar</span>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">Offshore Hosting</div>
                                        </div>
                                    </div>

                                    {/* Key Findings List */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 hover:border-red-500/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Domain Age</div>
                                                    <div className="text-xs text-slate-500">1 month 12 days</div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-xs border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10">New</Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 hover:border-purple-500/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                                    <Network className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">ISP</div>
                                                    <div className="text-xs text-slate-500">AS16509 Amazon.com, Inc.</div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10">Cloud</Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 hover:border-orange-500/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                                    <Activity className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">VPN/Proxy Detected</div>
                                                    <div className="text-xs text-slate-500">Traffic routed via anonymizer</div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10">Warning</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Use Cases Section */}
            <div className="py-24 bg-slate-50 dark:bg-[#080808] border-y border-slate-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Built for Every Security Professional</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Whether you're defending infrastructure or hunting for vulnerabilities, DomainScope adapts to your workflow.
                        </p>
                    </div>

                    <Tabs defaultValue="redteam" className="w-full max-w-4xl mx-auto">
                        <TabsList className="grid w-full grid-cols-3 mb-12 h-14 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl p-1">
                            <TabsTrigger value="redteam" className="rounded-lg text-base data-[state=active]:bg-red-600 data-[state=active]:text-white">Red Team</TabsTrigger>
                            <TabsTrigger value="blueteam" className="rounded-lg text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white">Blue Team</TabsTrigger>
                            <TabsTrigger value="bugbounty" className="rounded-lg text-base data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Bug Bounty</TabsTrigger>
                        </TabsList>
                        <TabsContent value="redteam" className="mt-0">
                            <Card className="border-0 shadow-2xl bg-white dark:bg-[#111] overflow-hidden">
                                <div className="grid md:grid-cols-2">
                                    <div className="p-8 md:p-12 flex flex-col justify-center">
                                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-6 text-red-600 dark:text-red-400">
                                            <Fingerprint className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Advanced Reconnaissance</h3>
                                        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                            Map the entire attack surface of a target organization. Discover forgotten subdomains, exposed development environments, and vulnerable assets before the adversary does.
                                        </p>
                                        <ul className="space-y-3">
                                            <li className="flex items-center text-slate-700 dark:text-slate-300"><CheckCircle2 className="h-5 w-5 mr-3 text-red-500" /> Automated Subdomain Enumeration</li>
                                            <li className="flex items-center text-slate-700 dark:text-slate-300"><CheckCircle2 className="h-5 w-5 mr-3 text-red-500" /> Tech Stack Fingerprinting</li>
                                            <li className="flex items-center text-slate-700 dark:text-slate-300"><CheckCircle2 className="h-5 w-5 mr-3 text-red-500" /> Vulnerability Correlation</li>
                                        </ul>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-[#0A0A0A] p-8 flex items-center justify-center border-l border-slate-200 dark:border-slate-800">
                                        <div className="relative w-full max-w-sm aspect-square bg-white dark:bg-[#151515] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
                                            <div className="h-2 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                            <div className="h-32 w-full bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 flex items-center justify-center">
                                                <Activity className="h-12 w-12 text-red-500/50" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
                                                <div className="h-2 w-5/6 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                                <div className="h-2 w-4/6 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                        <TabsContent value="blueteam" className="mt-0">
                            <Card className="border-0 shadow-2xl bg-white dark:bg-[#111] overflow-hidden">
                                <div className="grid md:grid-cols-2">
                                    <div className="p-8 md:p-12 flex flex-col justify-center">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Asset Monitoring & Defense</h3>
                                        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                            Keep track of your organization's digital footprint. Get alerted to new shadow IT, expiring certificates, and unauthorized DNS changes instantly.
                                        </p>
                                        <ul className="space-y-3">
                                            <li className="flex items-center text-slate-700 dark:text-slate-300"><CheckCircle2 className="h-5 w-5 mr-3 text-blue-500" /> Continuous Asset Monitoring</li>
                                            <li className="flex items-center text-slate-700 dark:text-slate-300"><CheckCircle2 className="h-5 w-5 mr-3 text-blue-500" /> Brand Protection</li>
                                            <li className="flex items-center text-slate-700 dark:text-slate-300"><CheckCircle2 className="h-5 w-5 mr-3 text-blue-500" /> Compliance Reporting</li>
                                        </ul>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-[#0A0A0A] p-8 flex items-center justify-center border-l border-slate-200 dark:border-slate-800">
                                        <div className="relative w-full max-w-sm aspect-square bg-white dark:bg-[#151515] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
                                            <div className="h-2 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                            <div className="h-32 w-full bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 flex items-center justify-center">
                                                <Shield className="h-12 w-12 text-blue-500/50" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
                                                <div className="h-2 w-5/6 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                        <TabsContent value="bugbounty" className="mt-0">
                            <Card className="border-0 shadow-2xl bg-white dark:bg-[#111] overflow-hidden">
                                <div className="grid md:grid-cols-2">
                                    <div className="p-8 md:p-12 flex flex-col justify-center">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                                            <Search className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Scope Analysis & Discovery</h3>
                                        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                            Quickly analyze scope for bug bounty programs. Filter out out-of-scope assets and focus on high-value targets with our bulk processing tools.
                                        </p>
                                        <ul className="space-y-3">
                                            <li className="flex items-center text-slate-700 dark:text-slate-300"><CheckCircle2 className="h-5 w-5 mr-3 text-emerald-500" /> Bulk Domain Processing</li>
                                            <li className="flex items-center text-slate-700 dark:text-slate-300"><CheckCircle2 className="h-5 w-5 mr-3 text-emerald-500" /> Rapid Scope Filtering</li>
                                            <li className="flex items-center text-slate-700 dark:text-slate-300"><CheckCircle2 className="h-5 w-5 mr-3 text-emerald-500" /> API Integration</li>
                                        </ul>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-[#0A0A0A] p-8 flex items-center justify-center border-l border-slate-200 dark:border-slate-800">
                                        <div className="relative w-full max-w-sm aspect-square bg-white dark:bg-[#151515] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
                                            <div className="h-2 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                            <div className="h-32 w-full bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20 flex items-center justify-center">
                                                <Database className="h-12 w-12 text-emerald-500/50" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
                                                <div className="h-2 w-5/6 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Features Grid */}
            <div className="relative py-20 bg-white/50 dark:bg-[#0A0A0A] backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Comprehensive OSINT Suite</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Advanced reconnaissance tools for complete digital asset monitoring and threat detection.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 - Extended DNS */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-blue-500/30">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Extended DNS Analysis</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Deep dive into DNS records including MX, TXT, SOA, and CAA. Analyze propagation and configuration.
                            </p>
                            <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Full record enumeration</span>
                            </div>
                        </div>

                        {/* Feature 2 - Email Security */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-indigo-500/30">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Email Security</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Validate SPF, DKIM, and DMARC configurations to prevent email spoofing and ensure deliverability.
                            </p>
                            <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Spoofing prevention</span>
                            </div>
                        </div>

                        {/* Feature 3 - SSL/TLS Analysis */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-amber-500/30">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">SSL/TLS Intelligence</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Analyze certificate chains, cipher suites, and validity. Detect vulnerabilities and misconfigurations.
                            </p>
                            <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Vulnerability detection</span>
                            </div>
                        </div>

                        {/* Feature 4 - Threat Intelligence */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-red-500/30">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Activity className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Advanced Threat Detection</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Proprietary threat scoring engine analyzing millions of data points to identify malicious activity and risks.
                            </p>
                            <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Real-time scoring</span>
                            </div>
                        </div>

                        {/* Feature 5 - HTTP Headers */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-emerald-500/30">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Server className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Header Security</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Analyze HTTP security headers (HSTS, CSP, X-Frame-Options) to ensure best practice implementation.
                            </p>
                            <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Security hardening</span>
                            </div>
                        </div>

                        {/* Feature 6 - Wayback Machine */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-purple-500/30">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <RefreshCw className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Historical Archives</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Access historical snapshots via Wayback Machine to track website changes and evolution over time.
                            </p>
                            <div className="flex items-center text-sm text-purple-600 dark:text-purple-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Time travel analysis</span>
                            </div>
                        </div>

                        {/* Feature 7 - Subdomain Discovery */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-cyan-500/30">
                            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Network className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Subdomain Discovery</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Discover hidden subdomains using Certificate Transparency logs and passive DNS data.
                            </p>
                            <div className="flex items-center text-sm text-cyan-600 dark:text-cyan-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Attack surface mapping</span>
                            </div>
                        </div>

                        {/* Feature 8 - Bulk Processing */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-pink-500/30">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Database className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Bulk Operations</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Scan hundreds of domains simultaneously with intelligent rate limiting and CSV export.
                            </p>
                            <div className="flex items-center text-sm text-pink-600 dark:text-pink-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Mass scaling</span>
                            </div>
                        </div>

                        {/* Feature 9 - Metadata & SEO */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-orange-500/30">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <FileSearch className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Metadata & SEO</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Extract meta tags, OpenGraph data, and technical stack information for competitive analysis.
                            </p>
                            <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Tech stack reveal</span>
                            </div>
                        </div>

                        {/* Feature 10 - Geolocation Intel */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-teal-500/30">
                            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <MapPin className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Global Geolocation</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Pinpoint server locations, identify hosting providers (ISPs), and map infrastructure globally.
                            </p>
                            <div className="flex items-center text-sm text-teal-600 dark:text-teal-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Physical mapping</span>
                            </div>
                        </div>

                        {/* Feature 11 - Infrastructure Analysis */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-lime-500/30">
                            <div className="w-12 h-12 bg-lime-100 dark:bg-lime-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Layers className="h-6 w-6 text-lime-600 dark:text-lime-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Infrastructure Analysis</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Deep inspection of server infrastructure, hosting providers, and network topology mapping.
                            </p>
                            <div className="flex items-center text-sm text-lime-600 dark:text-lime-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Network topology</span>
                            </div>
                        </div>

                        {/* Feature 12 - Blacklist Monitoring */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group hover:border-rose-500/30">
                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <AlertOctagon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Blacklist Monitoring</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Check domain reputation against 50+ major DNSBLs to ensure email deliverability and trust.
                            </p>
                            <div className="flex items-center text-sm text-rose-600 dark:text-rose-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Reputation checks</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Why Choose Us Section */}
            <div className="relative py-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0A0A0A] dark:to-black border-y border-slate-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Why Choose DomainScope?</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Built for security professionals who demand accuracy, speed, and reliability.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
                                <Zap className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Lightning Fast</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Progressive loading delivers results in stages, showing DNS data in under 2 seconds.
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                                <RefreshCw className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Always Reliable</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Automatic retry logic, fallback mechanisms, and robust error handling ensure success.
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                                <TrendingUp className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Constantly Improved</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Regular updates with enhanced features, performance improvements, and bug fixes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Reliability Section */}
            <div className="py-24 bg-white dark:bg-[#050505] relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">Uncompromising Data Integrity</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Multi-Source Verification",
                                description: "We never rely on a single data point. Our engine cross-references results from 15+ authoritative providers to eliminate false positives and ensure high-confidence intelligence.",
                                icon: CheckCircle2,
                                color: "text-blue-500"
                            },
                            {
                                title: "Real-Time Synchronization",
                                description: "Direct pipelines to Certificate Transparency logs and passive DNS sensors ensure you see subdomains and infrastructure changes the moment they happen, not days later.",
                                icon: RefreshCw,
                                color: "text-green-500"
                            },
                            {
                                title: "Transparent Sourcing",
                                description: "We believe in complete transparency. Every data point in your report is clearly attributed to its origin source, allowing your analysts to verify and trust the intelligence.",
                                icon: FileSearch,
                                color: "text-purple-500"
                            }
                        ].map((item, i) => (
                            <Card key={i} className="bg-slate-50 dark:bg-[#111] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                <CardContent className="pt-8 pb-8">
                                    <div className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 ${item.color}`}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{item.title}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {item.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="py-24 bg-slate-50 dark:bg-[#080808] border-t border-slate-200 dark:border-white/5">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-12">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-lg font-medium text-slate-900 dark:text-white">Why is DomainScope considered the best in class?</AccordionTrigger>
                            <AccordionContent className="text-slate-600 dark:text-slate-400">
                                Our platform is engineered for speed and security. By leveraging an event-driven architecture with Redis and BullMQ, we process data in parallel, delivering real-time intelligence milliseconds faster than competitors while ensuring enterprise-grade data protection.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="text-lg font-medium text-slate-900 dark:text-white">What key features are implemented?</AccordionTrigger>
                            <AccordionContent className="text-slate-600 dark:text-slate-400">
                                The platform features a custom-built subdomain discovery engine, real-time DNS propagation checks, and a proprietary threat scoring algorithm. It utilizes Redis for high-performance caching and BullMQ for handling asynchronous scan jobs efficiently.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="text-lg font-medium text-slate-900 dark:text-white">How does the system handle reliability?</AccordionTrigger>
                            <AccordionContent className="text-slate-600 dark:text-slate-400">
                                We implemented a robust Circuit Breaker pattern (using Opossum) to gracefully handle external API failures. Combined with intelligent exponential backoff and queue management, this ensures 99.9% reliability even during high load or upstream outages.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger className="text-lg font-medium text-slate-900 dark:text-white">Is this a scalable solution?</AccordionTrigger>
                            <AccordionContent className="text-slate-600 dark:text-slate-400">
                                Yes. The backend is designed with scalability in mind, using a stateless architecture that can be horizontally scaled. The use of Redis for state management and job queues allows the system to handle thousands of concurrent scans without performance degradation.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>

            {/* CTA Section */}
            <div className="relative py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                        {/* Smooth Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-blue-600"></div>

                        {/* Subtle decorative glow */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>

                        <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20 text-center">
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
                                Start Your Security Journey
                            </h2>
                            <p className="text-lg text-blue-50/90 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                                Join thousands of security professionals. Get instant access to powerful domain analysis tools today.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                {isAuthenticated ? (
                                    <Link to="/dashboard" className="w-full sm:w-auto">
                                        <Button size="lg" className="w-full h-12 px-8 text-base bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold rounded-xl">
                                            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/signup" className="w-full sm:w-auto">
                                            <Button size="lg" className="w-full h-12 px-8 text-base bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold rounded-xl">
                                                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link to="/login" className="w-full sm:w-auto">
                                            <Button size="lg" variant="outline" className="w-full h-12 px-8 text-base border-white/30 bg-white/10 text-white hover:bg-white/20 transition-all duration-300 font-semibold rounded-xl backdrop-blur-sm">
                                                Log In
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div >
    );
};

export default LandingPage;
