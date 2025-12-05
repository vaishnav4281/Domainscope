/**
 * Metadata Extraction Service
 * Fetches website HTML and extracts meta tags server-side
 * This serves as a fallback when CORS proxies fail on the frontend
 */

import https from 'node:https';
import http from 'node:http';

export interface MetadataResult {
    title?: string;
    description?: string;
    keywords?: string;
    author?: string;
    lang?: string;
    publisher?: string;
    type?: string;
    image?: string;
    imageAlt?: string;
    url?: string;
    twitterCard?: string;
    twitterSite?: string;
    twitterCreator?: string;
    date?: string;
    modifiedDate?: string;
    category?: string;
    tags?: string;
    favicon?: string;
    logo?: string;
    robots?: string;
    viewport?: string;
    themeColor?: string;
    charset?: string;
    generator?: string;
    rssFeed?: string;
    atomFeed?: string;
    schemaType?: string;
    completenessScore?: number;
    error?: string;
}

/**
 * Fetch HTML content from a URL with timeout and redirect following
 */
async function fetchHtml(targetUrl: string, timeout: number = 10000): Promise<string> {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(targetUrl);
        const client = urlObj.protocol === 'https:' ? https : http;

        const req = client.get(targetUrl, {
            timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'identity', // Disable compression for simplicity
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        }, (res) => {
            // Handle redirects (up to 5)
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const redirectUrl = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : `${urlObj.protocol}//${urlObj.host}${res.headers.location}`;
                fetchHtml(redirectUrl, timeout)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }

            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });
    });
}

/**
 * Extract metadata from HTML content
 */
function extractMetadata(html: string, domain: string): MetadataResult {
    const result: MetadataResult = {};

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
    result.title = (ogTitleMatch?.[1] || twitterTitleMatch?.[1] || titleMatch?.[1] || '').trim();

    // Description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const twitterDescMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i);
    result.description = (ogDescMatch?.[1] || twitterDescMatch?.[1] || descMatch?.[1] || '').trim();

    // Keywords
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    if (keywordsMatch && keywordsMatch[1]) result.keywords = keywordsMatch[1].trim();

    // Author
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    const articleAuthorMatch = html.match(/<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']+)["']/i);
    if (authorMatch || articleAuthorMatch) result.author = (articleAuthorMatch?.[1] || authorMatch?.[1] || '').trim();

    // Language
    const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    const ogLocaleMatch = html.match(/<meta[^>]*property=["']og:locale["'][^>]*content=["']([^"']+)["']/i);
    if (langMatch || ogLocaleMatch) result.lang = (langMatch?.[1] || ogLocaleMatch?.[1] || '').trim();

    // Publisher
    const publisherMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
    if (publisherMatch && publisherMatch[1]) result.publisher = publisherMatch[1].trim();

    // Type
    const ogTypeMatch = html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i);
    if (ogTypeMatch && ogTypeMatch[1]) result.type = ogTypeMatch[1].trim();

    // Image
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    if (imageMatch || twitterImageMatch) result.image = (imageMatch?.[1] || twitterImageMatch?.[1] || '').trim();

    // Image Alt
    const imageAltMatch = html.match(/<meta[^>]*property=["']og:image:alt["'][^>]*content=["']([^"']+)["']/i);
    if (imageAltMatch && imageAltMatch[1]) result.imageAlt = imageAltMatch[1].trim();

    // URL
    const ogUrlMatch = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    result.url = (ogUrlMatch?.[1] || canonicalMatch?.[1] || `https://${domain}`).trim();

    // Twitter Card
    const twitterCardMatch = html.match(/<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']+)["']/i);
    if (twitterCardMatch && twitterCardMatch[1]) result.twitterCard = twitterCardMatch[1].trim();

    // Twitter Site
    const twitterSiteMatch = html.match(/<meta[^>]*name=["']twitter:site["'][^>]*content=["']([^"']+)["']/i);
    if (twitterSiteMatch && twitterSiteMatch[1]) result.twitterSite = twitterSiteMatch[1].trim();

    // Twitter Creator
    const twitterCreatorMatch = html.match(/<meta[^>]*name=["']twitter:creator["'][^>]*content=["']([^"']+)["']/i);
    if (twitterCreatorMatch && twitterCreatorMatch[1]) result.twitterCreator = twitterCreatorMatch[1].trim();

    // Published Date
    const publishedMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
    const dateMatch = html.match(/<meta[^>]*name=["']date["'][^>]*content=["']([^"']+)["']/i);
    if (publishedMatch || dateMatch) result.date = (publishedMatch?.[1] || dateMatch?.[1] || '').trim();

    // Modified Date
    const modifiedMatch = html.match(/<meta[^>]*property=["']article:modified_time["'][^>]*content=["']([^"']+)["']/i);
    if (modifiedMatch && modifiedMatch[1]) result.modifiedDate = modifiedMatch[1].trim();

    // Category/Section
    const sectionMatch = html.match(/<meta[^>]*property=["']article:section["'][^>]*content=["']([^"']+)["']/i);
    if (sectionMatch && sectionMatch[1]) result.category = sectionMatch[1].trim();

    // Tags
    const articleTagsMatches = html.match(/<meta[^>]*property=["']article:tag["'][^>]*content=["']([^"']+)["']/gi);
    if (articleTagsMatches) {
        result.tags = articleTagsMatches.map((tag: string) => {
            const match = tag.match(/content=["']([^"']+)["']/i);
            return match && match[1] ? match[1] : '';
        }).filter(Boolean).join(', ');
    }

    // Favicon
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
    if (faviconMatch && faviconMatch[1]) {
        const faviconUrl = faviconMatch[1].trim();
        result.favicon = faviconUrl.startsWith('http') ? faviconUrl : `https://${domain}${faviconUrl.startsWith('/') ? '' : '/'}${faviconUrl}`;
    }

    // Apple Touch Icon (Logo)
    const appleTouchMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
    if (appleTouchMatch && appleTouchMatch[1]) {
        const appleUrl = appleTouchMatch[1].trim();
        result.logo = appleUrl.startsWith('http') ? appleUrl : `https://${domain}${appleUrl.startsWith('/') ? '' : '/'}${appleUrl}`;
    }

    // Robots
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
    if (robotsMatch && robotsMatch[1]) result.robots = robotsMatch[1].trim();

    // Viewport
    const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i);
    if (viewportMatch && viewportMatch[1]) result.viewport = viewportMatch[1].trim();

    // Theme Color
    const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i);
    if (themeColorMatch && themeColorMatch[1]) result.themeColor = themeColorMatch[1].trim();

    // Charset
    const charsetMatch = html.match(/<meta[^>]*charset=["']?([^"'\s>]+)["']?/i);
    if (charsetMatch && charsetMatch[1]) result.charset = charsetMatch[1].trim();

    // Generator
    const generatorMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i);
    if (generatorMatch && generatorMatch[1]) result.generator = generatorMatch[1].trim();

    // RSS Feed
    const rssFeedMatch = html.match(/<link[^>]*type=["']application\/rss\+xml["'][^>]*href=["']([^"']+)["']/i);
    if (rssFeedMatch && rssFeedMatch[1]) {
        const rssUrl = rssFeedMatch[1].trim();
        result.rssFeed = rssUrl.startsWith('http') ? rssUrl : `https://${domain}${rssUrl.startsWith('/') ? '' : '/'}${rssUrl}`;
    }

    // Atom Feed
    const atomFeedMatch = html.match(/<link[^>]*type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/i);
    if (atomFeedMatch && atomFeedMatch[1]) {
        const atomUrl = atomFeedMatch[1].trim();
        result.atomFeed = atomUrl.startsWith('http') ? atomUrl : `https://${domain}${atomUrl.startsWith('/') ? '' : '/'}${atomUrl}`;
    }

    // JSON-LD Schema
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
        try {
            const jsonLdData = jsonLdMatches.map(script => {
                const content = script.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
                if (content && content[1]) {
                    try { return JSON.parse(content[1]); } catch { return null; }
                }
                return null;
            }).filter(Boolean);

            if (jsonLdData.length > 0) {
                const firstSchema = Array.isArray(jsonLdData[0]) ? jsonLdData[0][0] : jsonLdData[0];
                if (firstSchema) {
                    if (firstSchema['@type']) result.schemaType = firstSchema['@type'];
                    if (firstSchema.name && !result.title) result.title = firstSchema.name;
                    if (firstSchema.description && !result.description) result.description = firstSchema.description;
                }
            }
        } catch (e) { /* ignore */ }
    }

    // Calculate completeness score
    const totalFields = 30;
    const filledFields = Object.keys(result).filter(key => key !== 'completenessScore' && result[key as keyof MetadataResult]).length;
    result.completenessScore = Math.round((filledFields / totalFields) * 100);

    return result;
}

/**
 * Main function to extract metadata from a domain
 */
export async function extractWebsiteMetadata(domain: string): Promise<MetadataResult> {
    // Try HTTPS first, then HTTP as fallback
    const targets = [
        `https://${domain}`,
        `https://www.${domain}`,
        `http://${domain}`,
        `http://www.${domain}`
    ];

    for (const targetUrl of targets) {
        try {
            console.log(`[Metadata] Fetching ${targetUrl}...`);
            const html = await fetchHtml(targetUrl, 15000);

            if (html && html.length > 100) {
                console.log(`[Metadata] Successfully fetched ${targetUrl} (${html.length} chars)`);
                return extractMetadata(html, domain);
            }
        } catch (err: any) {
            console.warn(`[Metadata] Failed to fetch ${targetUrl}: ${err.message}`);
            continue;
        }
    }

    // All attempts failed
    return { error: 'Failed to fetch website content from all URL variations' };
}
