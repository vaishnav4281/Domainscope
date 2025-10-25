
<div align="center">

# 🌐 **Domain Scope**
### 🧠 Advanced Domain & IP Intelligence Toolkit

<img width="720" height="1289" alt="domain scope 1" src="https://github.com/user-attachments/assets/ca970ccd-d824-460b-afd6-caf7523ca9a8" />

[![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite-8B5CF6?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-007ACC?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/UI-shadcn/ui-9D4EDD)](https://ui.shadcn.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> ⚡ **Domain Scope** is a modern, Vite-powered OSINT tool that provides WHOIS, DNS, IP Geolocation, Metadata, VirusTotal, and Risk Intelligence — all in one lightning-fast interface.

🌎 [**Live Demo**](https://domain-scope-three.vercel.app) • ⚙️ [**Backend API**](https://whois-aoi.onrender.com)

</div>

---

## 🚀 **Overview**

**Domain Scope** provides an all-in-one dashboard for cybersecurity researchers, analysts, and developers to analyze domains and IPs quickly.  
It combines data from multiple sources and APIs into a structured, interactive UI.

| 🔍 Feature | 💡 Description |
|-------------|----------------|
| 🌍 **WHOIS & DNS Lookup** | Registrar, domain age, A/MX/NS/AAAA, TXT records |
| 🛰️ **IP Intelligence** | Geolocation, ASN, ISP, and network owner |
| 🧩 **Metadata Extraction (Metascraper+)** | 30+ meta fields with SEO completeness score |
| 🛡️ **VirusTotal Integration** | Detection ratio, reputation, and categorization |
| ⚠️ **AbuseIPDB Risk Check** | Abuse confidence and threat classification |
| 📊 **Bulk Domain Scanning** | Multi-domain analysis with CSV export |
| 🖥️ **Modern UI** | Responsive React + Tailwind + shadcn/ui interface |
| 🔄 **Real-Time Refresh** | Asynchronous scanning with status tracking |

---

## 🖼️ **Interface Preview**

| Dashboard | Metadata Tabs | VirusTotal Panel |
|------------|----------------|------------------|
|<img width="1440" height="1024" alt="464908732-03e08e4a-32c6-4700-93bb-d89c464a2bac" src="https://github.com/user-attachments/assets/2009d725-c480-43f3-9575-1b64fe198ff7" />
) | ![Metadata](https://via.placeholder.com/400x230?text=Metadata+Tabs) | ![VirusTotal](https://via.placeholder.com/400x230?text=VirusTotal+Panel) |

---

## 🧭 **Modules & Tabs Explained**

### 🧱 1. **Metascraper+ (Metadata Intelligence)**

Organized into 6 categories for clarity:

| 🗂️ Tab | Description |
|---------|-------------|
| 🏷️ **Basic** | Title, meta description, keywords, favicon, viewport |
| 💬 **Social** | OpenGraph tags, Twitter Card data, theme colors |
| 📄 **Content** | Canonical URL, feeds, robots.txt, generator tags |
| ⚙️ **Tech** | Detected frameworks, CMS, and backend hints |
| 🖼️ **Media** | OG images, thumbnails, icons |
| 🧱 **Schema** | Structured JSON-LD and microdata information |

🧮 *Completeness Score:* 0–100% SEO and metadata health indicator.

---

### 🧪 2. **VirusTotal Intelligence**

| 🧩 Tab | Details |
|--------|----------|
| 🛡️ **Security** | Overall risk score (clean/suspicious/malicious) |
| 🦠 **Detections** | Vendor detection count breakdown |
| ⭐ **Reputation** | VirusTotal reputation index |
| 🏷️ **Categories** | Domain categories (e.g., business, news, malware) |
| 🕵️ **DNS/SSL** | Historical DNS and SSL certificate records |
| 📚 **Info** | WHOIS snapshot, JARM fingerprint, tags |

---

### 🌍 3. **WHOIS + DNS + IP Intelligence**

| Data Type | Example Output |
|------------|----------------|
| Registrar | GoDaddy / Namecheap / Cloudflare |
| Domain Age | “5 years, 142 days” |
| IP | `13.200.201.119` |
| Country | India 🇮🇳 |
| Nameservers | `ns1.example.com`, `ns2.example.com` |
| ISP | AWS / Cloudflare / Google Cloud |
| ASN | Autonomous System Number with route prefix |

---

### ⚙️ 4. **Bulk Domain Scanner**

- Import `.txt` file with multiple domains.  
- Parallel scanning with progress tracking.  
- Export clean `.csv` with all WHOIS, DNS, IP, and VirusTotal data.  
- Optional: AbuseIPDB risk field if API key is provided.

---

## ⚙️ **Installation & Setup (Vite)**

```bash
# 1️⃣ Clone the repository
git clone https://github.com/yourusername/domain-scope.git
cd domain-scope

# 2️⃣ Install dependencies
npm install

# 3️⃣ Add environment variables
touch .env
````

### `.env` Example

```env
VITE_API_BASE=https://whois-aoi.onrender.com
VITE_VIRUSTOTAL_API_KEY=your_virustotal_api_key
VITE_ABUSEIPDB_API_KEY=your_abuseipdb_api_key
```

```bash
# 4️⃣ Run locally
npm run dev

# 5️⃣ Build for production
npm run build
```

Now open 👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🧱 **Project Structure**

```
src/
 ┣ components/
 ┃ ┣ DomainAnalysisCard.tsx     # Single domain analysis
 ┃ ┣ BulkScannerCard.tsx        # Bulk scan with CSV export
 ┃ ┣ MetascraperResults.tsx     # Metadata tab system
 ┃ ┣ VirusTotalResults.tsx      # VirusTotal report tabs
 ┃ ┗ ResultsPanel.tsx           # Display + export results
 ┣ utils/
 ┃ ┣ api.ts                     # API integration helpers
 ┃ ┗ formatters.ts              # Format dates, IPs, etc.
 ┗ App.tsx                      # Main application
```

---

## 📡 **API Endpoints**

| Endpoint               | Description                            |
| ---------------------- | -------------------------------------- |
| `/whois/?domain=`      | WHOIS, registrar, creation/expiry info |
| `/dns/?domain=`        | DNS records (A, MX, TXT, AAAA, NS)     |
| `/ipgeo/?ip=`          | Geolocation and ISP lookup             |
| `/abuse/?ip=`          | Abuse confidence and threat type       |
| `/metascraper/?url=`   | Extract structured metadata            |
| `/virustotal/?domain=` | VirusTotal intelligence report         |

---

## 🧮 **Feature Comparison**

| Feature                | Domain Scope      | Spyse      | Censys    | Shodan     |
| ---------------------- | ----------------- | ---------- | --------- | ---------- |
| WHOIS Lookup           | ✅ Yes             | ✅ Yes      | ✅ Yes     | ⚠️ Limited |
| DNS Records            | ✅ Full            | ✅ Full     | ✅ Partial | ✅ Partial  |
| VirusTotal Integration | ✅ Direct          | ❌          | ❌         | ❌          |
| Metadata Extraction    | ✅ 30+ fields      | ❌          | ❌         | ❌          |
| AbuseIPDB Integration  | ✅ Optional        | ❌          | ❌         | ❌          |
| Bulk Scanning          | ✅ With CSV Export | ⚠️ Limited | ❌         | ✅ Paid     |
| API-Driven             | ✅ Yes             | ✅ Yes      | ✅ Yes     | ✅ Yes      |
| Free to Use            | ✅ Yes             | ❌ Paid     | ❌ Paid    | ⚠️ Limited |

---

## 🧭 **Future Enhancements**

* [ ] Subdomain discovery
* [ ] SSL certificate analysis
* [ ] Passive DNS history
* [ ] Wappalyzer tech fingerprinting
* [ ] Report PDF export
* [ ] Dashboard analytics & trends

---

## 🧯 **Troubleshooting**

| Issue                        | Fix                                  |
| ---------------------------- | ------------------------------------ |
| ❌ No metadata detected       | Retry or check domain availability   |
| ⚠️ VirusTotal quota exceeded | Renew or rotate API key              |
| 📉 CSV format issue          | Use built-in export, not manual copy |
| 🕒 Slow scan                 | Possibly due to API timeout — retry  |

---

## 📜 **License**

🆓 **MIT License** — You’re free to use, modify, and distribute this project.

---

<div align="center">

✨ **Domain Scope**
Investigate. Analyze. Understand.
Built with ⚡ Vite, 💙 React, and ❤️ Passion.
<img width="720" height="1289" alt="domain scope 1" src="https://github.com/user-attachments/assets/ca970ccd-d824-460b-afd6-caf7523ca9a8" />

</div>

