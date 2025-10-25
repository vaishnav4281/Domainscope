# 🛡️ Domain Scope

A powerful, modern domain security intelligence platform built with React, TypeScript, and shadcn/ui. Analyze domains for security threats, malicious indicators, and comprehensive metadata using multiple threat intelligence APIs.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.1.12-646cff.svg)

## ✨ Features

### 🔍 Domain Analysis
- **Single Domain Scan** - Deep dive analysis of individual domains
- **Bulk Domain Scanning** - Process multiple domains simultaneously
- **Real-time Results** - Live updates as analysis progresses
- **Historical Results** - View past scans and analysis history

### 🔐 Security Intelligence Integration
- **VirusTotal** - Comprehensive threat detection and analysis
- **IPQS (IP Quality Score)** - Fraud detection and IP reputation
- **AbuseIPDB** - IP address abuse tracking
- **DNSBL (DNS Blacklist)** - Real-time blacklist checking
- **WHOIS** - Domain registration and ownership data
- **Metascraper** - Website metadata extraction

### 🎨 Modern UI/UX
- **Dark Mode Support** - System preference detection with manual toggle
- **Responsive Design** - Optimized for desktop and mobile devices
- **Interactive Charts** - Data visualization with Recharts
- **Lucide Icons** - Beautiful, consistent iconography
- **Toast Notifications** - Real-time feedback and alerts

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ or **Bun**
- **npm** or **bun** package manager
- API Keys for threat intelligence services (see [Configuration](#configuration))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd test1.2-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```bash
   VIRUSTOTAL_API_KEY=your_virustotal_key
   VITE_VIRUSTOTAL_API_KEY=your_virustotal_key
   IPQS_API_KEY=your_ipqs_key
   VITE_IPQS_API_KEY=your_ipqs_key
   ABUSEIPDB_API_KEY=your_abuseipdb_key
   VITE_ABUSEIPDB_API_KEY=your_abuseipdb_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Development with DNSBL

DNSBL requires Node.js `dns` module. Run a separate server:

```bash
npm run dev:dnsbl
```

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for:
- **Netlify**
- **Vercel**
- Other static hosting platforms

## 🔧 Configuration

### API Keys Required

| Service | Purpose | Get Key |
|---------|---------|---------|
| **VirusTotal** | Malware & threat detection | [virustotal.com](https://www.virustotal.com/gui/join-us) |
| **IPQS** | Fraud & IP reputation | [ipqualityscore.com](https://www.ipqualityscore.com/create-account) |
| **AbuseIPDB** | IP abuse tracking | [abuseipdb.com](https://www.abuseipdb.com/register) |

### Environment Variables

- **`VITE_*` prefixed** - Used at build time (embedded in client)
- **Non-prefixed** - Used at runtime in serverless functions

Both formats are required for full functionality in production.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 7.1.12
- **Routing**: React Router DOM 6.26.2
- **State Management**: TanStack Query 5.56.2
- **Styling**: TailwindCSS 3.4.11
- **UI Components**: shadcn/ui (Radix UI)
- **Icons**: Lucide React 0.462.0
- **Charts**: Recharts 2.12.7

### Backend APIs
- **Express.js** - API serverless functions
- **Metascraper** - Website metadata extraction
- **CORS** - Cross-origin resource sharing

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **Autoprefixer** - CSS vendor prefixing
- **PostCSS** - CSS processing

## 📁 Project Structure

```
test1.2-main/
├── api/                    # Serverless API functions
│   ├── abuseipdb/         # AbuseIPDB integration
│   ├── dnsbl/             # DNSBL checking
│   ├── ipqs/              # IPQS integration
│   ├── vt/                # VirusTotal integration
│   └── whois/             # WHOIS lookup
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── DomainAnalysisCard.tsx
│   │   ├── BulkScannerCard.tsx
│   │   ├── ResultsPanel.tsx
│   │   └── ...
│   ├── pages/            # Page components
│   │   ├── Index.tsx     # Main dashboard
│   │   └── NotFound.tsx
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities
│   ├── App.tsx           # App entry
│   └── main.tsx          # React entry
├── public/               # Static assets
├── .env.example          # Environment template
├── DEPLOYMENT.md         # Deployment guide
├── package.json          # Dependencies
├── tailwind.config.ts    # Tailwind configuration
├── tsconfig.json         # TypeScript config
└── vite.config.ts        # Vite configuration
```

## 🧪 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:dnsbl` | Start DNSBL dev server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

### Code Style

- **ESLint** configuration included
- **TypeScript** strict mode enabled
- **Prettier** compatible (configure separately if needed)

## 🐛 Troubleshooting

### Common Issues

**API 500 Errors**
- Ensure all API keys are set correctly in `.env`
- Check API key validity and rate limits

**DNSBL Not Working**
- Run `npm run dev:dnsbl` in a separate terminal
- DNSBL requires Node.js `dns` module

**Build Failures**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (18+ required)

**Dark Mode Issues**
- Clear browser localStorage
- Check system theme preferences

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production-specific troubleshooting.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) - Beautiful icon library
- [Vite](https://vitejs.dev/) - Lightning-fast build tool

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review existing issues before creating new ones

---

**Built with ❤️ using React, TypeScript, and shadcn/ui**