import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5003/api/admin';
const QUOTE_API_URL = import.meta.env.VITE_QUOTE_API_URL || 'http://localhost:5002/api/quotes';
const PRODUCT_API_URL = import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:5001/api/products';
const AUTH_ERROR_STATUSES = new Set([401, 403]);

function formatQuoteDate(createdAt) {
  if (!createdAt) return new Date().toISOString().slice(0, 10);

  if (typeof createdAt === 'string') {
    return createdAt.slice(0, 10);
  }

  if (typeof createdAt?._seconds === 'number') {
    return new Date(createdAt._seconds * 1000).toISOString().slice(0, 10);
  }

  if (typeof createdAt?.seconds === 'number') {
    return new Date(createdAt.seconds * 1000).toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function mapBackendQuote(quote) {
  const items = Array.isArray(quote.items) ? quote.items : [];
  const firstItem = items[0] || {};

  return {
    id: quote.id,
    customer: quote.customerName || quote.name || quote.contact?.name || 'Unknown User',
    email: quote.email || quote.contact?.email || 'customer@example.com',
    phone: quote.phone || quote.contact?.phone || 'Not provided',
    location: quote.location || quote.contact?.location || 'Location not provided',
    dockType: quote.dockType || firstItem.name || firstItem.productName || firstItem.productId || 'Custom dock quote',
    basePrice: Number(quote.subtotal || quote.basePrice || firstItem.priceAtTime || 0),
    status: (quote.status || 'PENDING').toUpperCase(),
    date: formatQuoteDate(quote.createdAt),
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [quoteLoadError, setQuoteLoadError] = useState('');
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);

  // Dashboard operation state & Active Tab Switcher ('overview' or 'security')
  const [activeTab, setActiveTab] = useState('overview');
  
  // Profile / Security State settings
  const [adminProfileName, setAdminProfileName] = useState('Gerry Administrator');
  const [editableEmail, setEditableEmail] = useState('admin@gerrysdocks.com');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');

  const [isHovered, setIsHovered] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    category: 'Docks',
    price: '',
    description: '',
    available: true,
  });
  const [editingProductId, setEditingProductId] = useState('');
  const [productMessage, setProductMessage] = useState('');
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1200 : window.innerWidth
  );

  // Selected Quote for Quick Response Drawer
  const [selectedQuoteForChat, setSelectedQuoteForChat] = useState(null);
  const [messageType, setMessageType] = useState('email'); // 'email' or 'sms'
  const [outboundMessageText, setOutboundMessageText] = useState('');
  const [messageSendStatus, setMessageSendStatus] = useState('');

  const isMobile = viewportWidth < 720;
  const isTablet = viewportWidth >= 720 && viewportWidth < 1040;
  const adminShellDirection = viewportWidth < 900 ? 'column' : 'row';
  const sidebarWidth = viewportWidth < 900 ? '100%' : '280px';
  const productFormColumns = isMobile
    ? '1fr'
    : isTablet
      ? 'repeat(2, minmax(0, 1fr))'
      : 'minmax(0, 1.1fr) minmax(0, 0.7fr) minmax(0, 0.5fr) minmax(0, 1.4fr) auto';
  const contentGridColumns = viewportWidth < 1100 ? '1fr' : 'minmax(0, 2.5fr) minmax(260px, 1fr)';

  const getAdminToken = () => localStorage.getItem('gerrysAdminToken');

  const clearAdminSession = (message = 'Admin session expired. Please sign in again.') => {
    setIsAuthenticated(false);
    localStorage.removeItem('gerrysAdminToken');
    localStorage.removeItem('gerrysAdminEmail');
    setPassword('');
    setShowPassword(false);
    setQuoteLoadError('');
    setProductMessage('');
    setQuotes([]);
    setLoginError(message);
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(PRODUCT_API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load products.');
      }

      setProducts(Array.isArray(data) ? data : []);
      setProductMessage('');
    } catch (error) {
      setProductMessage(error.message || 'Unable to load products.');
    }
  };

  const loadQuotes = async (token) => {
    if (!token) return;

    setIsLoadingQuotes(true);
    setQuoteLoadError('');

    try {
      const response = await fetch(QUOTE_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (AUTH_ERROR_STATUSES.has(response.status)) {
          clearAdminSession('Admin session expired. Please sign in again.');
          return;
        }

        throw new Error(data.error || 'Unable to load quote requests.');
      }

      const backendQuotes = Array.isArray(data) ? data.map(mapBackendQuote) : [];
      setQuotes(backendQuotes);
    } catch (error) {
      setQuoteLoadError(error.message || 'Unable to load quote requests.');
      setQuotes([]);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('gerrysAdminToken');
    const savedEmail = localStorage.getItem('gerrysAdminEmail');

    if (savedToken) {
      setIsAuthenticated(true);
      setAdminEmail(savedEmail || 'admin@gerrysdocks.com');
      setEditableEmail(savedEmail || 'admin@gerrysdocks.com');
      loadQuotes(savedToken);
      loadProducts();
    }
  }, []);

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const refreshQuotes = () => {
      const token = getAdminToken();
      if (token) {
        loadQuotes(token);
      }
    };

    const intervalId = window.setInterval(refreshQuotes, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshQuotes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  // Handle Admin Login Verification
  const handleLogin = async (e) => {
    e.preventDefault();

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch(`${ADMIN_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid administrator credentials. Please try again.');
      }

      localStorage.setItem('gerrysAdminToken', data.token);
      localStorage.setItem('gerrysAdminEmail', data.admin?.email || adminEmail);
      setIsAuthenticated(true);
      loadQuotes(data.token);
      loadProducts();
      setLoginError('');
    } catch (error) {
      setLoginError(error.message || 'Unable to sign in. Please check the backend service.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Admin Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('gerrysAdminToken');
    localStorage.removeItem('gerrysAdminEmail');
    setAdminEmail('');
    setPassword('');
    setShowPassword(false);
    setQuoteLoadError('');
    setQuotes([]);
  };

  const resetProductForm = () => {
    setEditingProductId('');
    setProductForm({
      id: '',
      name: '',
      category: 'Docks',
      price: '',
      description: '',
      available: true,
    });
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      id: product.id,
      name: product.name || '',
      category: product.category || 'Docks',
      price: product.price ?? '',
      description: product.description || '',
      available: product.available !== false,
    });
    setProductMessage('');
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();

    const token = getAdminToken();
    if (!token) {
      setProductMessage('Please sign in again before updating products.');
      return;
    }

    try {
      const url = editingProductId ? `${PRODUCT_API_URL}/${editingProductId}` : PRODUCT_API_URL;
      const response = await fetch(url, {
        method: editingProductId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: productForm.id || undefined,
          name: productForm.name,
          category: productForm.category,
          price: productForm.price,
          description: productForm.description,
          available: productForm.available,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (AUTH_ERROR_STATUSES.has(response.status)) {
          clearAdminSession('Admin session expired. Please sign in again before changing products.');
          return;
        }

        throw new Error(data.error || 'Unable to save product.');
      }

      setProductMessage(editingProductId ? 'Product updated.' : 'Product added.');
      resetProductForm();
      loadProducts();
    } catch (error) {
      setProductMessage(error.message || 'Unable to save product.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    const token = getAdminToken();
    if (!token) {
      setProductMessage('Please sign in again before deleting products.');
      return;
    }

    if (!window.confirm('Delete this product from the catalog?')) return;

    try {
      const response = await fetch(`${PRODUCT_API_URL}/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (AUTH_ERROR_STATUSES.has(response.status)) {
          clearAdminSession('Admin session expired. Please sign in again before changing products.');
          return;
        }

        throw new Error(data.error || 'Unable to delete product.');
      }

      setProductMessage('Product deleted.');
      loadProducts();
    } catch (error) {
      setProductMessage(error.message || 'Unable to delete product.');
    }
  };

  // Interactive Action: Cycle or change status of a quote
  const handleStatusChange = (quoteId) => {
    setQuotes(prevQuotes =>
      prevQuotes.map(q => {
        if (q.id === quoteId) {
          const nextStatus = q.status === 'PENDING' ? 'UNDER REVIEW' : q.status === 'UNDER REVIEW' ? 'APPROVED' : 'PENDING';
          return { ...q, status: nextStatus };
        }
        return q;
      })
    );
  };

  // Delete/Resolve a quote request
  const handleResolveQuote = (quoteId) => {
    if (window.confirm("Mark this quote request as resolved and archive it?")) {
      setQuotes(prevQuotes => prevQuotes.filter(q => q.id !== quoteId));
      if (selectedQuoteForChat?.id === quoteId) {
        setSelectedQuoteForChat(null);
      }
    }
  };

  // Send reply handler for customer quick response
  const handleSendCustomerMessage = (e) => {
    e.preventDefault();
    if (!outboundMessageText.trim()) return;

    setMessageSendStatus('Sending...');
    setTimeout(() => {
      setMessageSendStatus(`Successfully sent ${messageType.toUpperCase()} to ${selectedQuoteForChat?.customer}!`);
      setOutboundMessageText('');
      setTimeout(() => {
        setMessageSendStatus('');
      }, 4000);
    }, 800);
  };

  // Filter quotes dynamically based on search box input & dropdown status
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = 
      q.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.dockType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get recent quotes for the quick widget
  const recentQuotesList = [...quotes].slice(0, 5);

  // --- RENDER 1: LOGIN PORTAL SCREEN ---
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1D33', fontFamily: 'sans-serif', padding: '20px', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: 'white', padding: isMobile ? '26px 20px' : '40px', borderRadius: '8px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: '#0B1D33', margin: '0 0 5px 0', fontSize: '28px', fontWeight: '800' }}>Gerry's Docks</h2>
            <p style={{ color: '#718096', margin: 0, fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Portal Secure Access</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: '#FED7D7', color: '#9B2C2C', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#4A5568', textTransform: 'uppercase', marginBottom: '8px' }}>Admin Email</label>
              <input 
                type="email" 
                placeholder="Admin email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#4A5568', textTransform: 'uppercase', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 50px 12px 15px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#718096',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              style={{ backgroundColor: '#C25E14', color: 'white', border: 'none', padding: '14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'background-color 0.2s', marginTop: '10px' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#A04D0E'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#C25E14'}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <Link to="/" style={{ color: '#718096', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
              ← Return to Public Website
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // --- RENDER 2: MAIN ADMIN CONSOLE SCREEN ---
  return (
    <div style={{ display: 'flex', flexDirection: adminShellDirection, minHeight: '100vh', width: '100%', fontFamily: 'sans-serif', backgroundColor: '#F4F7FA' }}>
      
      {/* Absolute Full Height Left Navigation Column Panel */}
      <div style={{ width: sidebarWidth, backgroundColor: '#0B1D33', color: '#A0AEC0', padding: isMobile ? '24px 18px' : '40px 25px', display: 'flex', flexDirection: 'column', gap: isMobile ? '18px' : '25px', flexShrink: 0, boxSizing: 'border-box' }}>
        <div>
          <h2 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '24px', fontWeight: '800' }}>Gerry's Docks</h2>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Console</span>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #1A2E44', margin: '10px 0' }} />
        
        {/* Functional Sidebar Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontWeight: '600', fontSize: '15px' }}>
          
          {/* Overview Tab Button */}
          <button 
            onClick={() => setActiveTab('overview')}
            style={{ 
              backgroundColor: activeTab === 'overview' ? '#C25E14' : 'transparent',
              color: activeTab === 'overview' ? 'white' : '#A0AEC0',
              border: 'none',
              textAlign: 'left',
              padding: '12px', 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg>
            Overview
          </button>
          
          <Link to="/" style={{ color: '#A0AEC0', textDecoration: 'none', padding: '5px 12px', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = '#A0AEC0'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
            Go to Website Home
          </Link>
          
          <Link to="/products" style={{ color: '#A0AEC0', textDecoration: 'none', padding: '5px 12px', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = '#A0AEC0'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
            View Product Catalog
          </Link>

          <Link to="/specs" style={{ color: '#A0AEC0', textDecoration: 'none', padding: '5px 12px', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = '#A0AEC0'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
            Pricing & Specs
          </Link>
          
          <Link to="/quote" style={{ color: '#A0AEC0', textDecoration: 'none', padding: '5px 12px', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = '#A0AEC0'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            View Quote Form
          </Link>
          
          {/* Settings Trigger */}
          <button 
            onClick={() => alert('System Configurations Loaded:\n\n- Database: CONNECTED\n- Simulated Google Places API: ONLINE\n- Auth Service: STABLE')}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ 
              backgroundColor: 'transparent',
              border: 'none',
              textAlign: 'left',
              fontFamily: 'sans-serif',
              fontWeight: '600',
              fontSize: '15px',
              padding: '5px 12px', 
              marginTop: '10px', 
              borderTop: '1px solid #1A2E44', 
              paddingTop: '15px',
              cursor: 'pointer',
              color: isHovered ? 'white' : '#718096',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            Dashboard Settings
          </button>

          {/* Account Security Tab Button */}
          <button 
            onClick={() => setActiveTab('security')}
            style={{ 
              backgroundColor: activeTab === 'security' ? '#C25E14' : 'transparent',
              color: activeTab === 'security' ? 'white' : '#A0AEC0',
              border: 'none',
              textAlign: 'left',
              padding: '12px', 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Account Security
          </button>

          {/* Logout Action */}
          <button 
            onClick={handleLogout}
            style={{ 
              backgroundColor: 'transparent',
              border: 'none',
              textAlign: 'left',
              fontFamily: 'sans-serif',
              fontWeight: '600',
              fontSize: '15px',
              padding: '5px 12px', 
              cursor: 'pointer',
              color: '#F87171',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '10px'
            }}
            onMouseEnter={(e) => e.target.style.color = '#EF4444'}
            onMouseLeave={(e) => e.target.style.color = '#F87171'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Console Content Workspace */}
      <div style={{ flex: 1, padding: isMobile ? '24px 14px' : isTablet ? '34px 24px' : '50px 40px', boxSizing: 'border-box', overflowY: 'auto', minWidth: 0 }}>
        
        {activeTab === 'security' ? (
          /* --- ACCOUNT SECURITY VIEW SECTION --- */
          <div style={{ maxWidth: '1000px' }}>
            <div style={{ marginBottom: '30px', borderBottom: '1px solid #E2E8F0', paddingBottom: '20px' }}>
              <h1 style={{ color: '#0B1D33', margin: 0, fontSize: '32px', fontWeight: '800' }}>Account Security</h1>
              <p style={{ color: '#718096', margin: '5px 0 0 0', fontSize: '15px' }}>Manage your administrative credentials and security preferences.</p>
            </div>

            {securityMessage && (
              <div style={{ backgroundColor: '#DEF7EC', color: '#03543F', padding: '12px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px' }}>
                {securityMessage}
              </div>
            )}

            <div style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              
              {/* Profile Name Update Section */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '14px', color: '#2D3748', marginBottom: '8px' }}>
                  Admin Profile Name
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E0', borderRadius: '8px', padding: '10px 14px', backgroundColor: '#F8FAFC', maxWidth: '500px' }}>
                  <input 
                    type="text" 
                    value={adminProfileName} 
                    onChange={(e) => setAdminProfileName(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#2D3748', fontWeight: '600' }}
                  />
                  <button 
                    onClick={() => { setSecurityMessage('Admin profile name updated successfully!'); setTimeout(() => setSecurityMessage(''), 4000); }}
                    style={{ background: 'none', border: 'none', color: '#C25E14', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Save Name
                  </button>
                </div>
                <span style={{ fontSize: '12px', color: '#718096', marginTop: '6px', display: 'block' }}>
                  Name displayed across system logs and reports.
                </span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #EDF2F7', margin: '24px 0' }} />

              {/* Email and Password Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                
                {/* Change Admin Email */}
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '14px', color: '#2D3748', marginBottom: '8px' }}>
                    Change Admin Email ID
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E0', borderRadius: '8px', padding: '10px 14px', backgroundColor: '#F8FAFC' }}>
                    <input 
                      type="email" 
                      value={editableEmail}
                      onChange={(e) => setEditableEmail(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#4A5568' }}
                    />
                    <button 
                      onClick={() => { setAdminEmail(editableEmail); localStorage.setItem('gerrysAdminEmail', editableEmail); setSecurityMessage('Admin email updated successfully!'); setTimeout(() => setSecurityMessage(''), 4000); }}
                      style={{ background: 'none', border: 'none', color: '#C25E14', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Update
                    </button>
                  </div>
                  <span style={{ fontSize: '12px', color: '#718096', marginTop: '6px', display: 'block' }}>
                    Your primary login email address.
                  </span>
                </div>

                {/* Change Password */}
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '14px', color: '#2D3748', marginBottom: '8px' }}>
                    Change Password
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E0', borderRadius: '8px', padding: '10px 14px', backgroundColor: '#F8FAFC' }}>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#4A5568' }}
                    />
                    <button 
                      onClick={() => { setSecurityMessage('Password changed successfully!'); setTimeout(() => setSecurityMessage(''), 4000); }}
                      style={{ background: 'none', border: 'none', color: '#C25E14', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Change
                    </button>
                  </div>
                  <span style={{ fontSize: '12px', color: '#718096', marginTop: '6px', display: 'block' }}>
                    Last changed today.
                  </span>
                </div>

              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #EDF2F7', margin: '24px 0' }} />

              {/* Two-Factor Authentication */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2D3748', margin: '0 0 6px' }}>
                  Two-Factor Authentication
                </h3>
                <p style={{ fontSize: '14px', color: '#4A5568', margin: '0 0 16px' }}>
                  Add an extra layer of security to your account by requiring more than just a password to log in.
                </p>
                <button 
                  onClick={() => alert('2FA Setup Wizard initiated successfully!')}
                  style={{
                    backgroundColor: '#C25E14',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(194, 94, 20, 0.3)'
                  }}
                >
                  Enable 2FA
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* --- OVERVIEW WORKSPACE VIEW SECTION --- */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: isMobile ? '26px' : '40px', borderBottom: '1px solid #E2E8F0', paddingBottom: '25px', gap: '16px', flexDirection: isMobile ? 'column' : 'row' }}>
              <div>
                <h1 style={{ color: '#0B1D33', margin: 0, fontSize: isMobile ? '26px' : '32px', fontWeight: '800' }}>Harbor Dashboard</h1>
                <p style={{ color: '#718096', margin: '5px 0 0 0', fontSize: '15px' }}>Monitoring operations and logistics for Gerry's Docks North & South.</p>
              </div>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ backgroundColor: '#E2E8F0', padding: '12px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4A5568' }}>JUL 30, 2026</div>
                <div style={{ backgroundColor: '#EBF8FF', padding: '12px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#2B6CB0' }}>TIDE: HIGH (1.4m)</div>
              </div>
            </div>

            {/* Analytical Metric Row System */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', marginBottom: '40px' }}>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
                <span style={{ fontSize: '12px', color: '#718096', fontWeight: '600', textTransform: 'uppercase' }}>Active Inbound Quotes</span>
                <h2 style={{ fontSize: '36px', color: '#0B1D33', margin: '10px 0' }}>{quotes.length}</h2>
                <span style={{ color: '#48BB78', fontSize: '13px', fontWeight: 'bold' }}>Tracked in Realtime</span>
              </div>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
                <span style={{ fontSize: '12px', color: '#718096', fontWeight: '600', textTransform: 'uppercase' }}>HDPE Floats Stock</span>
                <h2 style={{ fontSize: '36px', color: '#0B1D33', margin: '10px 0' }}>85%</h2>
                <div style={{ width: '100%', backgroundColor: '#E2E8F0', height: '6px', borderRadius: '3px', marginTop: '15px' }}>
                  <div style={{ width: '85%', backgroundColor: '#C25E14', height: '100%', borderRadius: '3px' }}></div>
                </div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
                <span style={{ fontSize: '12px', color: '#718096', fontWeight: '600', textTransform: 'uppercase' }}>Needs Review</span>
                <h2 style={{ fontSize: '36px', color: '#0B1D33', margin: '10px 0' }}>{quotes.filter(q => q.status === 'PENDING').length}</h2>
                <span style={{ color: '#E53E3E', fontSize: '13px', fontWeight: 'bold' }}>Action Required</span>
              </div>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
                <span style={{ fontSize: '12px', color: '#718096', fontWeight: '600', textTransform: 'uppercase' }}>Est. Pipeline Revenue</span>
                <h2 style={{ fontSize: '36px', color: '#0B1D33', margin: '10px 0' }}>
                  ${quotes.reduce((sum, q) => sum + q.basePrice, 0).toLocaleString()}
                </h2>
                <span style={{ color: '#48BB78', fontSize: '13px', fontWeight: 'bold' }}>Custom config values</span>
              </div>
            </div>

            {/* --- RECENT CUSTOMER QUOTE REQUESTS & QUICK REPLY WIDGET --- */}
            <div style={{ backgroundColor: 'white', padding: isMobile ? '18px' : '25px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: '#0B1D33', fontSize: '18px', fontWeight: '800' }}>Recent Quote Requests</h3>
                  <p style={{ margin: 0, color: '#718096', fontSize: '13px' }}>Select any client request below to open direct email or messaging tools.</p>
                </div>
                <span style={{ backgroundColor: '#EBF8FF', color: '#2B6CB0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  Quick Response Hub
                </span>
              </div>

              {recentQuotesList.length === 0 ? (
                <div style={{ padding: '25px', textAlign: 'center', color: '#718096', fontSize: '14px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E0' }}>
                  No recent quote submissions found. Live customer requests submitted through the quote form will appear here automatically.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(recentQuotesList.length, 5)}, minmax(0, 1fr))`, gap: '12px', marginBottom: '20px' }}>
                  {recentQuotesList.map((q) => {
                    const isSelected = selectedQuoteForChat?.id === q.id;
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setSelectedQuoteForChat(q);
                          setOutboundMessageText(`Hi ${q.customer}, regarding your quote request for your ${q.dockType} at ${q.location}: `);
                          setMessageSendStatus('');
                        }}
                        style={{
                          backgroundColor: isSelected ? '#FFF8F3' : '#F8FAFC',
                          border: isSelected ? '2px solid #C25E14' : '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? '0 4px 12px rgba(194, 94, 20, 0.15)' : 'none'
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = '#CBD5E0'; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = '#E2E8F0'; }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0B1D33', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                          {q.customer}
                        </div>
                        <div style={{ fontSize: '12px', color: '#C25E14', fontWeight: '700', marginBottom: '6px' }}>
                          ${q.basePrice.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#718096', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {q.dockType}
                        </div>
                        <div style={{ fontSize: '10px', color: '#A0AEC0', marginTop: '6px' }}>
                          {q.date}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Direct Communication Panel Drawer (Opened on click) */}
              {selectedQuoteForChat && (
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E0', borderRadius: '8px', padding: '20px', marginTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', color: '#0B1D33', fontSize: '16px', fontWeight: '800' }}>
                        Direct Communication with {selectedQuoteForChat.customer}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#718096' }}>
                        Email: <strong>{selectedQuoteForChat.email}</strong> | Phone: <strong>{selectedQuoteForChat.phone}</strong> | Location: {selectedQuoteForChat.location}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedQuoteForChat(null)}
                      style={{ background: 'none', border: 'none', color: '#718096', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>

                  {messageSendStatus && (
                    <div style={{ backgroundColor: '#DEF7EC', color: '#03543F', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' }}>
                      {messageSendStatus}
                    </div>
                  )}

                  <form onSubmit={handleSendCustomerMessage}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A5568' }}>Send via:</span>
                      <label style={{ fontSize: '13px', fontWeight: '700', color: '#2D3748', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="msgType"
                          checked={messageType === 'email'}
                          onChange={() => setMessageType('email')}
                        />
                        Email
                      </label>
                      <label style={{ fontSize: '13px', fontWeight: '700', color: '#2D3748', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="msgType"
                          checked={messageType === 'sms'}
                          onChange={() => setMessageType('sms')}
                        />
                        Text Message (SMS)
                      </label>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <textarea
                        rows="3"
                        required
                        value={outboundMessageText}
                        onChange={(e) => setOutboundMessageText(e.target.value)}
                        placeholder={`Type your ${messageType === 'email' ? 'email' : 'SMS'} response to the customer here...`}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedQuoteForChat(null)}
                        style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E0', backgroundColor: '#FFFFFF', color: '#4A5568', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#C25E14', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Send {messageType === 'email' ? 'Email' : 'Text'} Now
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Product Management Panel */}
            <div style={{ backgroundColor: 'white', padding: isMobile ? '18px' : '25px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: '#0B1D33', fontSize: '20px', fontWeight: '800' }}>Product Catalog Management</h3>
                  <p style={{ margin: 0, color: '#718096', fontSize: '13px' }}>Add, update, pause, or remove products and pricing from the live catalog.</p>
                </div>
                <button
                  type="button"
                  onClick={resetProductForm}
                  style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #CBD5E0', backgroundColor: '#FFFFFF', color: '#0B1D33', fontWeight: '800', cursor: 'pointer' }}
                >
                  New Product
                </button>
              </div>

              {productMessage && (
                <div style={{ backgroundColor: productMessage.includes('Unable') || productMessage.includes('Please') ? '#FEF3C7' : '#DEF7EC', color: productMessage.includes('Unable') || productMessage.includes('Please') ? '#92400E' : '#03543F', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' }}>
                  {productMessage}
                </div>
              )}

              <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: productFormColumns, gap: '12px', alignItems: 'end', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#718096', marginBottom: '5px', textTransform: 'uppercase' }}>Product Name</label>
                  <input
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm((current) => ({ ...current, name: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#718096', marginBottom: '5px', textTransform: 'uppercase' }}>Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm((current) => ({ ...current, category: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }}
                  >
                    <option>Docks</option>
                    <option>Ramps</option>
                    <option>Accessories</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#718096', marginBottom: '5px', textTransform: 'uppercase' }}>Price</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm((current) => ({ ...current, price: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#718096', marginBottom: '5px', textTransform: 'uppercase' }}>Description</label>
                  <input
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm((current) => ({ ...current, description: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E0', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{ padding: '11px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#C25E14', color: 'white', fontWeight: '800', cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
                >
                  {editingProductId ? 'Update' : 'Add'}
                </button>
              </form>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#4A5568', fontSize: '13px', fontWeight: '700', marginBottom: '18px' }}>
                <input
                  type="checkbox"
                  checked={productForm.available}
                  onChange={(e) => setProductForm((current) => ({ ...current, available: e.target.checked }))}
                />
                Available for quotes
              </label>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#718096', fontWeight: 'bold' }}>
                      <th style={{ padding: '10px 8px' }}>Product</th>
                      <th style={{ padding: '10px 8px' }}>Category</th>
                      <th style={{ padding: '10px 8px' }}>Price</th>
                      <th style={{ padding: '10px 8px' }}>Status</th>
                      <th style={{ padding: '10px 8px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '800', color: '#0B1D33' }}>{product.name}</td>
                        <td style={{ padding: '12px 8px' }}>{product.category}</td>
                        <td style={{ padding: '12px 8px', color: '#C25E14', fontWeight: '800' }}>${Number(product.price || 0).toLocaleString()}</td>
                        <td style={{ padding: '12px 8px' }}>{product.available === false ? 'Paused' : 'Available'}</td>
                        <td style={{ padding: '12px 8px', display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => handleEditProduct(product)} style={{ padding: '7px 10px', borderRadius: '5px', border: '1px solid #CBD5E0', backgroundColor: '#FFFFFF', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                          <button type="button" onClick={() => handleDeleteProduct(product.id)} style={{ padding: '7px 10px', borderRadius: '5px', border: 'none', backgroundColor: '#FEE2E2', color: '#9B2C2C', cursor: 'pointer', fontWeight: '700' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '18px 8px', color: '#718096', textAlign: 'center' }}>No products loaded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dynamic Filters Bar */}
            <div style={{ backgroundColor: 'white', padding: isMobile ? '16px' : '20px 25px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '25px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '15px', flex: 1, minWidth: isMobile ? '100%' : '300px' }}>
                <input 
                  type="text" 
                  placeholder="Search quotes by client, location, or dock variant..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 1, width: '100%', padding: '10px 15px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: isMobile ? 'stretch' : 'center', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                <button
                  type="button"
                  onClick={() => loadQuotes(getAdminToken())}
                  disabled={isLoadingQuotes}
                  style={{
                    padding: '10px 15px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E0',
                    backgroundColor: isLoadingQuotes ? '#E2E8F0' : '#FFFFFF',
                    color: '#0B1D33',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: isLoadingQuotes ? 'not-allowed' : 'pointer',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  {isLoadingQuotes ? 'Refreshing...' : 'Refresh Quotes'}
                </button>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4A5568' }}>Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '10px 15px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '14px', backgroundColor: '#FFFFFF', outline: 'none', fontWeight: 'bold', color: '#1A202C', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', width: isMobile ? '100%' : 'auto' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="UNDER REVIEW">Under Review Only</option>
                  <option value="APPROVED">Approved Only</option>
                </select>
              </div>
            </div>

            {/* Main split grid panel content view */}
            <div style={{ display: 'grid', gridTemplateColumns: contentGridColumns, gap: isMobile ? '18px' : '30px', alignItems: 'start' }}>
              
              {/* Table Card Panel */}
              <div style={{ backgroundColor: 'white', padding: isMobile ? '18px' : '30px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)', minWidth: 0 }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#0B1D33', fontSize: '20px', fontWeight: '800' }}>Inbound System Quotes</h3>
                {isLoadingQuotes && (
                  <div style={{ backgroundColor: '#EBF8FF', color: '#2B6CB0', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' }}>
                    Loading quote requests from backend...
                  </div>
                )}
                {quoteLoadError && (
                  <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' }}>
                    {quoteLoadError}
                  </div>
                )}
                
                {filteredQuotes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#718096' }}>
                    <p style={{ marginTop: '10px', fontWeight: 'bold' }}>No matching quotes found.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#718096', fontWeight: 'bold' }}>
                          <th style={{ padding: '12px 8px' }}>Customer</th>
                          <th style={{ padding: '12px 8px' }}>Project Location</th>
                          <th style={{ padding: '12px 8px' }}>Configured Dock Type</th>
                          <th style={{ padding: '12px 8px' }}>Estimate</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center' }}>Status Toggle</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuotes.map((quote) => (
                          <tr key={quote.id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s' }}>
                            <td style={{ padding: '18px 8px', fontWeight: 'bold', color: '#0B1D33' }}>
                              {quote.customer}
                              <div style={{ fontSize: '11px', color: '#718096', fontWeight: 'normal' }}>{quote.date}</div>
                            </td>
                            <td style={{ padding: '18px 8px', color: '#4A5568' }}>{quote.location}</td>
                            <td style={{ padding: '18px 8px' }}>
                              <span style={{ backgroundColor: '#EBF8FF', color: '#2B6CB0', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                {quote.dockType}
                              </span>
                            </td>
                            <td style={{ padding: '18px 8px', fontWeight: '800', color: '#C25E14' }}>
                              ${quote.basePrice.toLocaleString()}
                            </td>
                            <td style={{ padding: '18px 8px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleStatusChange(quote.id)}
                                title="Click to cycle status"
                                style={{
                                  backgroundColor: quote.status === 'APPROVED' ? '#DEF7EC' : quote.status === 'UNDER REVIEW' ? '#EBF8FF' : '#FEF3C7',
                                  color: quote.status === 'APPROVED' ? '#03543F' : quote.status === 'UNDER REVIEW' ? '#1A56DB' : '#92400E',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  transition: 'transform 0.1s'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                              >
                                {quote.status} ↻
                              </button>
                            </td>
                            <td style={{ padding: '18px 8px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleResolveQuote(quote.id)}
                                style={{ backgroundColor: '#FEE2E2', color: '#9B2C2C', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#FCA5A5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#FEE2E2'}
                              >
                                Resolve
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Critical Alerts Sidebar card */}
              <div style={{ backgroundColor: 'white', padding: isMobile ? '18px' : '30px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#0B1D33', fontSize: '16px', fontWeight: '800' }}>Critical Alerts</h4>
                  <span style={{ backgroundColor: '#FED7D7', color: '#9B2C2C', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>STOCK WARNING</span>
                </div>
                <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ borderLeft: '4px solid #E53E3E', paddingLeft: '12px', backgroundColor: '#FFF5F5', padding: '10px 12px', borderRadius: '0 6px 6px 0' }}>
                    <strong style={{ color: '#9B2C2C' }}>HDPE Floats (48"x24")</strong><br />
                    <span style={{ color: '#4A5568', fontSize: '13px' }}>Stock level low: 14 units remaining. Please restock soon.</span>
                  </div>
                  <div style={{ borderLeft: '4px solid #C25E14', paddingLeft: '12px', backgroundColor: '#FFF8F3', padding: '10px 12px', borderRadius: '0 6px 6px 0' }}>
                    <strong style={{ color: '#A14D10' }}>Aluminum Flip Ladders</strong><br />
                    <span style={{ color: '#4A5568', fontSize: '13px' }}>7 orders scheduled for assembly this Friday.</span>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
