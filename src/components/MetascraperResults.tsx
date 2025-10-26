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
    if (score >= 70) return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  };

  return (
  <Card className="h-fit border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
  <CardHeader className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-purple-200/50 dark:border-pink-800/50 p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-lg sm:text-xl">
              Metascraper Metadata
            </span>
            <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-slate-700 dark:from-purple-950 dark:to-pink-950 dark:text-slate-300 border-0">
              {results.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
  <CardContent className="p-2 sm:p-3">
        {results.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-slate-500 dark:text-slate-400">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 rounded-full w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 flex items-center justify-center">
              <Globe className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-base sm:text-lg font-medium mb-2">No metadata yet</p>
            <p className="text-sm">Metascraper results will appear here after domain analysis</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div 
                key={result.id} 
                className="border border-purple-200/50 dark:border-pink-800/50 rounded-xl p-4 sm:p-6 space-y-4 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 hover:shadow-lg transition-all duration-500 hover:scale-[1.01] animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header with Completeness Score */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-3 border-b border-purple-200/50 dark:border-pink-800/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-all">
                        {result.domain}
                      </h3>
                      {result.type && (
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-0 text-xs mt-1">
                          {result.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {result.completenessScore !== undefined && (
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <Badge className={`text-xs font-medium border-0 ${getScoreBadge(result.completenessScore)}`}>
                          Completeness: {result.completenessScore}%
                        </Badge>
                      </div>
                    )}
                    {result.lang && (
                      <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 border-0 text-xs">
                        {result.lang.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {result.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <strong>Error:</strong> {result.error}
                    </p>
                  </div>
                )}

                {!result.error && (
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-purple-100 dark:bg-purple-950">
                      <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                      <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
                      <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                      <TabsTrigger value="tech" className="text-xs">Tech</TabsTrigger>
                      <TabsTrigger value="media" className="text-xs">Media</TabsTrigger>
                      <TabsTrigger value="schema" className="text-xs">Schema</TabsTrigger>
                    </TabsList>

                    {/* BASIC TAB */}
                    <TabsContent value="basic" className="space-y-3 mt-4">
                      {result.title && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Page Title</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{result.title}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {result.description && (
                        <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Eye className="h-4 w-4 text-pink-600 dark:text-pink-400 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Description</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{result.description}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.url && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <LinkIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Canonical URL</p>
                            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 dark:text-purple-400 hover:underline truncate block">
                              {result.url}
                            </a>
                          </div>
                        )}

                        {result.keywords && (
                          <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                            <Hash className="h-4 w-4 text-pink-600 dark:text-pink-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Keywords</p>
                            <p className="text-sm text-pink-600 dark:text-pink-400">{result.keywords}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* SOCIAL TAB */}
                    <TabsContent value="social" className="space-y-3 mt-4">
                      {result.twitterCard && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <Twitter className="h-4 w-4 text-blue-500" />
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Twitter Card Data</p>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Card Type:</span> {result.twitterCard}</div>
                            {result.twitterSite && <div><span className="font-medium">Site:</span> {result.twitterSite}</div>}
                            {result.twitterCreator && <div><span className="font-medium">Creator:</span> {result.twitterCreator}</div>}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.author && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <User className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Author</p>
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{result.author}</p>
                          </div>
                        )}

                        {result.publisher && (
                          <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                            <Building2 className="h-4 w-4 text-pink-600 dark:text-pink-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Publisher</p>
                            <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">{result.publisher}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* CONTENT TAB */}
                    <TabsContent value="content" className="space-y-3 mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.date && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Published Date</p>
                            <p className="text-sm text-purple-600 dark:text-purple-400">{new Date(result.date).toLocaleDateString()}</p>
                          </div>
                        )}

                        {result.modifiedDate && (
                          <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                            <Clock className="h-4 w-4 text-pink-600 dark:text-pink-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Modified Date</p>
                            <p className="text-sm text-pink-600 dark:text-pink-400">{new Date(result.modifiedDate).toLocaleDateString()}</p>
                          </div>
                        )}

                        {result.category && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Category</p>
                            <p className="text-sm text-purple-600 dark:text-purple-400">{result.category}</p>
                          </div>
                        )}

                        {result.tags && (
                          <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                            <Hash className="h-4 w-4 text-pink-600 dark:text-pink-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Article Tags</p>
                            <p className="text-sm text-pink-600 dark:text-pink-400">{result.tags}</p>
                          </div>
                        )}
                      </div>

                      {(result.rssFeed || result.atomFeed) && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <Rss className="h-4 w-4 text-orange-500" />
                            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">RSS/Atom Feeds</p>
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
                    <TabsContent value="tech" className="space-y-3 mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.generator && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <Code className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Generator/CMS</p>
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{result.generator}</p>
                          </div>
                        )}

                        {result.robots && (
                          <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                            <Settings className="h-4 w-4 text-pink-600 dark:text-pink-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Robots</p>
                            <p className="text-sm text-pink-600 dark:text-pink-400">{result.robots}</p>
                          </div>
                        )}

                        {result.charset && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <Code className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Charset</p>
                            <p className="text-sm text-purple-600 dark:text-purple-400">{result.charset}</p>
                          </div>
                        )}

                        {result.viewport && (
                          <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                            <Eye className="h-4 w-4 text-pink-600 dark:text-pink-400 mb-1" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Viewport</p>
                            <p className="text-sm text-pink-600 dark:text-pink-400 text-xs">{result.viewport}</p>
                          </div>
                        )}

                        {result.themeColor && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="h-4 w-4 rounded" style={{ backgroundColor: result.themeColor }}></div>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Theme Color</p>
                            </div>
                            <p className="text-sm text-purple-600 dark:text-purple-400">{result.themeColor}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* MEDIA TAB */}
                    <TabsContent value="media" className="space-y-3 mt-4">
                      {result.image && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center space-x-1">
                            <Image className="h-3 w-3" />
                            <span>Open Graph / Featured Image</span>
                          </p>
                          <img 
                            src={result.image} 
                            alt={result.imageAlt || "Featured"} 
                            className="w-full h-48 object-cover rounded-lg border border-purple-200 dark:border-pink-800"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          {result.imageAlt && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">Alt: {result.imageAlt}</p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        {result.favicon && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Favicon</p>
                            <img 
                              src={result.favicon} 
                              alt="Favicon" 
                              className="h-16 w-16 object-contain rounded-lg border border-purple-200 dark:border-pink-800 bg-white dark:bg-slate-800 p-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        {result.logo && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Logo/Touch Icon</p>
                            <img 
                              src={result.logo} 
                              alt="Logo" 
                              className="h-16 w-16 object-contain rounded-lg border border-purple-200 dark:border-pink-800 bg-white dark:bg-slate-800 p-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* SCHEMA TAB */}
                    <TabsContent value="schema" className="space-y-3 mt-4">
                      {result.schemaType && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <Code className="h-4 w-4 text-green-600 dark:text-green-400 mb-1" />
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Schema.org Type</p>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">{result.schemaType}</p>
                        </div>
                      )}

                      {result.jsonLd && result.jsonLd.length > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center space-x-2 mb-2">
                            <Code className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">JSON-LD Structured Data ({result.jsonLd.length} found)</p>
                          </div>
                          <pre className="text-xs bg-white dark:bg-slate-900 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.jsonLd, null, 2)}
                          </pre>
                        </div>
                      )}

                      {!result.schemaType && (!result.jsonLd || result.jsonLd.length === 0) && (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No structured data found</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}

                {/* Timestamp */}
                <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-purple-200/50 dark:border-pink-800/50 pt-3 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-2">
                  <span className="font-medium">Scraped:</span> {result.timestamp}
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
