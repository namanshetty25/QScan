import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './styles/globals.css';

// Pages
import Landing from './pages/Landing';
import NewScan from './pages/NewScan';
import Results from './pages/Results';
import Certificate from './pages/Certificate';
import History from './pages/History';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// API
import { scanApi } from './api/scanApi';

function App() {
  useEffect(() => {
    // Check API connectivity
    scanApi.health()
      .then(() => console.log('✓ API connected'))
      .catch(() => console.warn('⚠ API not available - using mock data'));
  }, []);

  return (
    <BrowserRouter>
      <div className="bg-primary" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/scan" element={<NewScan />} />
            <Route path="/results/:scanId" element={<Results />} />
            <Route path="/certificate/:scanId" element={<Certificate />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}

export default App;
