<div align="center">

# 🌍 **DomainScope**

### OSINT • DNS • WHOIS • Threat Intelligence

> 🧠 **DomainScope** is a next-gen **Domain & IP Intelligence Toolkit** for cybersecurity researchers, OSINT enthusiasts, and hackers.
> Perform **deep domain reconnaissance**, **threat detection**, **metadata extraction**, and **blacklist checks** through a sleek, modern interface.

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

## **🛡️ DomainScope — Advanced Domain & IP OSINT for Security Professionals**





## 🖼️ **Interface Preview**

## 🖼️ Interface Preview

### Dashboard  
<img width="100%" src="https://github.com/user-attachments/assets/4d73162f-aa16-4179-88eb-6941219877af" />

### Metadata Tabs  
<img width="100%" src="https://github.com/user-attachments/assets/6c1cb3ca-e0c5-4374-b647-e69d1210a41b" />

### VirusTotal Panel  
<img width="100%" src="https://github.com/user-attachments/assets/a4aba03e-563f-440e-83f5-4da139a5decc" />

### Security Intelligence  
<img width="100%" src="https://github.com/user-attachments/assets/ef3fd739-60ff-48e6-b42d-d97be11faa13" />


---


## ✨ **Why DomainScope?**

* 🔍 **Deep Domain & IP Recon** — Single and bulk scans
* 🧠 **Multiple Intelligence Sources** — VirusTotal, IPQS, AbuseIPDB, DNSBL, WHOIS, Metascraper
* 📊 **Visual Insights** — Interactive charts and graphs
* 🌙 **Modern UI** — Dark mode, responsive design, hacker-friendly aesthetics
* 🕵️ **Historical Tracking** — Compare past scans to detect trends
* ⚡ **Real-Time Feedback** — Live scan updates & notifications

---

## 🚀 **Feature Highlights**

| Emoji | Feature             | Description                                           |
| :---: | :------------------ | :---------------------------------------------------- |
|   🔍  | Single Domain Scan  | Analyze any domain or IP in-depth.                    |
|   📂  | Bulk Domain Scan    | Scan multiple domains from `.txt` lists.              |
|   🕒  | Historical Results  | Track and compare scan history.                       |
|   ⚡   | Real-Time Feedback  | Live updates during scans.                            |
|   🧬  | VirusTotal          | Malware & threat detection.                           |
|   🚨  | IPQS                | Fraud & IP reputation analysis.                       |
|   🧾  | AbuseIPDB           | Track reported abusive IP addresses.                  |
|   🧿  | DNSBL               | Verify domain/IP against blacklists.                  |
|   🧭  | WHOIS               | Domain registration and ownership info.               |
|   🪞  | Metascraper         | Extract metadata: title, description, images.         |
|   🌙  | Dark Mode           | Automatic system detection + manual toggle.           |
|   📊  | Interactive Charts  | Visualize trends, stats, and scan data.               |
|  🛡️  | Security Score      | Get a summarized security score per domain/IP.        |
|   🔗  | URL & Link Analysis | Check external links & potential phishing indicators. |

---

## 🛠️ **Tech Stack**

| Layer            | Tools / Libraries                                                        | Emoji |
| :--------------- | :----------------------------------------------------------------------- | :---: |
| ⚛️ Frontend      | React 18 · TypeScript 5 · Vite 7                                         |   💻  |
| 🎨 UI / Styling  | TailwindCSS 3 · shadcn/ui · Radix UI · Lucide Icons                      |   🎨  |
| 📈 Charts & Data | Recharts 2 · TanStack Query 5                                            |   📊  |
| 🧰 Backend / API | Express.js · VirusTotal · IPQS · AbuseIPDB · Metascraper · WHOIS · DNSBL |  🛠️  |
| 🧹 Dev Tools     | ESLint · TypeScript ESLint · PostCSS · Autoprefixer                      |   🧹  |

---

## 🔗 **API & Integration Details**

| Service     | Purpose                   | Required API Key | Notes                                    |
| :---------- | :------------------------ | :--------------- | :--------------------------------------- |
| VirusTotal  | Malware & Threat Analysis | ✅                | Free & Premium plans                     |
| IPQS        | IP & Fraud Reputation     | ✅                | Includes VPN/Proxy detection             |
| AbuseIPDB   | Track Abusive IPs         | ✅                | API Rate-limited                         |
| DNSBL       | Domain/IP Blacklist       | ❌                | No key needed, public blacklists         |
| WHOIS       | Domain Registration Info  | ❌                | Query limits may apply                   |
| Metascraper | Website Metadata          | ❌                | Scrapes page titles, description, images |

---

## 📊 **Comparison with Other OSINT Tools**

| Tool            | Focus             | Bulk Scan | Malware / Threat | DNSBL / Blacklist | WHOIS | Metadata | Modern UI | Notes                         |
| :-------------- | :---------------- | :-------: | :--------------: | :---------------: | :---: | :------: | :-------: | :---------------------------- |
| **DomainScope** | Domain & IP Recon |     ✅     |         ✅        |         ✅         |   ✅   |     ✅    |     ✅     | Full-stack OSINT web app      |
| SpiderFoot      | OSINT Recon       |     ✅     |         ✅        |         ✅         |   ✅   |     ✅    |     ⚠️    | Heavy, complex UI             |
| Recon-NG        | Framework         |     ✅     |        ⚠️        |         ⚠️        |   ✅   |    ⚠️    |     ❌     | CLI-based, not web            |
| Shodan          | IoT / IP Recon    |     ⚠️    |         ✅        |         ❌         |   ⚠️  |     ❌    |     ⚠️    | Focused on IoT / IP, paid API |
| Maltego         | OSINT Graph       |     ⚠️    |         ✅        |         ⚠️        |   ✅   |    ⚠️    |     ⚠️    | Enterprise-focused            |

> ✅ = Fully supported, ⚠️ = Partial, ❌ = Not available

---

## ⚙️ **Setup & Installation**

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

# Copy env template
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

### Start Dev Server

```bash
npm run dev
# or
bun run dev
```

Open **[http://localhost:5173](http://localhost:5173)**

### DNSBL Dev Server (Optional)

```bash
npm run dev:dnsbl
```

---

## 📁 **Project Structure**

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
├── .env.example            # Environment variables
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 🤝 **Contributing**

1. Fork repo
2. Create a branch → `git checkout -b feature/awesome-feature`
3. Commit → `git commit -m "Add awesome feature"`
4. Push → `git push origin feature/awesome-feature`
5. Open Pull Request

---

## 📜 **License**

MIT License — See [LICENSE](./LICENSE)

---

## 🌟 **Acknowledgements**

* [shadcn/ui](https://ui.shadcn.com/) – Modern UI components
* [Radix UI](https://www.radix-ui.com/) – Accessible primitives
* [TailwindCSS](https://tailwindcss.com) – Utility CSS
* [Lucide Icons](https://lucide.dev) – Iconography
* [Vite](https://vitejs.dev) – Fast build tool

---

<div align="center">

💙 *Built with passion using **React, TypeScript, Vite, and shadcn/ui***
⭐ **Give DomainScope a star if you like it!**

</div>
