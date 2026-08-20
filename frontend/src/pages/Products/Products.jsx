import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const PRODUCT_API_URL = import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:5001/api/products';

function getProductImage(product) {
  if (product.img && product.img !== '/images/hero-dock.jpg') return product.img;

  const id = String(product.id || '').toLowerCase();
  const name = String(product.name || '').toLowerCase();
  const cat = String(product.category || '').toLowerCase();

  // Specific product mappings for unique database items
  if (id.includes('wheel') || name.includes('wheel')) {
    return '/images/delivery-trailer.jpg';
  }
  if (id.includes('bench') || name.includes('bench')) {
    return '/images/hero-dock.jpg';
  }
  if (id.includes('ramp-4x20') || (name.includes('20') && name.includes('ramp'))) {
    return '/images/rock-mount-ramp-dock.jpg';
  }
  if (id.includes('ramp-4x12') || (name.includes('12') && name.includes('ramp'))) {
    return '/images/red-cabin-dock.jpg';
  }
  if (id.includes('dock-8x16') || (name.includes('8') && name.includes('16') && name.includes('dock'))) {
    return '/images/straight-dock-water-view.jpg';
  }
  if (id.includes('dock-4x10') || (name.includes('4') && name.includes('10') && name.includes('dock'))) {
    return '/images/water-floating-dock-end.jpg';
  }

  // Generic keyword fallback rules
  if (id.includes('pontoon') || name.includes('pontoon') || id.includes('fl-') || name.includes('float')) {
    return '/images/shop-pontoon-mounting-detail.jpg';
  }
  if (id.includes('l-shape') || name.includes('l-shape') || name.includes('patio') || id.includes('lay-l')) {
    return '/images/l-shape-dock-full-view.jpg';
  }
  if (id.includes('t-junction') || name.includes('t-junction') || name.includes('cleat') || id.includes('lay-t')) {
    return '/images/dock-t-junction-cleats.jpg';
  }
  if (id.includes('hw-joint') || name.includes('joint') || name.includes('subframe') || name.includes('hardware')) {
    return '/images/shop-frame-build.jpg';
  }
  if (id.includes('rock') || name.includes('rock') || name.includes('ramp') || name.includes('bracket')) {
    return '/images/rock-mount-ramp-dock.jpg';
  }
  if (id.includes('ladder') || name.includes('ladder') || name.includes('swim')) {
    return '/images/side-profile-floating-dock.jpg';
  }
  if (id.includes('bumper') || name.includes('bumper')) {
    return '/images/installed-shoreline-dock.jpg';
  }
  if (id.includes('sec-16') || name.includes('straight') || name.includes('walkway') || cat === 'docks' || cat === 'sections') {
    return '/images/straight-dock-water-view.jpg';
  }

  if (cat === 'ramps' || cat === 'layouts') return '/images/rock-mount-ramp-dock.jpg';
  if (cat === 'accessories' || cat === 'hardware') return '/images/shop-frame-build.jpg';
  if (cat === 'floats') return '/images/shop-pontoon-mounting-detail.jpg';

  return '/images/straight-dock-water-view.jpg';
}

function formatBackendProduct(product) {
  const categoryMap = {
    Docks: 'sections',
    Ramps: 'layouts',
    Accessories: 'hardware',
  };

  return {
    id: product.id,
    name: product.name,
    category: categoryMap[product.category] || String(product.category || 'sections').toLowerCase(),
    length: product.length || 'custom',
    price: Number.isFinite(Number(product.price)) ? `$${Number(product.price).toLocaleString()}` : 'Custom Quote',
    img: getProductImage(product),
    description: product.description || '',
    specs: product.specs || {
      alloy: product.category || 'CUSTOM',
      capacity: product.available === false ? 'PAUSED' : 'AVAILABLE',
      install: 'QUOTE READY',
    },
  };
}

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLength, setActiveLength] = useState('all');
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(PRODUCT_API_URL);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load products.');
        }

        setProducts(Array.isArray(data) ? data.map(formatBackendProduct) : []);
        setLoadError('');
      } catch (error) {
        setLoadError(error.message || 'Unable to load products from the database.');
        setProducts([]);
      }
    }

    loadProducts();
  }, []);

  // Filtering Logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesLength = activeLength === 'all' || product.length === activeLength;
    return matchesSearch && matchesCategory && matchesLength;
  });

  return (
    <div style={{ backgroundColor: 'var(--bg-main, #071626)', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif', color: 'var(--text-main, #E2E8F0)', transition: 'background-color 0.3s ease' }}>
      
      {/* HEADER HERO AREA */}
      <div style={{
        backgroundColor: 'var(--card-bg, #0B1D33)',
        color: 'var(--text-main, #FFFFFF)',
        padding: '60px 40px',
        textAlign: 'center',
        borderBottom: '4px solid #C25E14'
      }}>
        <h1 style={{ fontSize: '38px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '1px' }}>SYSTEM CATALOG</h1>
        <p style={{ color: '#94A3B8', fontSize: '15px', maxWidth: '650px', margin: '0 auto' }}>
          Explore heavy-duty marine dock sections, custom layout configurations, and mounting hardware engineered for rugged shorelines.
        </p>
      </div>

      {/* FILTER PANEL */}
      <div style={{
        maxWidth: '1200px',
        margin: '-30px auto 40px auto',
        padding: '24px 30px',
        backgroundColor: 'var(--card-bg, #0F253F)',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--border-color, #1E3A5F)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 5
      }}>
        {/* Search Bar Input */}
        <div style={{ flex: '1 1 280px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
            Search Frameworks
          </label>
          <input
            type="text"
            placeholder="Search catalog (e.g., Walkway, Pontoon, Joint)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #3B5E8C)',
              backgroundColor: 'var(--bg-main, #1E3E66)',
              color: '#FFFFFF',
              fontSize: '14px',
              boxSizing: 'border-box',
              outline: 'none',
              height: '42px'
            }}
          />
        </div>

        {/* Category Tabs */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
            System Classification
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {['all', 'sections', 'layouts', 'hardware', 'floats'].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    height: '42px',
                    padding: '0 18px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid #C25E14' : '1px solid var(--border-color, #3B5E8C)',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isActive ? '#C25E14' : 'var(--bg-main, #1E3E66)',
                    color: '#FFFFFF',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(194, 94, 20, 0.4)' : '0 2px 6px rgba(0,0,0,0.3)',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.backgroundColor = '#285185';
                      e.target.style.borderColor = '#5282BF';
                    } else {
                      e.target.style.backgroundColor = '#A14D10';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isActive ? '#C25E14' : 'var(--bg-main, #1E3E66)';
                    e.target.style.borderColor = isActive ? '#C25E14' : 'var(--border-color, #3B5E8C)';
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Length Select Filter */}
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
            Section Length
          </label>
          <select
            value={activeLength}
            onChange={(e) => setActiveLength(e.target.value)}
            style={{
              width: '100%',
              padding: '0 11px',
              height: '42px',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #3B5E8C)',
              backgroundColor: 'var(--bg-main, #1E3E66)',
              fontSize: '13px',
              fontWeight: '600',
              color: '#FFFFFF',
              colorScheme: 'dark',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ backgroundColor: '#1E3E66', color: '#FFFFFF' }}>All Lengths</option>
            <option value="10ft" style={{ backgroundColor: '#1E3E66', color: '#FFFFFF' }}>10 Feet</option>
            <option value="16ft" style={{ backgroundColor: '#1E3E66', color: '#FFFFFF' }}>16 Feet</option>
            <option value="20ft" style={{ backgroundColor: '#1E3E66', color: '#FFFFFF' }}>20 Feet</option>
          </select>
        </div>
      </div>

      {/* PRODUCT GRID DISPLAY */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {loadError && (
          <div style={{ marginBottom: '20px', padding: '14px 16px', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
            {loadError}
          </div>
        )}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--card-bg, #0F253F)', borderRadius: '8px', border: '1px solid var(--border-color, #1E3A5F)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main, #FFFFFF)' }}>No Matching Frameworks Found</h3>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Try resetting your filter parameters or widening your search query term.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '30px'
          }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: 'var(--card-bg, #0F253F)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  transition: 'all 0.25s ease-in-out',
                  border: '1px solid var(--border-color, #1E3A5F)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = '#C25E14';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color, #1E3A5F)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                }}
              >
                {/* Product Image Panel */}
                <div style={{
                  height: '200px',
                  backgroundImage: `url(${product.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                  flexShrink: 0
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '15px',
                    left: '15px',
                    backgroundColor: 'var(--bg-main, #071626)',
                    color: '#C25E14',
                    border: '1px solid #C25E14',
                    padding: '5px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {product.category}
                  </div>
                </div>

                {/* Body Content */}
                <div style={{
                  padding: '25px',
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '10px',
                    marginBottom: '15px',
                    minHeight: '52px'
                  }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main, #FFFFFF)', fontSize: '18px', fontWeight: '800', lineHeight: '1.3' }}>
                      {product.name}
                    </h3>
                    <span style={{ color: '#C25E14', fontSize: '15px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                      {product.price}
                    </span>
                  </div>

                  {/* SPECIFICATION ROW */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    borderTop: '1px solid var(--border-color, #1E3A5F)',
                    borderBottom: '1px solid var(--border-color, #1E3A5F)',
                    padding: '15px 0',
                    margin: '15px 0 20px 0',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 'bold', letterSpacing: '0.5px' }}>FRAMING</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-main, #FFFFFF)', fontWeight: '800' }}>{product.specs.alloy}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 'bold', letterSpacing: '0.5px' }}>RATING</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-main, #FFFFFF)', fontWeight: '800' }}>{product.specs.capacity}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 'bold', letterSpacing: '0.5px' }}>MOUNT/FLOAT</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-main, #FFFFFF)', fontWeight: '800' }}>{product.specs.install}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/quote?product=${product.id}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      textAlign: 'center',
                      textDecoration: 'none',
                      backgroundColor: '#C25E14',
                      color: 'white',
                      padding: '12px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      marginTop: 'auto',
                      transition: 'background 0.2s ease, transform 0.2s ease',
                      boxShadow: '0 4px 10px rgba(194, 94, 20, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#A14D10';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#C25E14';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Select & Configure
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
