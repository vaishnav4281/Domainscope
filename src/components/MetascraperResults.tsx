import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Image, User, Calendar, Building2, Link as LinkIcon, Tag, Code, Rss, Twitter, FileText, Settings, Award, Hash, Clock, Eye } from "lucide-react";

interface MetascraperData {
  id: number;
  domain: string;
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  publisher?: string;
  date?: string;
  modifiedDate?: string;
  image?: string;
  imageAlt?: string;
  favicon?: string;
  logo?: string;
  url?: string;
  lang?: string;
  type?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  category?: string;
  tags?: string;
  robots?: string;
  viewport?: string;
  themeColor?: string;
  charset?: string;
  generator?: string;
  rssFeed?: string;
  atomFeed?: string;
  schemaType?: string;
  jsonLd?: any[];
  completenessScore?: number;
  timestamp: string;
  error?: string;
}

interface MetascraperResultsProps {
  results: MetascraperData[];
}

const MetascraperResults = ({ results }: MetascraperResultsProps) => {
  const getScoreBadge = (score: number) => {
    if (score >= 70) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  };

  return (
    <Card className="h-fit border-0 shadow-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
      <CardHeader className="bg-gradient-to-r from-pink-600/10 via-purple-600/10 to-emerald-600/10 border-b border-slate-200/50 dark:border-zinc-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg shadow-pink-500/20 ring-1 ring-white/20">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Metadata Analysis
            </span>
            <Badge className="bg-white/50 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 backdrop-blur-sm shadow-sm">
              {results.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-zinc-900/50">
        {results.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800/50 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center shadow-inner">
              <Globe className="h-10 w-10 sm:h-12 sm:w-12 text-pink-300 dark:text-zinc-600" />
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-2">No metadata yet</p>
            <p className="text-slate-500 dark:text-zinc-400">Metascraper results will appear here after domain analysis</p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div
                key={result.id}
                className="group relative overflow-hidden border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-lg hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 hover:scale-[1.01] animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Header with Risk Level */}
                <div className="relative p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30 transition-colors ring-1 ring-pink-100 dark:ring-pink-800">
                      <Globe className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white break-all tracking-tight">
                        {result.domain}
                      </h3>
                      {result.type && (
                        <Badge className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs shadow-sm mt-1">
                          {result.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {result.completenessScore !== undefined && (
                      <div className="flex items-center space-x-2 bg-slate-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-zinc-700">
                        <Award className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <Badge className={`text-xs font-medium border-0 ${getScoreBadge(result.completenessScore)}`}>
                          Completeness: {result.completenessScore}%
                        </Badge>
                      </div>
                    )}
                    {result.lang && (
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs shadow-sm">
                        {result.lang.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {result.error && (
                  <div className="m-5 sm:m-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <strong>Error:</strong> {result.error}
                    </p>
                  </div>
                )}

                {!result.error && (
                  <div className="p-5 sm:p-6">
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="w-full h-auto flex flex-wrap justify-start bg-slate-100/50 dark:bg-zinc-800/50 p-1.5 rounded-xl gap-1">
                        <TabsTrigger value="basic" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Basic</TabsTrigger>
                        <TabsTrigger value="social" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Social</TabsTrigger>
                        <TabsTrigger value="content" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Content</TabsTrigger>
                        <TabsTrigger value="tech" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Tech</TabsTrigger>
                        <TabsTrigger value="media" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Media</TabsTrigger>
                        <TabsTrigger value="schema" className="text-xs sm:text-sm px-3 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm transition-all">Schema</TabsTrigger>
                      </TabsList>

                      {/* BASIC TAB */}
                      <TabsContent value="basic" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3.5 bg-pink-50/50 dark:bg-pink-900/10 rounded-xl border border-pink-100 dark:border-pink-800/50 hover:border-pink-300 dark:hover:border-pink-700 transition-colors group/item">
                            <span className="font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-2.5">
                              <div className="p-1.5 bg-pink-100 dark:bg-pink-900/50 rounded-lg text-pink-600 dark:text-pink-400 group-hover/item:scale-110 transition-transform">
                                <Globe className="h-3.5 w-3.5" />
                              </div>
                              Title
                            </span>
                            <span className="text-slate-900 dark:text-white font-semibold text-right break-all max-w-[60%] truncate">{result.title || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col space-y-2 p-4 bg-pink-50/50 dark:bg-pink-900/10 rounded-xl border border-pink-100 dark:border-pink-800/50 hover:border-pink-300 dark:hover:border-pink-700 transition-colors group/item">
                            <span className="font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-2.5">
                              <div className="p-1.5 bg-pink-100 dark:bg-pink-900/50 rounded-lg text-pink-600 dark:text-pink-400 group-hover/item:scale-110 transition-transform">
                                <FileText className="h-3.5 w-3.5" />
                              </div>
                              Description
                            </span>
                            <span className="text-slate-900 dark:text-white text-sm leading-relaxed pl-8">{result.description || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3.5 bg-rose-50/50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-800/50 hover:border-rose-300 dark:hover:border-rose-700 transition-colors group/item">
                            <span className="font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-2.5">
                              <div className="p-1.5 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400 group-hover/item:scale-110 transition-transform">
                                <Tag className="h-3.5 w-3.5" />
                              </div>
                              Completeness
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-rose-200 dark:bg-rose-900 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{ width: `${result.completenessScore || 0}%` }}
                                />
                              </div>
                              <span className="text-slate-900 dark:text-white font-bold">{result.completenessScore || 0}%</span>
                            </div>
                          </div>
                        </div>
                        {result.url && (
                          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <LinkIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Canonical URL</p>
                            </div>
                            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline truncate block">
                              {result.url}
                            </a>
                          </div>
                        )}

                        {result.keywords && (
                          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Hash className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Keywords</p>
                            </div>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">{result.keywords}</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* SOCIAL TAB */}
                      <TabsContent value="social" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {result.twitterCard && (
                          <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                            <div className="flex items-center space-x-2 mb-3">
                              <Twitter className="h-4 w-4 text-blue-500" />
                              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Twitter Card Data</p>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between border-b border-blue-100 dark:border-blue-800/30 pb-2"><span className="text-slate-500 dark:text-zinc-400">Card Type</span> <span className="font-medium text-slate-700 dark:text-zinc-200">{result.twitterCard}</span></div>
                              {result.twitterSite && <div className="flex justify-between border-b border-blue-100 dark:border-blue-800/30 pb-2"><span className="text-slate-500 dark:text-zinc-400">Site</span> <span className="font-medium text-slate-700 dark:text-zinc-200">{result.twitterSite}</span></div>}
                              {result.twitterCreator && <div className="flex justify-between"><span className="text-slate-500 dark:text-zinc-400">Creator</span> <span className="font-medium text-slate-700 dark:text-zinc-200">{result.twitterCreator}</span></div>}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {result.author && (
                            <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/50">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Author</p>
                              </div>
                              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{result.author}</p>
                            </div>
                          )}

                          {result.publisher && (
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Publisher</p>
                              </div>
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{result.publisher}</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* CONTENT TAB */}
                      <TabsContent value="content" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {result.date && (
                            <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Published Date</p>
                              </div>
                              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{new Date(result.date).toLocaleDateString()}</p>
                            </div>
                          )}

                          {result.modifiedDate && (
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Modified Date</p>
                              </div>
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{new Date(result.modifiedDate).toLocaleDateString()}</p>
                            </div>
                          )}

                          {result.category && (
                            <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Tag className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Category</p>
                              </div>
                              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{result.category}</p>
                            </div>
                          )}

                          {result.tags && (
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Article Tags</p>
                              </div>
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{result.tags}</p>
                            </div>
                          )}
                        </div>

                        {(result.rssFeed || result.atomFeed) && (
                          <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/50">
                            <div className="flex items-center space-x-2 mb-2">
                              <Rss className="h-4 w-4 text-orange-500" />
                              <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">RSS/Atom Feeds</p>
                            </div>
                            {result.rssFeed && (
                              <a href={result.rssFeed} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 hover:underline block mb-1">
                                RSS: {result.rssFeed}
                              </a>
                            )}
                            {result.atomFeed && (
                              <a href={result.atomFeed} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 hover:underline block">
                                Atom: {result.atomFeed}
                              </a>
                            )}
                          </div>
                        )}
                      </TabsContent>

                      {/* TECH TAB */}
                      <TabsContent value="tech" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {result.generator && (
                            <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Code className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Generator/CMS</p>
                              </div>
                              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{result.generator}</p>
                            </div>
                          )}

                          {result.robots && (
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Robots</p>
                              </div>
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{result.robots}</p>
                            </div>
                          )}

                          {result.charset && (
                            <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Code className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Charset</p>
                              </div>
                              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{result.charset}</p>
                            </div>
                          )}

                          {result.viewport && (
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Viewport</p>
                              </div>
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 text-xs">{result.viewport}</p>
                            </div>
                          )}

                          {result.themeColor && (
                            <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/50">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="h-4 w-4 rounded shadow-sm ring-1 ring-black/10" style={{ backgroundColor: result.themeColor }}></div>
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Theme Color</p>
                              </div>
                              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{result.themeColor}</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* MEDIA TAB */}
                      <TabsContent value="media" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {result.image && (
                          <div className="p-4 bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-3 flex items-center space-x-2 uppercase tracking-wider">
                              <Image className="h-4 w-4" />
                              <span>Open Graph / Featured Image</span>
                            </p>
                            <img
                              src={result.image}
                              alt={result.imageAlt || "Featured"}
                              className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-zinc-700 shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            {result.imageAlt && (
                              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2 italic">Alt: {result.imageAlt}</p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {result.favicon && (
                            <div className="p-4 bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">Favicon</p>
                              <img
                                src={result.favicon}
                                alt="Favicon"
                                className="h-16 w-16 object-contain rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 shadow-sm"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          {result.logo && (
                            <div className="p-4 bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">Logo/Touch Icon</p>
                              <img
                                src={result.logo}
                                alt="Logo"
                                className="h-16 w-16 object-contain rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 shadow-sm"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* SCHEMA TAB */}
                      <TabsContent value="schema" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {result.schemaType && (
                          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Code className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Schema.org Type</p>
                            </div>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{result.schemaType}</p>
                          </div>
                        )}

                        {result.jsonLd && result.jsonLd.length > 0 && (
                          <div className="p-4 bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                            <div className="flex items-center space-x-2 mb-3">
                              <Code className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
                              <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">JSON-LD Structured Data ({result.jsonLd.length} found)</p>
                            </div>
                            <pre className="text-xs bg-white dark:bg-zinc-950 p-3 rounded-lg border border-slate-200 dark:border-zinc-700 overflow-x-auto font-mono text-slate-600 dark:text-zinc-400">
                              {JSON.stringify(result.jsonLd, null, 2)}
                            </pre>
                          </div>
                        )}

                        {!result.schemaType && (!result.jsonLd || result.jsonLd.length === 0) && (
                          <div className="text-center py-8 text-slate-500 dark:text-zinc-400">
                            <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No structured data found</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* Timestamp */}
                <div className="relative px-6 py-3 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400">
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                    Analyzed: {result.timestamp}
                  </span>
                  <span className="font-mono opacity-50">ID: {result.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetascraperResults;
