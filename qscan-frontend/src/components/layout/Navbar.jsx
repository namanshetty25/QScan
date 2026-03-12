import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
import './layout.css';

function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-logo">
            <Activity size={28} />
            <span>QScan</span>
          </Link>

          <div className="navbar-menu">
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              Home
            </Link>
            <Link to="/scan" className={`nav-link ${isActive('/scan')}`}>
              New Scan
            </Link>
            <Link to="/history" className={`nav-link ${isActive('/history')}`}>
              History
            </Link>
          </div>

          <div className="navbar-right">
            <span className="status-badge">
              <span className="status-dot"></span>
              API Connected
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
