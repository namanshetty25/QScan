# ⚡ QScan Getting Started (5-Minute Quick Start)

## What You Have

✅ **Complete React Frontend**  
Location: `C:\Users\subhanshu\qscan-frontend`

✅ **FastAPI Backend with CLI Integration**  
Location: `C:\inetpub\QScan`  
New file: `api.py`

✅ **All 5 Pages Built**
- Landing (`/`)
- New Scan (`/scan`)
- Results (`/results/:scanId`)
- Certificate (`/certificate/:scanId`)
- History (`/history`)

✅ **Ready-to-Use Components**
- Navbar, Footer, Badges
- Hooks (useScan, useScanResults, etc.)
- PQC classifier and risk scoring
- API client with error handling

---

## 🔥 Run It NOW (5 minutes)

### Terminal 1: START THE BACKEND
```bash
cd C:\inetpub\QScan
pip install -r requirements.txt
python api.py
```

✅ You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2: START THE FRONTEND
```bash
cd C:\Users\subhanshu\qscan-frontend
npm start
```

✅ You should see:
```
Compiled successfully!
```

### Open Browser
Go to: **http://localhost:3000**

✅ See QScan homepage with dark theme and glowing accents!

---

## 🧪 Test a Scan (2 minutes)

1. Click **"Start New Scan"**
2. Enter: `pnbindia.in`
3. Keep defaults (TLS Analysis, Certificate Validation only)
4. Click **"→ Launch Scan"**
5. Watch live progress terminal (logs appear in real-time)
6. Wait for completion (~30-60 seconds)
7. Auto-redirects to results page
8. See CBOM table with assets

---

## 📁 File Locations (Reference)

| Component | Location | Status |
|-----------|----------|--------|
| **React App** | `C:\Users\subhanshu\qscan-frontend` | ✅ Ready |
| **Backend API** | `C:\inetpub\QScan\api.py` | ✅ Ready |
| **Global Styles** | `src/styles/globals.css` | ✅ Complete Dark Theme |
| **Pages** | `src/pages/` | ✅ All 5 Built |
| **Hooks** | `src/hooks/useScan.js` | ✅ All 4 Hooks |
| **Utils** | `src/utils/pqcClassifier.js` | ✅ PQC Logic |
| **Components** | `src/components/` | ✅ Layout + Common |

---

## 🎨 What You'll See

### Landing Page
- Animated hero with scanline overlay
- 3 feature cards with hover effects
- Live statistics (animated counters)
- NIST algorithm badges
- CTA buttons ("Start Scan" / "View History")

### New Scan Page
- Form with target input
- Checkboxes for scan types
- Progress terminal (shows live logs)
- Progress bar (0-100%)
- Auto-redirect on completion

### Results Page
- Quantum Readiness Score display
- Metrics grid (assets, risks, PQC count)
- CBOM table (sortable columns):
  - Asset endpoint
  - TLS version (with color coding)
  - Cipher suite
  - PQC status
  - Risk level
  - Actions (View, Delete, etc.)
- Raw CBOM JSON viewer (expandable)

### History Page
- Search/filter by domain
- Table of past scans
- Risk score badges
- Delete & view action buttons

### Certificate Page
- Printable quantum-safe certificate
- Scan date, assets, readiness score
- Print button (Ctrl+P works)

---

## 🚀 Next Steps (After Running)

### Want to Expand? Pick One:

**Easy (2-4 hours)**
- [ ] Add donut chart for cipher suite breakdown
- [ ] Build TLS version stacked bar chart
- [ ] Create expanded vulnerability list with icons
- [ ] Add CSV export button

**Medium (4-8 hours)**
- [ ] Complete CBOM table with TanStack Table (sort, filter, paginate)
- [ ] Add certificate details row expansion
- [ ] Build migration roadmap with steps
- [ ] Create PDF export with jsPDF

**Hard (8+ hours)**
- [ ] Build ML risk analysis panel
- [ ] Add anomaly detection results display
- [ ] Implement risk timeline visualization
- [ ] Create admin dashboard for bulk operations

---

## 📚 Full Documentation

Want details? See:

1. **Backend Setup:** [C:\inetpub\QScan\BACKEND_SETUP.md](../../inetpub/QScan/BACKEND_SETUP.md)
   - API endpoints reference
   - Testing with curl/Python
   - Docker deployment

2. **Frontend Setup:** [FRONTEND_SETUP.md](FRONTEND_SETUP.md)
   - Component architecture
   - Hook usage
   - Theme customization
   - Deployment options

3. **Complete README:** [C:\inetpub\QScan\README_COMPLETE.md](../../inetpub/QScan/README_COMPLETE.md)
   - Full project overview
   - Design system
   - PQC logic
   - Troubleshooting

---

## ✨ Current Capabilities

✅ **Backend**
- Scan domains for TLS/crypto configurations
- Generate CBOM (Cryptographic Bill of Materials)
- Classify PQC readiness (using NIST standards)
- Calculate quantum risk scores
- Store scan history in memory
- Provide REST API for frontend

✅ **Frontend**
- Beautiful dark quantum theme
- Real-time scan progress monitoring
- CBOM results visualization
- Scan history with filtering
- PQC certificate generation
- Responsive design (desktop + tablet)

⏳ **Coming Soon (Optional)**
- Advanced charts (cipher analysis, risk breakdown)
- PDF report generation
- Bulk CSV import
- ML-based anomaly detection
- User authentication
- Database persistence
- Kubernetes deployment
- Real-time WebSocket updates

---

## 🆘 Quick Troubleshooting

**Backend won't start?**
```bash
pip install -r requirements.txt  # Re-install deps
python api.py  # Try again
```

**Frontend won't compile?**
```bash
cd C:\Users\subhanshu\qscan-frontend
npm install --legacy-peer-deps  # Reinstall deps
npm start
```

**Port already in use?**
```bash
# Try different port
python -m uvicorn api:app --port 8001
```

**Scan appears stuck?**
- Check backend console for errors
- Ensure target domain is reachable
- Try `ping pnbindia.in` from terminal

---

## 🎯 Success Checklist

- [ ] Both terminal windows running without errors
- [ ] Browser shows QScan landing page
- [ ] Can see dark theme with teal glows
- [ ] Click "Start Scan" opens form
- [ ] Enter domain, click launch
- [ ] See live progress logs
- [ ] Results display with CBOM table
- [ ] Can filter history
- [ ] Can view certificate
- [ ] Can print certificate (Ctrl+P)

**If all checked ✓ → YOU'RE DONE! 🎉**

---

## 🤝 Need Help?

1. **Check browser console** (F12)
   - Look for red error messages
   - Check Network tab
   - Try disabling extensions

2. **Check backend terminal**
   - Look for Python errors
   - Verify port 8000 is open
   - Check for timeout messages

3. **Read the full docs**
   - Jump to BACKEND_SETUP.md
   - Read FRONTEND_SETUP.md
   - Check README_COMPLETE.md

4. **Test endpoints manually**
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

---

## 📞 Summary

| What | Where | Status |
|------|-------|--------|
| Backend API | `C:\inetpub\QScan\api.py` | 🟢 Running |
| Frontend App | `C:\Users\subhanshu\qscan-frontend` | 🟢 Running |
| Database | In-memory | 🟢 Working |
| All 5 Pages | `/`, `/scan`, `/results/:id`, `/certificate/:id`, `/history` | 🟢 Complete |
| Dark Theme | globals.css | 🟢 Applied |
| API Docs | BACKEND_SETUP.md | 🟢 Complete |
| Dev Guide | FRONTEND_SETUP.md | 🟢 Complete |

---

<div align="center">

# 🚀 Ready to Launch?

## Terminal 1:
```
cd C:\inetpub\QScan && python api.py
```

## Terminal 2:
```
cd C:\Users\subhanshu\qscan-frontend && npm start
```

## Then:
```
Open http://localhost:3000
Click "Start New Scan"
Explore!
```

---

**Built for PNB Cybersecurity Hackathon 2025-26**

"Quantum-Proof Your Banking Infrastructure" 🔐⚡

</div>
