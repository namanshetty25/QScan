# 🗺️ QScan Project Map & File Reference

## Project Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                          QSCAN COMPLETE STACK                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────┐    ┌──────────────────────────────┐ │
│  │  FRONTEND (React)           │    │  BACKEND (FastAPI)           │ │
│  │  Port: 3000                 │    │  Port: 8000                  │ │
│  ├─────────────────────────────┤    ├──────────────────────────────┤ │
│  │                             │    │                              │ │
│  │ Landing Page (/)            │    │ api.py (REST Wrapper)        │ │
│  │ NewScan Page (/scan)        │◄──►│ - Start scan                 │ │
│  │ Results Page (/results/:id) │    │ - Poll status                │ │
│  │ Certificate Page            │    │ - Get CBOM                   │ │
│  │ History Page                │    │ - Get history                │ │
│  │                             │    │                              │ │
│  │ Custom Hooks                │    │ Scanner Modules              │ │
│  │ useScan()                   │    │ - Asset discovery            │ │
│  │ useScanResults()            │    │ - Port scanning              │ │
│  │ useStartScan()              │    │ - TLS analysis               │ │
│  │                             │    │ - Cipher parsing             │ │
│  │ Utilities                   │    │                              │ │
│  │ pqcClassifier.js            │    │ CBOM Generation              │ │
│  │ - Risk scoring              │    │ - Bill of materials          │ │
│  │ - PQC classification        │    │ - Crypto asset list          │ │
│  │                             │    │                              │
│  └─────────────────────────────┘    └──────────────────────────────┘
│
└────────────────────────────────────────────────────────────────────────┘
```

---

## File Tree: FRONTEND

```
C:\Users\subhanshu\qscan-frontend/
│
├── 📄 GETTING_STARTED.md          ← START HERE (5 min quick start)
├── 📄 FRONTEND_SETUP.md           ← Detailed dev guide
├── 📄 package.json                ← NPM dependencies
├── 📄 .env                        ← API URL config
├── 📄 .gitignore
│
├── public/
│   └── 📄 index.html              ← HTML entry point
│
└── src/
    ├── 📄 App.js                  ← Main app with routing (UPDATED)
    ├── 📄 index.js                ← React DOM render
    ├── 📄 index.css               ← Imports globals.css
    │
    ├── api/
    │   └── 📄 scanApi.js          ← Axios API client for backend
    │
    ├── components/
    │   ├── layout/
    │   │   ├── 📄 Navbar.jsx      ← Top navigation
    │   │   ├── 📄 Footer.jsx      ← Bottom info
    │   │   └── 📄 layout.css      ← Nav/footer styling
    │   │
    │   └── common/
    │       └── 📄 badges.jsx      ← Risk, TLS, PQC badges
    │
    ├── pages/
    │   ├── 📄 Landing.jsx         ← Home page (hero + features)
    │   ├── 📄 NewScan.jsx         ← Scan form + progress
    │   ├── 📄 Results.jsx         ← CBOM dashboard
    │   ├── 📄 Certificate.jsx     ← Printable cert
    │   ├── 📄 History.jsx         ← Scan history
    │   └── 📄 pages.css           ← All page styling
    │
    ├── hooks/
    │   └── 📄 useScan.js          ← 4 custom React hooks
    │
    ├── utils/
    │   └── 📄 pqcClassifier.js    ← PQC logic + risk scoring
    │
    └── styles/
        └── 📄 globals.css         ← Dark quantum theme (COMPLETE)
```

---

## File Tree: BACKEND

```
C:\inetpub\QScan/
│
├── 📄 README_COMPLETE.md          ← Full project overview
├── 📄 BACKEND_SETUP.md            ← API & deployment guide
├── 📄 requirements.txt            ← Dependencies (UPDATED)
│
├── 🆕 📄 api.py                   ← FastAPI REST wrapper (NEW!)
│   ├── Pydantic models
│   ├── FastAPI endpoints
│   ├── Background scan task
│   └── CORS middleware
│
├── 📄 main.py                     ← Original CLI tool
│
├── config/
│   └── 📄 settings.py             ← Scan configuration
│
├── scanner/
│   ├── 📄 asset_discovery.py      ← DNS + CT logs
│   ├── 📄 port_scanner.py         ← Port scanning
│   └── 📄 tls_scanner.py          ← TLS analysis
│
├── crypto/
│   ├── 📄 cipher_parser.py        ← Parse ciphers
│   └── 📄 pqc_classifier.py       ← PQC classification
│
├── cbom/
│   └── 📄 cbom_generator.py       ← CBOM generation
│
├── utils/
│   └── 📄 logger.py               ← Logging setup
│
└── results/                       ← Output directory (auto-created)
    └── <domain>_<timestamp>/
        ├── cbom.json
        └── scan_results.json
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────┐
│    USER INTERFACE (FRONTEND)         │
│  http://localhost:3000               │
├─────────────────────────────────────┤
│ Click "Start New Scan"               │
│ Enter target: api.example.com        │
│ Click "→ Launch Scan"                │
└──────────────────┬──────────────────┘
                   │
                   ▼ POST /api/v1/scan
        ┌──────────────────────┐
        │ FastAPI Backend      │
        │ (http://localhost:8000)
        ├──────────────────────┤
        │ ScanManager          │
        │ - Creates scan_id    │
        │ - Launches async task│
        │ Returns: scan_id     │
        └──────────┬───────────┘
                   │
        ┌──────────▼────────────┐
        │ Background Task       │
        │ (run_scan_task)       │
        ├───────────────────────┤
        │ 1. Asset Discovery    │
        │ 2. Port Scanning      │
        │ 3. TLS Analysis       │
        │ 4. Crypto Parsing     │
        │ 5. CBOM Generation    │
        │ Updates progress      │
        │ Saves to results/     │
        └──────────┬────────────┘
                   │
┌──────────────────▼──────────────────┐
│    FRONTEND POLLING (2s interval)    │
│ GET /api/v1/scan/{scanId}            │
├──────────────────────────────────────┤
│ - Check status (running/complete)    │
│ - Update progress bar (0-100%)        │
│ - Append logs to terminal display     │
│ Loop until status = "complete"       │
└──────────────────┬───────────────────┘
                   │
        ┌──────────▼────────────┐
        │ Scan Complete!         │
        │ Auto-redirect to       │
        │ /results/{scanId}      │
        └──────────┬────────────┘
                   │
        ┌──────────▼────────────┐
        │ Results Page          │
        │ GET /results/:scanId   │
        ├───────────────────────┤
        │ Fetches full CBOM      │
        │ Displays:              │
        │ - Risk score           │
        │ - Asset metrics        │
        │ - CBOM table           │
        │ - Vulnerabilities      │
        └───────────────────────┘
```

---

## Component Tree: React Components

```
App.jsx
├── Navbar.jsx
│   ├── Logo (with spinning animation)
│   ├── Navigation Links
│   └── API Status Badge
│
├── Routes
│   ├── Landing.jsx
│   │   ├── Hero Section (with scanline overlay)
│   │   ├── Feature Cards (3x)
│   │   ├── Stats Cards (animated counters)
│   │   └── NIST Badges
│   │
│   ├── NewScan.jsx
│   │   ├── Form
│   │   │   ├── Tab Selector (Single/Bulk)
│   │   │   ├── Target Input
│   │   │   ├── Scan Type Checkboxes
│   │   │   └── Discovery Toggle
│   │   │
│   │   └── ScanProgress (conditional)
│   │       ├── Progress Bar
│   │       └── Terminal Output (live logs)
│   │
│   ├── Results.jsx
│   │   ├── Dashboard Header
│   │   ├── Metric Cards (6x)
│   │   │   ├── Total Assets
│   │   │   ├── Critical Count
│   │   │   ├── PQC Ready Count
│   │   │   └── etc.
│   │   │
│   │   └── CBOM Table
│   │       ├── Host:Port
│   │       ├── TLS Version
│   │       ├── Cipher Suite
│   │       ├── PQC Status (with badge)
│   │       └── Risk Level
│   │
│   ├── Certificate.jsx
│   │   ├── Quantum-Safe Shield
│   │   ├── Cert Info Box
│   │   ├── Algorithm List
│   │   └── Print Button
│   │
│   └── History.jsx
│       ├── Search Bar
│       └── History Table
│           ├── Scan ID
│           ├── Target
│           ├── Date
│           ├── Assets Found
│           ├── Risk Score (with badge)
│           └── Actions (View/Delete)
│
└── Footer.jsx
    ├── Links Section
    ├── Resources
    └── Copyright
```

---

## Hook Usage Reference

```javascript
// In NewScan.jsx
const { scanId, loading, error, startScan } = useStartScan();
const { scan, progress, logs } = useScan(scanId);

// In Results.jsx
const { results, cbom, loading, error } = useScanResults(scanId);

// In History.jsx
const { history, loading, error, deleteScan } = useScanHistory();
```

---

## API Endpoint Reference

```
BASE: http://localhost:8000

START SCAN
POST   /api/v1/scan
Body:  { target, scan_types[], discover, ports }
Response: { scan_id, status, message }

POLL STATUS
GET    /api/v1/scan/{scanId}
Response: { scan_id, status, progress, logs, error }

GET RESULTS
GET    /api/v1/scan/{scanId}/results
Response: { scan_id, target, cbom, scan_results, assets_found, risk_score }

GET CBOM
GET    /api/v1/scan/{scanId}/cbom
Response: { metadata, summary, crypto_assets }

HISTORY
GET    /api/v1/history
Response: [{ scan_id, target, timestamp, assets_found, risk_score, status }]

DELETE SCAN
DELETE /api/v1/scan/{scanId}
Response: { message }

HEALTH CHECK
GET    /api/v1/health
Response: { status }
```

---

## Environment Setup

```env
# Frontend: C:\Users\subhanshu\qscan-frontend\.env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development

# For production:
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
```

---

## Color System Reference

```css
/* Primary Colors */
--bg-primary: #050B18             /* Deep space black */
--bg-secondary: #0D1B2A           /* Dark navy */
--bg-card: #0F2235                /* Card background */

/* Accent Colors */
--accent-quantum: #00FFD1         /* Neon teal (MAIN) */
--accent-danger: #FF3B5C          /* Critical red */
--accent-warning: #FFB800         /* Amber warning */
--accent-safe: #00E676            /* Safe green */
--accent-blue: #4FC3F7            /* Info blue */

/* Text Colors */
--text-primary: #E8F4FD           /* Main text */
--text-muted: #6B8FA8             /* Secondary text */

/* Effects */
--border: #1A3A5C                 /* Border color */
--shadow-glow: 0 0 20px rgba(0, 255, 209, 0.3)
--shadow-glow-red: 0 0 20px rgba(255, 59, 92, 0.3)
```

---

## Quick Command Reference

```bash
# Backend
cd C:\inetpub\QScan
pip install -r requirements.txt
python api.py                    # Starts on port 8000

# Frontend
cd C:\Users\subhanshu\qscan-frontend
npm install                      # (already done, optional)
npm start                        # Starts on port 3000
npm run build                    # Production build
npm run eject                    # (careful: one-way)

# Testing
curl http://localhost:8000/api/v1/health
curl http://localhost:3000       # Should load page
```

---

## Success Indicators

✅ Backend running: `api.py` shows no errors  
✅ Frontend running: `npm start` compiles successfully  
✅ Browser loads: http://localhost:3000 shows dark theme  
✅ Can scan: Click "Start Scan" → shows form  
✅ Live progress: Terminal shows logs in real-time  
✅ Can redirect: Auto-goes to /results when done  
✅ Can view history: Click "History" → shows list  
✅ Can print cert: Click "Print" → Ctrl+P works  

---

## Production Deployment Checklist

- [ ] Build frontend: `npm run build`
- [ ] Set REACT_APP_API_URL to production API
- [ ] Deploy frontend to Vercel/Netlify/S3
- [ ] Secure backend API with authentication
- [ ] Enable HTTPS on both frontend and backend
- [ ] Set up CORS to production domain
- [ ] Configure database for persistence
- [ ] Add monitoring and error tracking
- [ ] Set up CI/CD pipeline
- [ ] Load test the scanners

---

## Documentation Map

| Document | Location | Purpose |
|----------|----------|---------|
| GETTING_STARTED.md | Frontend root | 5-min quick start |
| FRONTEND_SETUP.md | Frontend root | Dev guide & TODOs |
| BACKEND_SETUP.md | Backend root | API reference |
| README_COMPLETE.md | Backend root | Project overview |

---

**Navigate to any section above for detailed information! 🗺️**
