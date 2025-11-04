
import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Search, Database, FileText, Globe, Activity, Moon, Sun } from "lucide-react";
import DomainAnalysisCard from "@/components/DomainAnalysisCard";
import BulkScannerCard from "@/components/BulkScannerCard";
import ResultsPanel from "@/components/ResultsPanel";
import MetascraperResults from "@/components/MetascraperResults";
import VirusTotalResults from "@/components/VirusTotalResults";
import SecurityIntelPanel from "@/components/SecurityIntelPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [results, setResults] = useState([]);
  const [metascraperResults, setMetascraperResults] = useState([]);
  const [virusTotalResults, setVirusTotalResults] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // const [apiStatus, setApiStatus] = useState({ backend: null, virustotal: null });
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

  // Create callback functions that properly handle state updates
  const handleSingleResults = (newResult: any) => {
    setResults(prev => [newResult, ...prev]);
  };

  const handleMetascraperResults = (newResult: any) => {
    setMetascraperResults(prev => [newResult, ...prev]);
  };

  const handleVirusTotalResults = (newResult: any) => {
    setVirusTotalResults(prev => [newResult, ...prev]);
  };

  const handleBulkResults = (newResult: any) => {
    setResults(prev => [newResult, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 dark:from-slate-900 dark:via-blue-950 dark:to-red-950 transition-all duration-700">
      {/* Header */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-blue-200 dark:border-red-800 sticky top-0 z-50 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title Section */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="bg-gradient-to-br from-red-600 to-blue-600 p-2.5 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex-shrink-0">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent leading-tight truncate">
                  Domain Scope
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-tight">
                  OSINT • DNS • WHOIS • Security
                </p>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                onClick={toggleDarkMode}
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg hover:scale-105 transition-all duration-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-red-400 hover:shadow-md"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4 text-blue-600" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Features Overview (hidden on small screens) */}
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-6">
          {[
            { icon: Search, label: "WHOIS & Ownership", color: "text-red-600", bg: "bg-red-100 dark:bg-red-950" },
            { icon: Globe, label: "DNS & Infra Map", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950" },
            { icon: Database, label: "IP • Geo • ISP", color: "text-red-500", bg: "bg-red-100 dark:bg-red-950" },
            { icon: Shield, label: "Abuse Score (IPDB)", color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-950" },
            { icon: Activity, label: "VirusTotal Security", color: "text-red-600", bg: "bg-red-100 dark:bg-red-950" },
            { icon: FileText, label: "Metadata", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950" },
          ].map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-xl transition-all duration-500 hover:scale-105 border-transparent hover:border-gradient-to-r hover:from-red-200 hover:to-blue-200 group animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-2 sm:p-4">
                <div className={`h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 rounded-xl ${feature.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-4 w-4 sm:h-6 sm:w-6 ${feature.color}`} />
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {feature.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-4 sm:mb-6 bg-gradient-to-r from-red-100 to-blue-100 dark:from-red-950 dark:to-blue-950 p-1 rounded-xl w-fit mx-auto animate-fade-in">
          <Button
            variant={activeTab === 'single' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('single')}
            className={`rounded-lg transition-all duration-300 text-xs sm:text-sm ${activeTab === 'single' 
              ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white shadow-lg hover:scale-105' 
              : 'hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Single Domain
          </Button>
          <Button
            variant={activeTab === 'bulk' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('bulk')}
            className={`rounded-lg transition-all duration-300 text-xs sm:text-sm ${activeTab === 'bulk' 
              ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white shadow-lg hover:scale-105' 
              : 'hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Bulk Scanner
          </Button>
        </div>

        {/* Main Content Area (centered) */}
        <div className="space-y-6">
          {/* Scanner Panel - centered */}
          <div className="max-w-6xl mx-auto w-full animate-slide-in-right">
            {activeTab === 'single' ? (
              <DomainAnalysisCard 
                onResults={handleSingleResults} 
                onMetascraperResults={handleMetascraperResults}
                onVirusTotalResults={handleVirusTotalResults}
              />
            ) : (
              <BulkScannerCard 
                onResults={handleBulkResults}
                onMetascraperResults={handleMetascraperResults}
                onVirusTotalResults={handleVirusTotalResults}
              />
            )}
          </div>

          {/* Results - centered wide */}
          <div className="max-w-6xl mx-auto w-full space-y-6 animate-slide-in-right" style={{ animationDelay: '200ms' }}>
            {/* Backend Results */}
            <ResultsPanel 
              results={results} 
              vtSummaryByDomain={useMemo(() => {
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
              }, [virusTotalResults])}
            />

            {/* VirusTotal Results - Moved to second position */}
            <VirusTotalResults results={virusTotalResults} />

            {/* Security Intelligence: IPQS + AbuseIPDB + DNSBL */}
            <SecurityIntelPanel results={results as any} />

            {/* Metascraper Results - Moved to last position */}
            <MetascraperResults results={metascraperResults} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-200 dark:border-red-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-red-50 to-blue-50 dark:from-red-950/40 dark:to-blue-950/40 border border-red-200/50 dark:border-blue-800/50 hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent mb-4">Analysis includes</h3>
              <ul className="space-y-2 text-sm sm:text-base text-slate-700 dark:text-slate-300">
                <li className="transition-colors duration-300 hover:text-red-600 dark:hover:text-blue-400">• WHOIS registration data</li>
                <li className="transition-colors duration-300 hover:text-blue-600 dark:hover:text-red-400">• DNS record information</li>
                <li className="transition-colors duration-300 hover:text-red-600 dark:hover:text-blue-400">• IP geolocation & ASN</li>
                <li className="transition-colors duration-300 hover:text-blue-600 dark:hover:text-red-400">• Security reputation check</li>
                <li className="transition-colors duration-300 hover:text-red-600 dark:hover:text-blue-400">• VPN/Proxy detection</li>
                <li className="transition-colors duration-300 hover:text-blue-600 dark:hover:text-red-400">• VirusTotal security analysis</li>
                <li className="transition-colors duration-300 hover:text-red-600 dark:hover:text-blue-400">• Webpage metadata extraction</li>
              </ul>
            </div>
            <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-blue-50 to-red-50 dark:from-blue-950/40 dark:to-red-950/40 border border-blue-200/50 dark:border-red-800/50 hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent mb-4">Bulk scan features</h3>
              <ul className="space-y-2 text-sm sm:text-base text-slate-700 dark:text-slate-300">
                <li className="transition-colors duration-300 hover:text-blue-600 dark:hover:text-red-400">• Bulk Scanning via Text Imports</li>
                <li className="transition-colors duration-300 hover:text-red-600 dark:hover:text-blue-400">• Real-time progress tracking</li>
                <li className="transition-colors duration-300 hover:text-blue-600 dark:hover:text-red-400">• Failed lookup logging</li>
                <li className="transition-colors duration-300 hover:text-red-600 dark:hover:text-blue-400">• CSV export with domain age</li>
                <li className="transition-colors duration-300 hover:text-blue-600 dark:hover:text-red-400">• Comprehensive reporting</li>
                <li className="transition-colors duration-300 hover:text-red-600 dark:hover:text-blue-400">• Parallel batching for speed</li>
                <li className="transition-colors duration-300 hover:text-blue-600 dark:hover:text-red-400">• Per-domain status & timing</li>
              </ul>
            </div>
          </div>
          <div className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-8 space-y-1">
            <div>© {new Date().getFullYear()} Domain Scope</div>
            <div>
              Built by <span className="font-semibold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">Vaishnav K</span> •
              {' '}
              <a
                href="https://github.com/vaishnav4281"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                github.com/vaishnav4281
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
