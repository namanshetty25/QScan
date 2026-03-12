import React from 'react';
import './layout.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>QScan</h4>
            <p>Quantum-Ready Cybersecurity Assessment Platform for Banking Infrastructure</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/scan">New Scan</a></li>
              <li><a href="/history">Scan History</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><a href="https://csrc.nist.gov/projects/post-quantum-cryptography/" target="_blank" rel="noreferrer">NIST PQC</a></li>
              <li><a href="https://www.cisa.gov/" target="_blank" rel="noreferrer">CISA</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>About</h4>
            <p>PNB Cybersecurity Hackathon 2025-26<br />Version 1.0.0</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} QScan. All Rights Reserved. | Built for Secure Banking Infrastructure</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
