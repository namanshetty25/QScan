# QScan Frontend Setup & Development Guide

## 📋 Project Overview

This is a React-based frontend for **QScan** — a Quantum Readiness Assessment Platform for Banking Infrastructure, built for the PNB Cybersecurity Hackathon 2025-26.

**Location:** `C:\Users\subhanshu\qscan-frontend`

## ✅ What's Complete

- ✅ React app initialized with Create React App
- ✅ All required dependencies installed (Framer Motion, Recharts, Tailwind, React Router, etc.)
- ✅ Global dark quantum theme with CSS variables
- ✅ Navbar & Footer layout components
- ✅ Landing page with hero, features, and stats
- ✅ NewScan page with form and live progress terminal
- ✅ Results page with CBOM dashboard (basic)
- ✅ Certificate page (printable)
- ✅ History page with scan list and filtering
- ✅ Custom hooks for API calls (useScan, useScanResults, useScanHistory, useStartScan)
- ✅ PQC classifier utility functions
- ✅ Common badge components (RiskBadge, TLSVersionBadge, PQCStatusPill, etc.)
- ✅ API client with Axios
- ✅ Toast notifications with React Hot Toast
- ✅ Framer Motion animations

## 🚀 Quick Start

### 1. Install Backend (Python API)

First, set up the FastAPI backend that was created:

```bash
cd C:\inetpub\QScan
pip install -r requirements.txt
python api.py
```

The API will run on `http://localhost:8000`

### 2. Run Frontend (React)

```bash
cd C:\Users\subhanshu\qscan-frontend
npm start
```

The frontend will open at `http://localhost:3000`

## 📁 Project Structure

```
qscan-frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   └── scanApi.js              # Axios API client
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── layout.css
│   │   ├── common/
│   │   │   └── badges.jsx           # Reusable badge components
│   │   ├── scan/                    # (TODO: expand)
│   │   ├── cbom/                    # (TODO: expand)
│   │   ├── dashboard/               # (TODO: expand)
│   │   ├── ml/                      # (TODO: ML integration)
│   │   └── certificate/             # (TODO: expand)
│   ├── pages/
│   │   ├── Landing.jsx              # Home page ✅
│   │   ├── NewScan.jsx              # Scan form + progress ✅
│   │   ├── Results.jsx              # CBOM dashboard (basic)
│   │   ├── Certificate.jsx          # Printable cert
│   │   ├── History.jsx              # Scan history
│   │   └── pages.css
│   ├── hooks/
│   │   └── useScan.js               # Custom hooks for API
│   ├── utils/
│   │   └── pqcClassifier.js         # PQC logic & risk scoring
│   ├── styles/
│   │   └── globals.css              # Dark quantum theme
│   ├── App.js                       # Main app with routing
│   ├── index.js
│   └── index.css
├── .env                             # Environment variables
├── package.json
└── README.md
```

## 🔧 Environment Variables

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
```

For production:
```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
```

## 📚 Component Architecture

### Pages
- **Landing** (`/`) — Hero, features, stats
- **NewScan** (`/scan`) — Form + live progress
- **Results** (`/results/:scanId`) — CBOM dashboard
- **Certificate** (`/certificate/:scanId`) — Printable cert
- **History** (`/history`) — Past scans

### Hooks (src/hooks/useScan.js)
```javascript
const { scanId, loading, error, startScan } = useStartScan();
const { scan, progress, logs, refetch } = useScan(scanId);
const { results, cbom, loading, error } = useScanResults(scanId);
const { history, loading, error, deleteScan } = useScanHistory();
```

### Utilities
```javascript
import { 
  classifyPQCStatus,
  calculateRiskScore,
  formatCBOMData,
  calculateQuantumReadinessScore
} from './utils/pqcClassifier.js';
```

## 🎨 Theme & Design

All colors are defined as CSS variables in `src/styles/globals.css`:

```css
--bg-primary: #050B18        /* Dark blue-black */
--bg-secondary: #0D1B2A      /* Dark navy */
--accent-quantum: #00FFD1    /* Teal glow */
--accent-danger: #FF3B5C     /* Red */
--accent-warning: #FFB800    /* Amber */
--accent-safe: #00E676       /* Green */
```

**Fonts:**
- Display: Orbitron (futuristic)
- Body: DM Sans / Rajdhani
- Code: JetBrains Mono

## 🛠️ TODO: Components to Expand

### High Priority
1. **Results Dashboard** (`src/pages/Results.jsx`) — Add:
   - Animated quantum readiness gauge (recharts)
   - Cipher suite breakdown (donut chart)
   - Key exchange analysis (bar chart)
   - Vulnerability list with CVE references
   - Recommendations roadmap
   - Export to PDF/JSON buttons

2. **CBOM Table** (`src/components/cbom/CBOMTable.jsx`) — Create:
   - TanStack Table for sorting/filtering/pagination
   - Row expansion for certificate details
   - Multi-row selection for bulk export
   - Search bar
   - Status column with PQC glowing badges

3. **ML Risk Panel** (`src/components/ml/MLRiskPanel.jsx`) — Create:
   - Anomaly score gauge
   - HNDL risk visualization
   - Threat timeline
   - Pattern similarity matching
   - (Placeholder for ML backend integration)

### Medium Priority
4. **Dashboard Charts** (`src/components/dashboard/`) — Create:
   - QuantumReadinessGauge.jsx (Recharts pie/gauge)
   - SummaryMetricCard.jsx
   - TLS version breakdown chart
   - Risk distribution donut

5. **Certificate Details** (`src/components/cbom/CertificateDetailsRow.jsx`) — Create:
   - Subject/Issuer display
   - Expiry warnings (red if <30 days)
   - Key size indicators
   - OCSP/HSTS status

6. **Scan Components** (`src/components/scan/`) — Create:
   - BulkImportZone.jsx (drag & drop CSV)
   - ScanTypeSelector.jsx
   - ScanProgressTerminal.jsx (already in NewScan, extract)

### Lower Priority
7. **Export Functions** (`src/utils/exporters.js`) — Create:
   - PDF report generation (jsPDF + html2canvas)
   - CSV export for CBOM
   - JSON with formatting
   - Certificate PNG generation

## 🧪 Testing the App

### 1. Run with Mock Data
The API might not be ready, so test with mock data:

Edit `src/api/scanApi.js` to use mock responses if API is unavailable:

```javascript
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.response.use(
  response => response,
  error => {
    // Return mock data on error
    console.warn('API unavailable, using mock data');
    return Promise.reject(error);
  }
);
```

### 2. Add Mock CBOM File
Create `src/data/mockCBOM.json` with sample scan data for testing without backend.

### 3. Test Flow
1. Click "Start New Scan" on home page
2. Enter test domain: `pnbindia.in`
3. Click "Launch Scan"
4. See progress terminal with logs
5. Auto-redirect to results when complete
6. View CBOM table, vulnerability list, etc.

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

Creates optimized build in `build/` folder.

### Deploy to Production
Options:
- **Vercel** (recommended): `vercel deploy`
- **Netlify**: Drag & drop `build/` folder
- **AWS S3 + CloudFront**: Upload `build/` to S3
- **Docker**: See Dockerfile below

### Docker
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build & run:
```bash
docker build -t qscan-frontend .
docker run -p 3000:80 qscan-frontend
```

## 🔗 API Integration

The frontend expects these endpoints from the backend (`api.py`):

```
POST   /api/v1/scan                    Start scan
GET    /api/v1/scan/{scanId}           Poll status
GET    /api/v1/scan/{scanId}/results  Full results
GET    /api/v1/scan/{scanId}/cbom     CBOM only
GET    /api/v1/history                 Scan history
DELETE /api/v1/scan/{scanId}           Delete scan
GET    /api/v1/health                  Health check

POST   /api/v1/ml/analyze              ML risk analysis (optional)
```

See `C:\inetpub\QScan\api.py` for implementation.

## 📊 CBOM Data Structure

The Results page expects this structure from `/api/v1/scan/{scanId}/cbom`:

```javascript
{
  metadata: {
    organization_domain: "example.com",
    tool: "QScan v1.0.0",
    total_assets_scanned: 5
  },
  summary: {
    average_risk_score: 62.5,
    overall_quantum_readiness: "NOT_READY",
    risk_distribution: { CRITICAL: 1, HIGH: 2, MEDIUM: 2 }
  },
  crypto_assets: [
    {
      host: "api.example.com",
      port: 443,
      tls_version: "TLSv1.3",
      cipher_suite: "TLS_AES_256_GCM_SHA384",
      cipher_analysis: { ... },
      certificate: { ... },
      quantum_risk_score: 75,
      quantum_risk_level: "MEDIUM",
      pqc_status: "MIGRATION_NEEDED"
    },
    // ... more assets
  ]
}
```

## 🎯 Next Steps

1. **Start the backend:**
   ```bash
   cd C:\inetpub\QScan
   python api.py
   ```

2. **Start the frontend:**
   ```bash
   cd C:\Users\subhanshu\qscan-frontend
   npm start
   ```

3. **Test a scan:**
   - Go to http://localhost:3000
   - Click "Start New Scan"
   - Enter a domain (e.g., `example.com`)
   - Monitor progress and results

4. **Expand components:**
   - Follow the TODOs above
   - Add charts, export functions, ML panel
   - Improve Results page with detailed views

5. **Deploy:**
   - Build: `npm run build`
   - Deploy to Vercel, Netlify, or Docker

## 📖 Additional Resources

- [React Router Docs](https://reactrouter.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)
- [TanStack Table](https://tanstack.com/table/v8/)
- [Lucide Icons](https://lucide.dev/)
- [React Hot Toast](https://react-hot-toast.com/)

## ❓ Troubleshooting

**API Connection Error?**
- Ensure `python api.py` is running on `localhost:8000`
- Check `.env` for correct `REACT_APP_API_URL`
- Browser console shows errors

**Styling not loading?**
- Run `npm start` again
- Clear browser cache (Ctrl+Shift+Delete)
- Check `src/styles/globals.css` is imported

**Animations too slow?**
- Reduce motion in component props: `initial={{ }}` etc.
- Or disable in accessibility settings

## 📞 Support

For questions or issues, check:
1. Browser console (F12 → Console tab)
2. Network tab to see API calls
3. Backend logs from `python api.py`

---

**Happy coding! 🚀**

Built with React, Framer Motion, and Quantum-Safe Vibes 🔐✨
