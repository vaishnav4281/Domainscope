
import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Search, Database, FileText, Globe, Activity, Moon, Sun, LogOut, History as HistoryIcon, Download, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import DomainAnalysisCard from "@/components/DomainAnalysisCard";
import BulkScannerCard from "@/components/BulkScannerCard";
import ResultsPanel from "@/components/ResultsPanel";
import MetascraperResults from "@/components/MetascraperResults";
import VirusTotalResults from "@/components/VirusTotalResults";
import SecurityIntelPanel from "@/components/SecurityIntelPanel";
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
import { API_BASE_URL } from '../config';

const Index = () => {
  const { token, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'history'>('single');
  const [history, setHistory] = useState<any[]>([]);
  const [results, setResults] = useState([]);
  const [metascraperResults, setMetascraperResults] = useState([]);
  const [virusTotalResults, setVirusTotalResults] = useState([]);
  const [subdomainResults, setSubdomainResults] = useState<any>(null);
  const [enabledModules, setEnabledModules] = useState({
    core: true,
    security: true,
    subdomains: true,
    virustotal: true,
    metadata: true,
    extendedDns: true,
    emailSecurity: true,
    ssl: true,
    headers: true,
    threatIntel: true,
    wayback: true,
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  // API status check
  // useEffect(() => {
  //   const checkApis = async () => {
  //     // Backend check
  //     let backendUp = false;
  //     try {
  //       const backendUrl = import.meta.env.VITE_API_BASE || "https://whois-aoi.onrender.com";
  //       const res = await fetch(backendUrl + "/health", { method: "GET" });
  //       backendUp = res.ok;
  //     } catch {
  //       backendUp = false;
  //     }
  //     // VirusTotal check
  //     let vtUp = false;
  //     try {
  //       const vtKey = import.meta.env.VITE_VIRUSTOTAL_API_KEY;
  //       const vtRes = await fetch("https://www.virustotal.com/api/v3/domains/google.com", {
  //         headers: { "x-apikey": vtKey },
  //       });
  //       vtUp = vtRes.ok;
  //     } catch {
  //       vtUp = false;
  //     }
  //     setApiStatus({ backend: backendUp, virustotal: vtUp });
  //   };
  //   checkApis();
  //   const interval = setInterval(checkApis, 60000);
  //   return () => clearInterval(interval);
  // }, []);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
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

  const saveHistory = async (target: string, result: any) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target, result })
      });
      if (res.status === 401) {
        logout();
        return;
      }
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

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

  const downloadHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/history/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scan_history.csv';
        a.click();
      }
    } catch (e) {
      console.error('Failed to download history', e);
    }
  };

  const clearHistory = async () => {
    if (!token) return;
    // Confirmation handled by AlertDialog
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/history`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        setHistory([]);
      }
    } catch (e) {
      console.error('Failed to clear history', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Create callback functions that properly handle state updates
  const handleSingleResults = (newResult: any) => {
    setResults(prev => [newResult, ...prev]);
    saveHistory(newResult.domain || newResult.ip, newResult);
  };

  const handleMetascraperResults = (newResult: any) => {
    setMetascraperResults(prev => [newResult, ...prev]);
  };

  const handleVirusTotalResults = (newResult: any) => {
    setVirusTotalResults(prev => [newResult, ...prev]);
  };

  const handleSubdomainResults = (newResult: any) => {
    setSubdomainResults(newResult);
  };

  const handleBulkResults = (newResult: any) => {
    setResults(prev => [newResult, ...prev]);
    saveHistory(newResult.domain || newResult.ip, newResult);
  };

  const vtSummaryByDomain = useMemo(() => {
    const map: Record<string, { reputation?: number; malicious?: number; suspicious?: number; harmless?: number; risk_level?: string; }> = {};
    (virusTotalResults || []).forEach((r: any) => {
      if (!r || !r.domain) return;
      const stats = r.last_analysis_stats || {};
      map[r.domain] = {
        reputation: typeof r.reputation === 'number' ? r.reputation : undefined,
        malicious: typeof stats.malicious === 'number' ? stats.malicious : undefined,
        suspicious: typeof stats.suspicious === 'number' ? stats.suspicious : undefined,
        harmless: typeof stats.harmless === 'number' ? stats.harmless : undefined,
        risk_level: r.risk_level,
      };
    });
    return map;
  }, [virusTotalResults]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 relative overflow-hidden">


      {/* Animated gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] via-purple-500/[0.02] to-blue-500/[0.03] dark:from-red-500/[0.05] dark:via-purple-500/[0.03] dark:to-blue-500/[0.05] animate-gradient" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.02] via-transparent to-red-500/[0.02] dark:from-blue-500/[0.04] dark:via-transparent dark:to-red-500/[0.04] animate-gradient" style={{ animationDelay: '1s', animationDuration: '4s' }} />
      </div>

      {/* Header - Optimized spacing */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-br from-red-600 to-blue-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg shadow-red-500/20 dark:shadow-red-500/30">
                <Shield className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                DomainScope
              </h1>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{user?.email}</span>
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 shadow-sm"
              >
                {isDarkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />}
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium shadow-lg shadow-red-500/30 text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-10 md:py-12 space-y-8 sm:space-y-12 relative">
        {/* Hero section - centered and interactive */}
        <div className="relative text-center px-3 sm:px-4 lg:px-6 pt-10 sm:pt-16 pb-8 sm:pb-10 max-w-6xl mx-auto animate-fade-in">
          {/* Elegant gradient background */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/3 w-96 h-96 bg-gradient-to-br from-red-500/10 via-rose-400/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute top-20 right-1/3 w-96 h-96 bg-gradient-to-br from-blue-600/10 via-blue-400/5 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="relative space-y-3 sm:space-y-5 max-w-3xl mx-auto text-center">
            {/* Premium Typography - Clean and Simple */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1] px-2 animate-fade-in" style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif", animationDelay: '100ms' }}>
              <span className="block mb-1 sm:mb-2">Domain Intelligence</span>
              <span className="bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                Redefined
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
              Enterprise-grade threat analysis and security intelligence platform
            </p>
          </div>
        </div>

        {/* Feature Showcase Section - Enhanced with animations */}
        <div className="relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-2xl hover:shadow-3xl transition-shadow duration-500 animate-scale-in" style={{ animationDelay: '300ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* WHOIS Details */}
            <div className="group relative bg-gradient-to-br from-red-50 to-white dark:from-red-900/10 dark:to-slate-800 p-6 rounded-2xl border border-red-200 dark:border-red-800/50 hover:border-red-400 dark:hover:border-red-600 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg group-hover:shadow-red-500/50 transition-shadow duration-300">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">WHOIS Details</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Registrar information, creation/expiry dates, and complete contact details
              </p>
            </div>

            {/* DNS Records */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-slate-800 p-6 rounded-2xl border border-blue-200 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg group-hover:shadow-blue-500/50 transition-shadow duration-300">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">DNS Records</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Complete A, MX, NS, TXT, and CNAME record analysis
              </p>
            </div>

            {/* Passive DNS */}
            <div className="group relative bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-slate-800 p-6 rounded-2xl border border-purple-200 dark:border-purple-800/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '250ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg group-hover:shadow-purple-500/50 transition-shadow duration-300">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Passive DNS</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Historical IP resolutions and domain association tracking
              </p>
            </div>

            {/* IP & ASN Data */}
            <div className="group relative bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-slate-800 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg group-hover:shadow-emerald-500/50 transition-shadow duration-300">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">IP & ASN Data</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Geolocation, ISP details, and organization information
              </p>
            </div>

            {/* Threat Scores */}
            <div className="group relative bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-slate-800 p-6 rounded-2xl border border-orange-200 dark:border-orange-800/50 hover:border-orange-400 dark:hover:border-orange-600 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '350ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 shadow-lg group-hover:shadow-orange-500/50 transition-shadow duration-300">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Threat Scores</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                VirusTotal, IPQS, and AbuseIPDB real-time threat checks
              </p>
            </div>

            {/* Security Signals */}
            <div className="group relative bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/10 dark:to-slate-800 p-6 rounded-2xl border border-rose-200 dark:border-rose-800/50 hover:border-rose-400 dark:hover:border-rose-600 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 shadow-lg group-hover:shadow-rose-500/50 transition-shadow duration-300">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Security Signals</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                VPN/Proxy/Tor detection and DNSBL blacklist status
              </p>
            </div>

            {/* Domain Metadata */}
            <div className="group relative bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/10 dark:to-slate-800 p-6 rounded-2xl border border-cyan-200 dark:border-cyan-800/50 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '450ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-700 shadow-lg group-hover:shadow-cyan-500/50 transition-shadow duration-300">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Domain Metadata</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Tech stack, hosting info, and site description analysis
              </p>
            </div>

            {/* Bulk Exports */}
            <div className="group relative bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/10 dark:to-slate-800 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg group-hover:shadow-indigo-500/50 transition-shadow duration-300">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Bulk Exports</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Full CSV reports for comprehensive workflow integration
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8 sm:space-y-10">
          {/* Tabs - Clean and professional */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              {[
                { id: 'single', label: 'Single Scan', icon: Search },
                { id: 'bulk', label: 'Bulk Scanner', icon: Database },
                { id: 'history', label: 'Scan History', icon: HistoryIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    relative flex items-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scanner Panel - centered */}
          <div className="max-w-6xl mx-auto w-full animate-slide-in-right">
            {activeTab === 'single' ? (
              <DomainAnalysisCard
                onResults={handleSingleResults}
                onMetascraperResults={handleMetascraperResults}
                onVirusTotalResults={handleVirusTotalResults}
                onSubdomainResults={handleSubdomainResults}
                enabledModules={enabledModules}
                setEnabledModules={setEnabledModules}
              />
            ) : activeTab === 'bulk' ? (
              <BulkScannerCard
                onResults={handleBulkResults}
                onMetascraperResults={handleMetascraperResults}
                onVirusTotalResults={handleVirusTotalResults}
                onSubdomainResults={handleSubdomainResults}
                enabledModules={enabledModules}
                setEnabledModules={setEnabledModules}
              />
            ) : (
              <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">Scan History</h2>
                    <div className="flex space-x-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear History
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-slate-900 border-red-200 dark:border-red-900">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600 dark:text-red-500">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                              This action cannot be undone. This will permanently delete your entire scan history from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-slate-200 dark:border-slate-700">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={clearHistory} className="bg-red-600 hover:bg-red-700 text-white border-0">
                              Delete History
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 group hover:border-blue-300 dark:hover:border-blue-700">
                        <div className="flex items-center space-x-4">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-800 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            {item.type === 'bulk' ? <Database className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{item.target}</div>
                          </div>
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 flex items-center bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 group-hover:border-green-300 dark:group-hover:border-green-700 transition-colors duration-300">
                          <HistoryIcon className="h-3 w-3 mr-1.5" />
                          {new Date(item.createdAt).toLocaleString()}
                        </div>

                      </div>
                    ))}
                    {history.length === 0 && (
                      <div className="text-center text-slate-500 py-8">No scan history found.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results - centered wide */}
          {activeTab !== 'history' && (
            <div className="max-w-6xl mx-auto w-full space-y-6 animate-slide-in-right" style={{ animationDelay: '200ms' }}>
              {/* Backend Results */}
              <ResultsPanel
                results={results}
                vtSummaryByDomain={vtSummaryByDomain}
              />

              {/* VirusTotal Results - Moved to second position */}
              <VirusTotalResults results={virusTotalResults} />

              {/* Security Intelligence: IPQS + AbuseIPDB + DNSBL */}
              <SecurityIntelPanel results={results as any} />

              {/* Metascraper Results - Moved to last position */}
              <MetascraperResults results={metascraperResults} />
            </div>
          )}
        </div>
      </main>

      {/* Footer - Balanced spacing */}
      <footer className="relative border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        {/* Subtle gradient accents */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-red-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-600/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-10 sm:py-14 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Analysis features card */}
            <div className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-xl hover:shadow-2xl hover:border-red-500/50 dark:hover:border-red-500/50 transition-all duration-500 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl sm:rounded-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-red-600 to-red-700 shadow-lg">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">Analysis Includes</h3>
                </div>
                <ul className="space-y-3 text-sm sm:text-base text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-red-600 dark:hover:text-red-400">
                    <span className="text-red-500">✦</span> <strong>WHOIS Data:</strong> Registrar tracking, domain age, expiry alerts
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-blue-600 dark:hover:text-blue-400">
                    <span className="text-blue-500">✦</span> <strong>DNS Records:</strong> A, AAAA, MX, NS, TXT, CNAME resolution
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-red-600 dark:hover:text-red-400">
                    <span className="text-red-500">✦</span> <strong>IP Intelligence:</strong> ASN lookup, geolocation, ISP identification
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-blue-600 dark:hover:text-blue-400">
                    <span className="text-blue-500">✦</span> <strong>Threat Scoring:</strong> VirusTotal, IPQS, AbuseIPDB integration
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-red-600 dark:hover:text-red-400">
                    <span className="text-red-500">✦</span> <strong>Security Signals:</strong> VPN/Proxy/Tor, DNSBL blacklist checks
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-blue-600 dark:hover:text-blue-400">
                    <span className="text-blue-500">✦</span> <strong>Passive DNS:</strong> Historical IP resolutions, domain history
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-red-600 dark:hover:text-red-400">
                    <span className="text-red-500">✦</span> <strong>Web Metadata:</strong> Tech stack, hosting provider, SEO data
                  </li>
                </ul>
              </div>
            </div>

            {/* Bulk scan features card */}
            <div className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-xl hover:shadow-2xl hover:border-blue-600/50 dark:hover:border-blue-600/50 transition-all duration-500 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl sm:rounded-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                    <Database className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Bulk Scan Features</h3>
                </div>
                <ul className="space-y-3 text-sm sm:text-base text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-blue-600 dark:hover:text-blue-400">
                    <span className="text-blue-500">✦</span> <strong>Mass Analysis:</strong> Process hundreds of domains simultaneously
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-red-600 dark:hover:text-red-400">
                    <span className="text-red-500">✦</span> <strong>Live Progress:</strong> Real-time status updates for each domain
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-blue-600 dark:hover:text-blue-400">
                    <span className="text-blue-500">✦</span> <strong>Error Handling:</strong> Automatic retry and failure tracking
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-red-600 dark:hover:text-red-400">
                    <span className="text-red-500">✦</span> <strong>CSV Export:</strong> Full data export with timestamps & metrics
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-blue-600 dark:hover:text-blue-400">
                    <span className="text-blue-500">✦</span> <strong>Smart Reports:</strong> Aggregated threat intelligence summaries
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-red-600 dark:hover:text-red-400">
                    <span className="text-red-500">✦</span> <strong>Performance:</strong> Parallel processing for maximum speed
                  </li>
                  <li className="flex items-center gap-2 transition-all duration-300 hover:translate-x-2 hover:text-blue-600 dark:hover:text-blue-400">
                    <span className="text-blue-500">✦</span> <strong>Monitoring:</strong> Per-domain timing and success metrics
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Credits */}
          <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-10 sm:mt-12 space-y-2">
            <div className="font-medium">© {new Date().getFullYear()} DomainScope — Advanced Threat Intelligence Platform</div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span>Developed by</span>
              <span className="font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">Vaishnav K</span>
              <span>•</span>
              <a
                href="https://github.com/vaishnav4281"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline hover:scale-105 transition-all duration-300"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
              <span>•</span>
              <a
                href="https://www.linkedin.com/in/va1shnav"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline hover:scale-105 transition-all duration-300"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
