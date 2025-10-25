<div align="center">

# 🌍 **DomainScope**

### *OSINT • DNS • WHOIS • Threat Intelligence*

> 🧠 **DomainScope** is a next-gen **Domain & IP Intelligence Toolkit** for security researchers, developers, and OSINT enthusiasts.
> Perform **deep domain reconnaissance**, **threat detection**, and **metadata analysis** — all through a sleek, modern dashboard.

Built with 💙 **React + TypeScript + shadcn/ui + Vite**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6.svg)
![Vite](https://img.shields.io/badge/Vite-7.1.12-646CFF.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.11-38BDF8.svg)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Modern%20UI%20Components-111827.svg)

🔗 **Live Demo:** [domainscope.vercel.app](https://domainscope.vercel.app)

</div>

---

## 💫 **Tagline**

> ⚡ *“The Hacker’s Lens for Domain Intelligence — Analyze. Detect. Secure.”*

---

## 🖼️ **Screenshots / Visuals**

*(Replace these placeholders with your actual screenshots)*

**Dashboard / Hero Screen:**
![Dashboard Placeholder](https://via.placeholder.com/800x400?text=DomainScope+Dashboard)

**Scan Results / Charts:**
![Scan Results Placeholder](https://via.placeholder.com/800x400?text=Scan+Results)

**Bulk Scan / API Integration:**
![Bulk Scan Placeholder](https://via.placeholder.com/800x400?text=Bulk+Scan)

---

## ✨ **Why DomainScope?**

* 🔍 **Deep Domain Analysis** — Single or bulk scans, historical tracking.
* 🧠 **Intelligence Integration** — VirusTotal, IPQS, AbuseIPDB, DNSBL, WHOIS, Metascraper.
* 📊 **Visual Insights** — Interactive charts, result panels, live updates.
* 🌙 **Modern UI** — Dark mode, responsive design, sleek iconography.
* 🕵️ **Hacker-Friendly** — Designed for OSINT, recon, and cyber research.

---

## 🚀 **Feature Highlights**

| Emoji | Feature            | Description                                       |
| :---: | :----------------- | :------------------------------------------------ |
|   🔍  | Single Domain Scan | Deep analysis of individual domains or IPs.       |
|   📂  | Bulk Domain Scan   | Upload `.txt` to scan multiple domains at once.   |
|   🕒  | Historical Results | Track and compare previous scan results.          |
|   ⚡   | Real-Time Feedback | Live updates while scanning domains.              |
|   🧬  | VirusTotal         | Malware & threat detection.                       |
|   🚨  | IPQS               | Detect fraudulent or suspicious IPs.              |
|   🧾  | AbuseIPDB          | Check reported abusive IP addresses.              |
|   🧿  | DNSBL              | Check domain/IP against major blacklists.         |
|   🧭  | WHOIS              | Domain ownership and registration data.           |
|   🪞  | Metascraper        | Extract metadata like title, description, images. |
|   🌙  | Dark Mode          | Automatic or manual toggle.                       |
|   📊  | Interactive Charts | Visualize results and trends.                     |

---

## ⚙️ **Tech Stack**

| Category         | Technologies                                                             |
| :--------------- | :----------------------------------------------------------------------- |
| ⚛️ Frontend      | React 18 · TypeScript 5 · Vite 7                                         |
| 🎨 UI / Styling  | TailwindCSS 3 · shadcn/ui · Radix UI · Lucide Icons                      |
| 📈 Charts & Data | Recharts 2 · TanStack Query 5                                            |
| 🧰 Backend / API | Express.js · VirusTotal · IPQS · AbuseIPDB · Metascraper · WHOIS · DNSBL |
| 🧹 Dev Tools     | ESLint · TypeScript ESLint · PostCSS · Autoprefixer                      |

---

## 📊 **Comparison Table with Other OSINT Tools**

| Tool            | Focus             | Bulk Scan | Malware / Threat | DNSBL / Blacklist | WHOIS | Metadata | Modern UI | Notes                          |
| :-------------- | :---------------- | :-------: | :--------------: | :---------------: | :---: | :------: | :-------: | :----------------------------- |
| **DomainScope** | Domain & IP Recon |     ✅     |         ✅        |         ✅         |   ✅   |     ✅    |     ✅     | Full-stack OSINT toolkit       |
| SpiderFoot      | OSINT Recon       |     ✅     |         ✅        |         ✅         |   ✅   |     ✅    |     ⚠️    | Heavy, complex UI              |
| Recon-NG        | Framework         |     ✅     |        ⚠️        |         ⚠️        |   ✅   |    ⚠️    |     ❌     | CLI-based, not web             |
| Shodan          | IoT / IP Recon    |     ⚠️    |         ✅        |         ❌         |   ⚠️  |     ❌    |     ⚠️    | Focused on IoT / IP, paid API  |
| Maltego         | OSINT Graph       |     ⚠️    |         ✅        |         ⚠️        |   ✅   |    ⚠️    |     ⚠️    | Enterprise-focused, commercial |

> ✅ = Fully supported, ⚠️ = Limited/Partial, ❌ = Not available

---

## 🛠️ **Setup & Installation**

### Prerequisites

* Node.js ≥ 18 or Bun
* npm or Bun package manager
* API Keys: VirusTotal, IPQS, AbuseIPDB

### Installation Steps

```bash
# Clone repo
git clone <your-repo-url>
cd domainscope

# Install dependencies
npm install
# or
bun install

# Configure environment variables
cp .env.example .env
```

### Add API Keys

```bash
VIRUSTOTAL_API_KEY=your_virustotal_key
VITE_VIRUSTOTAL_API_KEY=your_virustotal_key
IPQS_API_KEY=your_ipqs_key
VITE_IPQS_API_KEY=your_ipqs_key
ABUSEIPDB_API_KEY=your_abuseipdb_key
VITE_ABUSEIPDB_API_KEY=your_abuseipdb_key
```

### Run Dev Server

```bash
npm run dev
# or
bun run dev
```

Visit **[http://localhost:5173](http://localhost:5173)**

### DNSBL Server (Optional)

```bash
npm run dev:dnsbl
```

---

## 🖼️ **Project Structure**

```
domainscope/
├── api/                    # Serverless API functions
├── src/
│   ├── components/         # UI components
│   ├── pages/              # Dashboard, NotFound
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   └── main.tsx            # React entry
├── public/                 # Static assets
├── .env.example            # Env template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 🤝 **Contributing**

1. Fork repo
2. Create branch → `git checkout -b feature/awesome-feature`
3. Commit → `git commit -m "Add awesome feature"`
4. Push → `git push origin feature/awesome-feature`
5. Open a Pull Request

---

## 📜 **License**

MIT License — See [LICENSE](./LICENSE)

---

## 🌟 **Acknowledgements**

* [shadcn/ui](https://ui.shadcn.com/) – UI components
* [Radix UI](https://www.radix-ui.com/) – Accessible primitives
* [TailwindCSS](https://tailwindcss.com) – Utility CSS
* [Lucide Icons](https://lucide.dev) – Iconography
* [Vite](https://vitejs.dev) – Fast build tool

---

<div align="center">

💙 *Built with passion using **React, TypeScript, Vite, and shadcn/ui***
⭐ **Give DomainScope a star if you like it!**

</div>
