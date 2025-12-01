import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Shield, Globe, Database, Activity, ArrowRight, CheckCircle2, Lock, Zap, Sun, Moon, LayoutDashboard, Menu, LogIn, UserPlus } from 'lucide-react';
import ThreeBackground from '@/components/ThreeBackground';
import { useAuth } from '@/context/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import Footer from '@/components/Footer';

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 relative overflow-hidden font-sans flex flex-col">
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
                    <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-8 animate-fade-in-up">
                        <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                        New: Advanced Threat Intelligence
                    </div>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8 animate-fade-in-up animation-delay-100">
                        <span className="block mb-2">Master Your</span>
                        <span className="bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Domain Intelligence
                        </span>
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-xl sm:text-2xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
                        Empowering security teams with advanced OSINT tools for comprehensive digital asset monitoring and threat detection.
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

            {/* Features Grid */}
            <div className="relative py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Enterprise-Grade Features</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Everything you need to analyze domains, track threats, and monitor infrastructure.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Deep DNS Analysis</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Complete DNS record enumeration including A, AAAA, MX, NS, TXT, and CNAME records with propagation checks.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Threat Intelligence</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Real-time integration with VirusTotal, AbuseIPDB, and IPQS to detect malicious domains and reputation risks.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Bulk Processing</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Analyze hundreds of domains simultaneously with our high-performance bulk scanner and export results to CSV.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Passive DNS</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Uncover historical infrastructure changes and track domain movements across different IP addresses over time.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Lock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Security Scoring</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Comprehensive risk assessment scoring based on multiple security factors and threat indicators.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Zap className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Fast & Reliable</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Built on a modern tech stack for lightning-fast results, with 99.9% uptime and robust error handling.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="relative py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                        Start Your Security Journey Today
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 mb-10">
                        Get instant access to powerful domain analysis tools and protect your digital infrastructure.
                    </p>
                    {isAuthenticated ? (
                        <Link to="/dashboard">
                            <Button size="lg" className="h-14 px-10 text-lg bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                                Go to Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <Link to="/signup">
                            <Button size="lg" className="h-14 px-10 text-lg bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                                Get Started for Free
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default LandingPage;
