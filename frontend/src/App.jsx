import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

import Homepage from './pages/Homepage/Homepage';
import Products from './pages/Products/Products';
import QuoteRequest from './pages/QuoteRequest/QuoteRequest';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AIAssistant from './components/AIAssistant';
import PricingAndSpecs from './components/PricingAndSpecs';
import ThemeToggle from './components/ThemeToggle';

// Internal Navigation Component to use router location hooks correctly under BrowserRouter
function NavigationBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Auth Tab Control: 'login' or 'signup'
  const [authTab, setAuthTab] = useState('login');
  
  // Login Type Control for credentials: 'email' or 'phone'
  const [loginMethod, setLoginMethod] = useState('email');

  // Input States
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Hover states for interactive buttons
  const [hoverBtn, setHoverBtn] = useState('');

  // Router location hook to track active page
  const location = useLocation();

  // Handle header shrinking on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setUserLoggedIn(true);
    setShowLoginModal(false);
    alert(authTab === 'login' ? 'Successfully authenticated!' : 'Account registered successfully!');
  };

  const triggerForgotPassword = () => {
    alert('Password reset link has been transmitted to your registered device.');
  };

  const triggerForgotUsername = () => {
    alert('Search query dispatched: Your username or email has been sent to your registered contact method.');
  };

  const triggerForgotPhone = () => {
    alert('Search query dispatched: Your phone number recovery instructions have been sent to your registered contact method.');
  };

  // Helper function to render stylish navigation pill buttons with active state indication
  const renderNavLink = (path, label, id) => {
    const isHovered = hoverBtn === id;
    const isActive = location.pathname === path;

    return (
      <Link
        to={path}
        onMouseEnter={() => setHoverBtn(id)}
        onMouseLeave={() => setHoverBtn('')}
        style={{
          color: isActive || isHovered ? '#FFFFFF' : 'var(--text-main, #FFFFFF)',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '13px',
          padding: '8px 14px',
          borderRadius: '6px',
          backgroundColor: isActive 
            ? 'var(--timber-accent, #C25E14)' 
            : isHovered 
              ? 'var(--input-hover, #1E3E66)' 
              : 'var(--card-bg, rgba(255, 255, 255, 0.05))',
          border: '1px solid',
          borderColor: isActive || isHovered ? 'var(--timber-accent, #C25E14)' : 'var(--border-color, rgba(255, 255, 255, 0.15))',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isHovered || isActive ? '0 4px 10px rgba(0,0,0,0.2)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* SOLID FIXED HEADER */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxSizing: 'border-box',
        backgroundColor: 'var(--navy-brand, #0B1D33)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isScrolled ? '12px 40px' : '18px 40px',
        transition: 'all 0.3s ease-in-out',
        borderBottom: '2px solid var(--timber-accent, #C25E14)',
        boxShadow: isScrolled ? '0 4px 12px rgba(0,0,0,0.25)' : 'none'
      }}>
        {/* Brand Logo Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            backgroundColor: 'var(--timber-accent, #C25E14)',
            width: isScrolled ? '32px' : '40px',
            height: isScrolled ? '32px' : '40px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: isScrolled ? '14px' : '18px',
            transition: 'all 0.3s',
            boxShadow: '0 2px 8px rgba(194, 94, 20, 0.4)'
          }}>
            G
          </div>
          <span style={{ 
            color: '#FFFFFF', 
            fontWeight: '800', 
            fontSize: isScrolled ? '18px' : '22px', 
            letterSpacing: '1px',
            transition: 'all 0.3s'
          }}>
            GERRY'S DOCKS
          </span>
        </div>

        {/* Navigation Links, Theme Switcher & Sign In Button */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {renderNavLink('/', 'Home', 'nav-home')}
          {renderNavLink('/products', 'Catalog', 'nav-catalog')}
          {renderNavLink('/specs', 'Pricing & Specs', 'nav-specs')}
          {renderNavLink('/quote', 'Request Quote', 'nav-quote')}
          {renderNavLink('/admin', 'Admin Console', 'nav-admin')}
          
          {/* Theme Switcher Button */}
          <ThemeToggle />

          {/* Authentication Action Button */}
          {userLoggedIn ? (
            <button 
              onClick={() => { setUserLoggedIn(false); alert('Successfully logged out.'); }}
              onMouseEnter={() => setHoverBtn('signout')}
              onMouseLeave={() => setHoverBtn('')}
              style={{
                backgroundColor: hoverBtn === 'signout' ? 'rgba(194, 94, 20, 0.15)' : 'transparent',
                border: '1px solid var(--timber-accent, #C25E14)',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
                transform: hoverBtn === 'signout' ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.2s ease'
              }}
            >
              Sign Out
            </button>
          ) : (
            <button 
              onClick={() => { setAuthTab('login'); setShowLoginModal(true); }}
              onMouseEnter={() => setHoverBtn('signin')}
              onMouseLeave={() => setHoverBtn('')}
              style={{
                backgroundColor: hoverBtn === 'signin' ? 'var(--timber-hover, #A14D10)' : 'var(--timber-accent, #C25E14)',
                border: 'none',
                color: 'white',
                padding: '8px 18px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: hoverBtn === 'signin' ? '0 4px 12px rgba(194, 94, 20, 0.4)' : '0 2px 6px rgba(0,0,0,0.2)',
                transform: hoverBtn === 'signin' ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
          )}
        </nav>
      </header>

      {/* COMPREHENSIVE SIGN IN & SIGN UP MODAL */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(11, 29, 51, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg, #FFFFFF)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--border-color, #E2E8F0)'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                color: 'var(--text-muted, #718096)',
                zIndex: 10
              }}
            >
              ✕
            </button>

            {/* Top Interactive Tabs (Sign In vs Sign Up) */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>
              <button 
                onClick={() => setAuthTab('login')}
                style={{
                  flex: 1,
                  padding: '18px',
                  border: 'none',
                  background: authTab === 'login' ? 'var(--card-bg, #FFFFFF)' : 'var(--input-bg, #F7FAFC)',
                  color: authTab === 'login' ? 'var(--text-main, #0B1D33)' : 'var(--text-muted, #718096)',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  borderBottom: authTab === 'login' ? '3px solid var(--timber-accent, #C25E14)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Sign In
              </button>
              <button 
                onClick={() => setAuthTab('signup')}
                style={{
                  flex: 1,
                  padding: '18px',
                  border: 'none',
                  background: authTab === 'signup' ? 'var(--card-bg, #FFFFFF)' : 'var(--input-bg, #F7FAFC)',
                  color: authTab === 'signup' ? 'var(--text-main, #0B1D33)' : 'var(--text-muted, #718096)',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  borderBottom: authTab === 'signup' ? '3px solid var(--timber-accent, #C25E14)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Create Account
              </button>
            </div>

            <div style={{ padding: '30px 40px 40px 40px' }}>
              <h3 style={{ color: 'var(--text-main, #0B1D33)', margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800' }}>
                {authTab === 'login' ? 'Welcome Back' : 'Get Started with Gerry\'s Docks'}
              </h3>
              <p style={{ color: 'var(--text-muted, #718096)', fontSize: '14px', margin: '0 0 25px 0' }}>
                {authTab === 'login' ? 'Sign in to access your saved quote specifications.' : 'Set up a portal profile to build custom waterfront layouts.'}
              </p>

              {/* Login Method Toggle (Email vs Phone) */}
              {authTab === 'login' && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', backgroundColor: 'var(--input-bg, #F7FAFC)', padding: '4px', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backgroundColor: loginMethod === 'email' ? 'var(--card-bg, white)' : 'transparent',
                      color: loginMethod === 'email' ? 'var(--text-main, #0B1D33)' : 'var(--text-muted, #718096)',
                      boxShadow: loginMethod === 'email' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    Email Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('phone')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backgroundColor: loginMethod === 'phone' ? 'var(--card-bg, white)' : 'transparent',
                      color: loginMethod === 'phone' ? 'var(--text-main, #0B1D33)' : 'var(--text-muted, #718096)',
                      boxShadow: loginMethod === 'phone' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    Phone Number
                  </button>
                </div>
              )}

              {/* PRIMARY CREDENTIAL FORM - COMES FIRST */}
              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {authTab === 'signup' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted, #4A5568)', textTransform: 'uppercase', marginBottom: '5px' }}>Full Name</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe" 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color, #CBD5E0)', backgroundColor: 'var(--input-bg, white)', color: 'var(--text-main, black)', boxSizing: 'border-box', fontSize: '14px' }} 
                    />
                  </div>
                )}

                {/* Conditional Inputs based on Tab & Method */}
                {(authTab === 'signup' || loginMethod === 'email') ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted, #4A5568)', textTransform: 'uppercase' }}>Email Address</label>
                      {authTab === 'login' && (
                        <button 
                          type="button" 
                          onClick={triggerForgotUsername}
                          style={{ background: 'none', border: 'none', color: 'var(--timber-accent, #C25E14)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                        >
                          Forgot Username or Email?
                        </button>
                      )}
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gmail.com" 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color, #CBD5E0)', backgroundColor: 'var(--input-bg, white)', color: 'var(--text-main, black)', boxSizing: 'border-box', fontSize: '14px' }} 
                    />
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted, #4A5568)', textTransform: 'uppercase' }}>Phone Number</label>
                      {authTab === 'login' && (
                        <button 
                          type="button" 
                          onClick={triggerForgotPhone}
                          style={{ background: 'none', border: 'none', color: 'var(--timber-accent, #C25E14)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                        >
                          Forgot Phone Number?
                        </button>
                      )}
                    </div>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000" 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color, #CBD5E0)', backgroundColor: 'var(--input-bg, white)', color: 'var(--text-main, black)', boxSizing: 'border-box', fontSize: '14px' }} 
                    />
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted, #4A5568)', textTransform: 'uppercase' }}>Password</label>
                    {authTab === 'login' && (
                      <button 
                        type="button" 
                        onClick={triggerForgotPassword}
                        style={{ background: 'none', border: 'none', color: 'var(--timber-accent, #C25E14)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color, #CBD5E0)', backgroundColor: 'var(--input-bg, white)', color: 'var(--text-main, black)', boxSizing: 'border-box', fontSize: '14px' }} 
                  />
                </div>

                {/* Remember Me */}
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginTop: '5px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted, #4A5568)' }}>
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: 'var(--timber-accent, #C25E14)' }}
                    />
                    Remember me
                  </label>
                </div>

                {/* Primary Action Button */}
                <button 
                  type="submit" 
                  style={{
                    backgroundColor: hoverBtn === 'submit' ? 'var(--timber-hover, #A14D10)' : 'var(--timber-accent, #C25E14)',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '5px',
                    fontSize: '15px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={() => setHoverBtn('submit')}
                  onMouseLeave={() => setHoverBtn('')}
                >
                  {authTab === 'login' ? 'Sign In Securely' : 'Complete Registration'}
                </button>
              </form>

              {/* SOCIAL SIGN IN PATHS - PLACED AT THE BOTTOM */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '25px 0 15px 0' }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color, #E2E8F0)' }} />
                <span style={{ padding: '0 15px', color: 'var(--text-muted, #A0AEC0)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Or Sign In With</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color, #E2E8F0)' }} />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  onClick={() => alert('Social sign-in module triggered: Google OAuth active.')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '10px',
                    border: '1px solid var(--border-color, #E2E8F0)',
                    borderRadius: '6px',
                    backgroundColor: hoverBtn === 'google' ? 'var(--input-hover, #F7FAFC)' : 'var(--card-bg, white)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-main, #4A5568)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={() => setHoverBtn('google')}
                  onMouseLeave={() => setHoverBtn('')}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#EA4335" d="M9 3.6c1.6 0 3 .6 4.1 1.6l3-3C14.3.8 11.8 0 9 0 5.5 0 2.5 2 1 5l3.2 2.5C5 5.2 6.8 3.6 9 3.6z"/>
                    <path fill="#4285F4" d="M17.6 9.2c0-.6 0-1.2-.1-1.7H9v3.3h4.8c-.2 1-.8 1.8-1.6 2.4l2.5 2c1.5-1.4 2.4-3.5 2.4-6z"/>
                    <path fill="#FBBC05" d="M4.2 10.7c-.2-.6-.3-1.2-.3-1.7s.1-1.1.3-1.7L1 4.8C.3 6 .0 7.4.0 9s.3 3 .9 4.2l3.3-2.5z"/>
                    <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.5-2c-.9.6-2.1 1-3.5 1-2.2 0-4-1.6-4.7-3.8L1 13.5C2.5 16 5.5 18 9 18z"/>
                  </svg>
                  Google
                </button>
                <button 
                  onClick={() => alert('Social sign-in module triggered: Apple Authentication active.')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '10px',
                    border: '1px solid var(--border-color, #E2E8F0)',
                    borderRadius: '6px',
                    backgroundColor: hoverBtn === 'apple' ? 'var(--input-hover, #F7FAFC)' : 'var(--card-bg, white)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-main, #4A5568)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={() => setHoverBtn('apple')}
                  onMouseLeave={() => setHoverBtn('')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.1.09 2.22-.58 2.94-1.39z"/>
                  </svg>
                  Apple
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavigationBar />
      {/* TOP PADDING */}
      <div style={{ paddingTop: '80px' }}>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/specs" element={<PricingAndSpecs />}  />
          <Route path="/quote" element={<QuoteRequest />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
      <AIAssistant />
    </BrowserRouter>
  );
}

export default App;