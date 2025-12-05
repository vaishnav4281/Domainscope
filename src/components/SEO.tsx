import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string;
    canonicalUrl?: string;
    ogImage?: string;
    ogType?: string;
    twitterCard?: string;
    author?: string;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description = "DomainScope - Enterprise-grade OSINT domain intelligence platform by Vaishnav K. Advanced threat analysis, WHOIS lookup, DNS records, and security scanning built with expertise in Data Structures & Algorithms, System Design, and Cybersecurity.",
    keywords = "DomainScope, Vaishnav K, domain intelligence, OSINT, WHOIS lookup, DNS records, threat intelligence, domain analysis, IP geolocation, security scanning, VirusTotal, passive DNS, domain reputation, bulk domain scanner, DNS blacklist, VPN detection, proxy detection, domain metadata, cybersecurity tool, Software Engineer, SDE, Data Structures and Algorithms, System Design, Software Development, Cybersecurity, Full Stack Developer",
    canonicalUrl,
    ogImage = "https://domainscope.gov.in/og-image.png",
    ogType = "website",
    twitterCard = "summary_large_image",
    author = "Vaishnav K"
}) => {
    const siteTitle = "DomainScope";
    const authorName = "Vaishnav K";
    const fullTitle = title === siteTitle ? title : `${title} - ${siteTitle}`;
    const currentUrl = canonicalUrl || window.location.href;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="author" content={author} />
            <meta name="creator" content={authorName} />
            <meta name="publisher" content={authorName} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter */}
            <meta name="twitter:card" content={twitterCard} />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
            <meta name="twitter:creator" content={`@${authorName.replace(' ', '')}`} />

            {/* Additional Attribution */}
            <meta name="application-name" content={siteTitle} />
            <meta name="generator" content={`${siteTitle} by ${authorName}`} />
        </Helmet>
    );
};

export default SEO;
