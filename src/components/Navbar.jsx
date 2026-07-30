import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 30px',
      backgroundColor: 'var(--card-bg)',
      color: 'var(--text-main)',
      borderBottom: '1px solid var(--border-color)',
      transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* Scoped CSS rule to force pure white text regardless of link state or light/dark mode */}
      <style>{`
        .navbar-brand-logo,
        .navbar-brand-logo:link,
        .navbar-brand-logo:visited,
        .navbar-brand-logo * {
          color: #FFFFFF !important;
          text-decoration: none !important;
        }
      `}</style>

      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
        <Link 
          to="/" 
          className="navbar-brand-logo"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: 'bold'
          }}
        >
          <span style={{ color: 'var(--timber-accent)' }}>⚓</span>
          <span>Gerry's Docks</span>
        </Link>
      </div>

      <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}>
          Home
        </Link>
        <Link to="/products" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}>
          Catalog
        </Link>
        <Link to="/pricing-specs" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}>
          Pricing & Specs
        </Link>
        <Link to="/quote" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}>
          Request Quote
        </Link>
        <Link to="/admin" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}>
          Admin Console
        </Link>
        
        <ThemeToggle />

        <button className="btn-primary" style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}>
          Sign In
        </button>
      </nav>
    </header>
  );
}