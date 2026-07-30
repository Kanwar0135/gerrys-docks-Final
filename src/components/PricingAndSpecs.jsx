import React, { useState, useEffect, useRef } from 'react';

const dockConfigurations = [
  {
    id: 'straight',
    title: 'Straight / Walkway Dock',
    badge: 'Popular Entry',
    description: 'Ideal for straightforward shoreline access and shallow-to-deep water entry.',
    image: '/images/straight-dock-water-view.jpg',
    specs: [
      '2x8 Pressure-Treated Frame',
      '18" Heavy-Duty HDPE Pontoon Floats',
      '5/4 Premium PT Decking',
      'Integrated Side Bumper Track',
    ],
    pricing: [
      { size: "8' x 16' Floating Section", price: 'Contact for Quote' },
      { size: "8' x 20' Floating Section", price: 'Contact for Quote' },
      { size: "4' x 12' Shoreline Ramp", price: 'Contact for Quote' },
    ],
  },
  {
    id: 'l-shape',
    title: 'L-Shape Expansion Layout',
    badge: 'Best-Seller',
    description: 'Provides a spacious patio platform at the end for seating, swimming, and boat tie-ups.',
    image: '/images/hero-dock.jpg',
    specs: [
      'Multi-Section Heavy Hinged Joints',
      'Expanded Freeboard Stability',
      'Optional Flip-Up Cleat Integration',
      'Custom Shoreline Bracket Mounts',
    ],
    pricing: [
      { size: "8' x 16' Walkway + 8' x 12' Patio", price: 'Contact for Quote' },
      { size: "8' x 20' Walkway + 10' x 16' Patio", price: 'Contact for Quote' },
      { size: 'Custom Layout Configurations', price: 'Tailored Pricing' },
    ],
  },
  {
    id: 't-shape',
    title: 'T-Shape / Custom Junction',
    badge: 'Maximum Space',
    description: 'Perfect for docking multiple craft or creating a centralized lounging zone.',
    image: '/images/dock-t-junction-cleats.jpg',
    specs: [
      'Heavy Anchor Chains & Corner Brackets',
      'Custom Joist Framing Spacing',
      'Reinforced Perimeter Rim Boards',
      'Full Bumper & Corner Guards',
    ],
    pricing: [
      { size: "8' x 20' Walkway + T-Head Section", price: 'Contact for Quote' },
      { size: 'Full Custom Waterfront Package', price: 'Tailored Pricing' },
    ],
  },
];

const hardwareHighlights = [
  {
    title: 'Rugged Subframe Construction',
    image: '/images/shop-frame-build.jpg',
    desc: 'Handcrafted in-shop using heavy-duty 2x8 pressure-treated lumber and precise joist layout for zero deck flex.',
  },
  {
    title: 'Heavy-Duty Pontoon Mounts',
    image: '/images/shop-pontoon-mounting-detail.jpg',
    desc: 'Thru-bolted brackets securing 18" HDPE pontoon logs directly to the frame for maximum buoyancy and durability.',
  },
  {
    title: 'Custom Shoreline Anchoring',
    image: '/images/rock-mount-ramp-dock.jpg',
    desc: 'Custom-engineered rock mounting plates and heavy hinges designed for rocky shores and fluctuating water levels.',
  },
];

export default function PricingAndSpecs() {
  const [activeTab, setActiveTab] = useState('straight');
  const [hoveredBtn, setHoveredBtn] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // State for Lightbox Modal & Zoom / Pan
  const [lightboxImage, setLightboxImage] = useState(null);
  const [imageScale, setImageScale] = useState(1);
  const [imgPosition, setImgPosition] = useState({ x: 0, y: 0 });
  
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset zoom and position when lightbox closes
  useEffect(() => {
    if (!lightboxImage) {
      setImageScale(1);
      setImgPosition({ x: 0, y: 0 });
    }
  }, [lightboxImage]);

  // Prevent background scrolling when lightbox is open
  useEffect(() => {
    if (lightboxImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [lightboxImage]);

  // Keyboard shortcut listener to close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Window-level mouse move & up listeners to lock dragging securely inside the modal viewport
  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (!isDraggingRef.current || imageScale <= 1) return;
      e.preventDefault();
      setImgPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    };

    const handleWindowMouseUp = () => {
      isDraggingRef.current = false;
    };

    if (lightboxImage) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [lightboxImage, imageScale]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    if (imageScale > 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - imgPosition.x, y: e.clientY - imgPosition.y };
    }
  };

  const selectedConfig = dockConfigurations.find((c) => c.id === activeTab);

  return (
    <div style={{
      backgroundColor: 'var(--bg-main, #071626)',
      minHeight: '100vh',
      color: 'var(--text-main, #FFFFFF)',
      padding: '40px 20px 80px 20px',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#FFFFFF',
            margin: '0 0 10px 0',
            letterSpacing: '0.5px'
          }}>
            Dock Systems & Build Specifications
          </h2>
          <p style={{ color: 'var(--text-muted, #A0AEC0)', fontSize: '15px', margin: 0, maxWidth: '650px', marginInline: 'auto' }}>
            Handcrafted quality built for rugged water conditions. Explore our standard layouts and engineering standards below. Click any image to view in high resolution.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '35px',
          flexWrap: 'wrap'
        }}>
          {dockConfigurations.map((config) => {
            const isActive = activeTab === config.id;
            return (
              <button
                key={config.id}
                onClick={() => setActiveTab(config.id)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '6px',
                  border: isActive ? '2px solid #C25E14' : '1px solid var(--border-color, #1E3A5F)',
                  backgroundColor: isActive ? '#C25E14' : 'var(--card-bg, #0B1D33)',
                  color: isActive ? '#FFFFFF' : 'var(--text-main, #FFFFFF)',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(194, 94, 20, 0.3)' : '0 2px 6px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#C25E14';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'var(--border-color, #1E3A5F)';
                  }
                }}
              >
                {config.title}
              </button>
            );
          })}
        </div>

        {/* Selected Config Main Card */}
        {selectedConfig && (
          <div style={{
            backgroundColor: 'var(--card-bg, #0B1D33)',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #1E3A5F)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            padding: '30px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '30px',
            alignItems: 'center',
            marginBottom: '50px'
          }}>
            
            {/* Controlled Image Box with Click-to-Zoom */}
            <div 
              onClick={() => setLightboxImage({ url: selectedConfig.image, title: selectedConfig.title })}
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                maxHeight: '300px',
                backgroundColor: '#050E1A',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
            >
              <img
                src={selectedConfig.image}
                alt={selectedConfig.title}
                style={{
                  width: '100%',
                  height: '280px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <span style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: '#C25E14',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '4px',
                letterSpacing: '0.5px'
              }}>
                {selectedConfig.badge}
              </span>
              <span style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                backgroundColor: 'rgba(11, 29, 51, 0.85)',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: '600',
                padding: '4px 10px',
                borderRadius: '4px',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                Zoom In
              </span>
            </div>

            {/* Config Specs and Details */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main, #FFFFFF)', margin: '0 0 10px 0' }}>
                  {selectedConfig.title}
                </h3>
                <p style={{ color: 'var(--text-main, #FFFFFF)', fontSize: '14px', margin: '0 0 20px 0', lineHeight: '1.5', opacity: 0.9 }}>
                  {selectedConfig.description}
                </p>

                <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#C25E14', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>
                  Build Features & Materials
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                  {selectedConfig.specs.map((spec, index) => (
                    <div key={index} style={{ fontSize: '13px', color: 'var(--text-main, #FFFFFF)', opacity: 0.95, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#C25E14', fontWeight: 'bold' }}>✓</span> {spec}
                    </div>
                  ))}
                </div>

                <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#C25E14', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>
                  Standard Configurations
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
                  {selectedConfig.pricing.map((p, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-main, #071626)', borderRadius: '4px', border: '1px solid var(--border-color, #1E3A5F)', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-main, #FFFFFF)', fontWeight: '600' }}>{p.size}</span>
                      <span style={{ color: '#C25E14', fontWeight: '700' }}>{p.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href={`/quote?product=${selectedConfig.id}`}
                onMouseEnter={() => setHoveredBtn(selectedConfig.id)}
                onMouseLeave={() => setHoveredBtn('')}
                style={{
                  display: 'inline-block',
                  textAlign: 'center',
                  backgroundColor: hoveredBtn === selectedConfig.id ? '#A14D10' : '#C25E14',
                  color: '#FFFFFF',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '14px',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s ease, transform 0.2s ease',
                  transform: hoveredBtn === selectedConfig.id ? 'translateY(-2px)' : 'none',
                  boxShadow: '0 4px 12px rgba(194, 94, 20, 0.3)'
                }}
              >
                Configure This System &rarr;
              </a>
            </div>

          </div>
        )}

        {/* Hardware Build Highlights Grid */}
        <div style={{ marginTop: '60px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '800', textAlign: 'center', marginBottom: '30px', color: 'var(--text-main, #FFFFFF)' }}>
            Engineering & In-Shop Craftsmanship
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            {hardwareHighlights.map((hw, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: 'var(--card-bg, #0B1D33)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color, #1E3A5F)',
                  transition: 'all 0.25s ease',
                  transform: hoveredCard === index ? 'translateY(-6px)' : 'none',
                  borderColor: hoveredCard === index ? '#C25E14' : 'var(--border-color, #1E3A5F)',
                  boxShadow: hoveredCard === index ? '0 12px 24px rgba(0,0,0,0.5)' : '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                <div 
                  onClick={() => setLightboxImage({ url: hw.image, title: hw.title })}
                  style={{ height: '200px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                >
                  <img src={hw.image} alt={hw.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(11, 29, 51, 0.85)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                    Zoom In
                  </span>
                </div>
                <div style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 10px 0', color: 'var(--text-main, #FFFFFF)' }}>
                    {hw.title}
                  </h4>
                  <p style={{ color: 'var(--text-muted, #A0AEC0)', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                    {hw.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Lightbox Modal with CSS Background Image Renderer (Zero Artifacts/Tearing) */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '90vw',
              maxWidth: '1000px',
              backgroundColor: '#0B1D33',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #1E3A5F',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxSizing: 'border-box'
            }}
          >
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                backgroundColor: '#C25E14',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ✕
            </button>
            
            {/* Native Background Image Viewport (Eliminates Tearing & Ghosting Artifacts Completely) */}
            <div
              onWheel={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setImageScale((prev) => {
                  const nextScale = prev + (e.deltaY < 0 ? 0.25 : -0.25);
                  const clamped = Math.min(Math.max(nextScale, 1), 3.5);
                  if (clamped === 1) setImgPosition({ x: 0, y: 0 });
                  return clamped;
                });
              }}
              onMouseDown={handleMouseDown}
              style={{
                width: '100%',
                height: '65vh',
                borderRadius: '6px',
                backgroundColor: '#050E1A',
                backgroundImage: `url(${lightboxImage.url})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `calc(50% + ${imgPosition.x}px) calc(50% + ${imgPosition.y}px)`,
                backgroundSize: `${imageScale * 100}%`,
                cursor: imageScale > 1 ? (isDraggingRef.current ? 'grabbing' : 'grab') : 'zoom-in',
                position: 'relative',
                overflow: 'hidden',
                userSelect: 'none',
                transition: isDraggingRef.current ? 'none' : 'background-size 0.05s ease-out'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '15px' }}>
              <p style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '16px', margin: 0 }}>
                {lightboxImage.title}
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: '#A0AEC0', fontSize: '12px', marginRight: '4px' }}>
                  {Math.round(imageScale * 100)}%
                </span>
                <button
                  onClick={() => {
                    setImageScale((prev) => Math.min(prev + 0.5, 3.5));
                  }}
                  style={{ backgroundColor: '#1E3A5F', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                  Zoom +
                </button>
                <button
                  onClick={() => {
                    setImageScale(1);
                    setImgPosition({ x: 0, y: 0 });
                  }}
                  style={{ backgroundColor: '#1E3A5F', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}