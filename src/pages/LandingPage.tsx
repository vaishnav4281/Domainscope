import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Shield, Globe, Database, Activity, ArrowRight, CheckCircle2, Lock, Zap, Sun, Moon, LayoutDashboard, Menu, LogIn, UserPlus, Network, FileSearch, RefreshCw, Smartphone, Server, TrendingUp, MapPin, Clock, AlertOctagon, Layers } from 'lucide-react';
import ThreeBackground from '@/components/ThreeBackground';
import { useAuth } from '@/context/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import Footer from '@/components/Footer';

import SEO from '@/components/SEO';

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 relative overflow-hidden font-sans flex flex-col">
            <SEO
                title="DomainScope"
                description="Advanced domain intelligence platform built by an expert Software Engineer. Features WHOIS, DNS, Threat Intel, and more."
            />
            {/* Three.js 3D Background */}
            <ThreeBackground />

            {/* Animated gradient background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] via-purple-500/[0.02] to-blue-500/[0.03] dark:from-red-500/[0.05] dark:via-purple-500/[0.03] dark:to-blue-500/[0.05] animate-gradient" />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.02] via-transparent to-red-500/[0.02] dark:from-blue-500/[0.04] dark:via-transparent dark:to-red-500/[0.04] animate-gradient" style={{ animationDelay: '1s', animationDuration: '4s' }} />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
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

            {/* Hero Section */}
            <div className="relative pt-20 pb-16 sm:pt-32 sm:pb-24 overflow-hidden flex-grow flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 mb-8 animate-fade-in-up">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-600 mr-2 animate-pulse"></span>
                        Intelligence Built for Speed, Reliability & Security
                    </div>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8 animate-fade-in-up animation-delay-100">
                        <span className="block mb-2">Master Your</span>
                        <span className="bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Domain Intelligence
                        </span>
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-xl sm:text-2xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
                        Empowering security teams with advanced OSINT tools for comprehensive digital asset monitoring, subdomain discovery, and real-time threat detection.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up animation-delay-300">
                        {isAuthenticated ? (
                            <Link to="/dashboard">
                                <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-full w-full sm:w-auto">
                                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/signup">
                                    <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-full w-full sm:w-auto">
                                        Start Scanning Free <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition-all duration-300 rounded-full w-full sm:w-auto">
                                        Login
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="relative py-12 bg-gradient-to-r from-red-600/5 via-purple-600/5 to-blue-600/5 dark:from-red-600/10 dark:via-purple-600/10 dark:to-blue-600/10 border-y border-slate-200/50 dark:border-slate-800/50">
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

            {/* Features Grid */}
            <div className="relative py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Comprehensive OSINT Suite</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Advanced reconnaissance tools for complete digital asset monitoring and threat detection.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 - Extended DNS */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
            <div className="relative py-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-y border-slate-200 dark:border-slate-800">
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
        </div>
    );
};

export default LandingPage;
