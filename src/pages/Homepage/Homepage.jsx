import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

function ScrollReveal({ children, delay = '0s' }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setIsVisible(true);
      });
    }, { threshold: 0.1 });
    const currentTarget = domRef.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, []);

  return (
    <div ref={domRef} style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)', transition: `opacity 0.8s ease-out ${delay}, transform 0.8s ease-out ${delay}`, width: '100%' }}>
      {children}
    </div>
  );
}

export default function Homepage() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [activeTab, setActiveTab] = useState('Straight Walkway Sections');

  const tabContent = {
    'Straight Walkway Sections': {
      title: 'Straight Walkway Sections',
      desc: 'Solid 8\' x 16\' straight walkway configurations built with 2x8 PT framing and 18" HDPE pontoon float logs for high stability.',
      link: '/products?category=sections',
      img: '/images/straight-dock-water-view.jpg'
    },
    'L-Shape Patio Expansions': {
      title: 'L-Shape Patio Expansions',
      desc: 'Features multi-hinge assemblies, heavy corner brackets, and integrated side bumpers for expanded deck seating and water access.',
      link: '/products?category=layouts',
      img: '/images/hero-dock.jpg'
    },
    'T-Junction & Custom Layouts': {
      title: 'T-Junction & Custom Layouts',
      desc: 'Designed with extra joist support, stainless steel cleats, and heavy-duty anchor chain rigs for multiple watercraft ties.',
      link: '/products?category=layouts',
      img: '/images/dock-t-junction-cleats.jpg'
    }
  };

  return (
    <div style={{ width: '100%', overflowX: 'hidden', color: '#E2E8F0', backgroundColor: 'var(--bg-main, #0B1D33)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      
      {/* HERO SECTION WITH VIDEO BACKGROUND */}
      <section style={{ 
        position: 'relative', 
        backgroundColor: '#0B1D33', 
        height: '90vh', 
        minHeight: '650px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
        padding: '0 40px'
      }}>
        
        {/* Background Video Element */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            transform: 'translate(-50%, -50%)',
            zIndex: 1 
          }}
        >
          <source src="/images/Dock-Homepage.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Dark Gradient Overlay for Readability */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          background: 'linear-gradient(rgba(11, 29, 51, 0.75), rgba(11, 29, 51, 0.90))', 
          zIndex: 2 
        }} />

        {/* Content Overlay */}
        <div style={{ position: 'relative', zIndex: 3, maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ScrollReveal>
            
            {/* Badge */}
            <span style={{ 
              backgroundColor: '#D97706', 
              color: '#FFFFFF', 
              fontSize: '12px', 
              fontWeight: '700', 
              letterSpacing: '1.5px', 
              padding: '8px 20px', 
              borderRadius: '20px', 
              marginBottom: '28px',
              display: 'inline-block'
            }}>
              HANDCRAFTED MARINE CONSTRUCTION
            </span>

            {/* Main Headline */}
            <h1 style={{ 
              fontSize: '52px', 
              fontWeight: '800', 
              color: '#FFFFFF', 
              lineHeight: '1.15', 
              marginBottom: '24px',
              textAlign: 'center' 
            }}>
              Industrial Strength Dock Systems.<br />
              <span style={{ color: '#D97706' }}>Custom Built For Your Shoreline.</span>
            </h1>

            {/* Subheading / Description */}
            <p style={{ 
              fontSize: '18px', 
              color: '#CBD5E1', 
              maxWidth: '680px', 
              margin: '0 auto 36px auto', 
              lineHeight: '1.6',
              textAlign: 'center'
            }}>
              Engineered for durability, fluctuating water levels, and demanding shoreline environments using heavy-duty pressure-treated framing and premium hardware.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link 
                to="/products" 
                onMouseEnter={() => setHoveredBtn('heroPrimary')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  backgroundColor: hoveredBtn === 'heroPrimary' ? '#B45309' : '#D97706',
                  color: '#FFFFFF',
                  padding: '14px 32px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.25s ease',
                  transform: hoveredBtn === 'heroPrimary' ? 'translateY(-2px)' : 'none',
                  boxShadow: hoveredBtn === 'heroPrimary' ? '0 4px 12px rgba(217, 119, 6, 0.4)' : 'none'
                }}
              >
                View Product Catalog
              </Link>

              <Link 
                to="/quote" 
                onMouseEnter={() => setHoveredBtn('heroSecondary')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  backgroundColor: hoveredBtn === 'heroSecondary' ? '#D97706' : '#FFFFFF',
                  color: hoveredBtn === 'heroSecondary' ? '#FFFFFF' : '#0B1D33',
                  border: '2px solid',
                  borderColor: hoveredBtn === 'heroSecondary' ? '#D97706' : '#FFFFFF',
                  padding: '12px 30px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.25s ease',
                  transform: hoveredBtn === 'heroSecondary' ? 'translateY(-2px)' : 'none',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
                }}
              >
                Request Free Estimate
              </Link>
            </div>

          </ScrollReveal>
        </div>
      </section>

      {/* SPECIFICATIONS BAR */}
      <section style={{ backgroundColor: 'var(--card-bg, #071322)', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', padding: '24px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'center' }}>
          <div>
            <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>SUBFRAMING</div>
            <div style={{ color: 'var(--text-main, #000000)', fontSize: '16px', fontWeight: '700' }}>2x8 PT LUMBER</div>
          </div>
          <div>
            <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>PONTOON FLOATS</div>
            <div style={{ color: 'var(--text-main, #000000)', fontSize: '16px', fontWeight: '700' }}>18" HDPE LOGS</div>
          </div>
          <div>
            <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>CRAFTSMANSHIP</div>
            <div style={{ color: 'var(--text-main, #000000)', fontSize: '16px', fontWeight: '700' }}>IN-SHOP FABRICATION</div>
          </div>
          <div>
            <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>SHORELINE MATCH</div>
            <div style={{ color: 'var(--text-main, #000000)', fontSize: '16px', fontWeight: '700' }}>CUSTOM ANCHORING</div>
          </div>
        </div>
      </section>

      {/* DOCK CATEGORIES & TABS SECTION */}
      <section style={{ padding: '90px 40px', backgroundColor: 'var(--card-bg, #0F253F)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-main, #000000)', marginBottom: '16px' }}>Engineered Dock Layouts</h2>
              <p style={{ color: '#94A3B8', fontSize: '16px', maxWidth: '600px', margin: '0 auto 30px auto' }}>
                Explore custom layouts engineered for your shoreline bed composition, water depth, and boating needs.
              </p>

              {/* FILTER TAB BUTTONS */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['Straight Walkway Sections', 'L-Shape Patio Expansions', 'T-Junction & Custom Layouts'].map((tabName) => {
                  const isActive = activeTab === tabName;
                  return (
                    <button
                      key={tabName}
                      onClick={() => setActiveTab(tabName)}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid #D97706' : '1px solid var(--border-color, #1A2E45)',
                        backgroundColor: isActive ? '#D97706' : '#1A2E45',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: isActive ? '0 4px 12px rgba(217, 119, 6, 0.4)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.target.style.backgroundColor = '#243B57';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.target.style.backgroundColor = '#1A2E45';
                      }}
                    >
                      {tabName}
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* GRID CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
            
            {/* Card 1 */}
            <ScrollReveal delay="0.1s">
              <div 
                onMouseEnter={() => setHoveredCard(1)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: 'var(--bg-main, #0B1D33)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                  transform: hoveredCard === 1 || activeTab === 'Straight Walkway Sections' ? 'translateY(-4px)' : 'none',
                  borderColor: hoveredCard === 1 || activeTab === 'Straight Walkway Sections' ? '#D97706' : 'var(--border-color, rgba(255,255,255,0.08))',
                  boxShadow: hoveredCard === 1 || activeTab === 'Straight Walkway Sections' ? '0 12px 24px rgba(0,0,0,0.4)' : 'none'
                }}
              >
                <div style={{ height: '220px', backgroundColor: '#1A2E45', overflow: 'hidden' }}>
                  <img src="/images/straight-dock-water-view.jpg" alt="Straight Walkways" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '22px', color: '#FFFFFF', fontWeight: '700', marginBottom: '12px' }}>Straight Walkway Sections</h3>
                  <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                    Solid 8' x 16' straight walkway configurations built with 2x8 PT framing and 18" HDPE pontoon float logs for high stability.
                  </p>
                  <Link to="/products?category=sections" style={{ color: '#D97706', fontWeight: '700', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    View Specifications &rarr;
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 2 */}
            <ScrollReveal delay="0.2s">
              <div 
                onMouseEnter={() => setHoveredCard(2)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: 'var(--bg-main, #0B1D33)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                  transform: hoveredCard === 2 || activeTab === 'L-Shape Patio Expansions' ? 'translateY(-4px)' : 'none',
                  borderColor: hoveredCard === 2 || activeTab === 'L-Shape Patio Expansions' ? '#D97706' : 'var(--border-color, rgba(255,255,255,0.08))',
                  boxShadow: hoveredCard === 2 || activeTab === 'L-Shape Patio Expansions' ? '0 12px 24px rgba(0,0,0,0.4)' : 'none'
                }}
              >
                <div style={{ height: '220px', backgroundColor: '#1A2E45', overflow: 'hidden' }}>
                  <img src="/images/hero-dock.jpg" alt="L-Shape Layouts" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '22px', color: '#FFFFFF', fontWeight: '700', marginBottom: '12px' }}>L-Shape Patio Expansions</h3>
                  <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                    Features multi-hinge assemblies, heavy corner brackets, and integrated side bumpers for expanded deck seating and water access.
                  </p>
                  <Link to="/products?category=layouts" style={{ color: '#D97706', fontWeight: '700', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    View Specifications &rarr;
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 3 */}
            <ScrollReveal delay="0.3s">
              <div 
                onMouseEnter={() => setHoveredCard(3)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: 'var(--bg-main, #0B1D33)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                  transform: hoveredCard === 3 || activeTab === 'T-Junction & Custom Layouts' ? 'translateY(-4px)' : 'none',
                  borderColor: hoveredCard === 3 || activeTab === 'T-Junction & Custom Layouts' ? '#D97706' : 'var(--border-color, rgba(255,255,255,0.08))',
                  boxShadow: hoveredCard === 3 || activeTab === 'T-Junction & Custom Layouts' ? '0 12px 24px rgba(0,0,0,0.4)' : 'none'
                }}
              >
                <div style={{ height: '220px', backgroundColor: '#1A2E45', overflow: 'hidden' }}>
                  <img src="/images/dock-t-junction-cleats.jpg" alt="T-Junction Layouts" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '22px', color: '#FFFFFF', fontWeight: '700', marginBottom: '12px' }}>T-Junction & Custom Layouts</h3>
                  <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                    Designed with extra joist support, stainless steel cleats, and heavy-duty anchor chain rigs for multiple watercraft ties.
                  </p>
                  <Link to="/products?category=layouts" style={{ color: '#D97706', fontWeight: '700', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    View Specifications &rarr;
                  </Link>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* TRUST / CRAFTSMANSHIP SECTION */}
      <section 
        className="permanently-dark-banner"
        style={{ 
          padding: '90px 40px', 
          backgroundColor: '#0B1D33 !important', 
          borderTop: '1px solid rgba(255,255,255,0.05)' 
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
            <ScrollReveal>
              <div>
                <span style={{ color: '#D97706', fontSize: '13px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>In-Shop Fabrication</span>
                <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#FFFFFF !important', margin: '12px 0 20px 0', lineHeight: '1.2' }}>
                  Built for Harsh Water Conditions
                </h2>
                <p style={{ color: '#94A3B8 !important', fontSize: '16px', lineHeight: '1.7', marginBottom: '20px' }}>
                  Every Gerry's Dock is assembled with high-grade galvanized hardware, thru-bolted joints, and heavy-duty joist spacing designed to withstand rough wave action and ice shifts.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', color: '#CBD5E1 !important', fontSize: '15px' }}>
                  <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#D97706', fontWeight: 'bold' }}>✓</span> Thru-bolted subframe hardware joints
                  </li>
                  <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#D97706', fontWeight: 'bold' }}>✓</span> Custom shoreline rock mount plates
                  </li>
                  <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#D97706', fontWeight: 'bold' }}>✓</span> Puncture-resistant 18" HDPE pontoon floats
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal delay="0.2s">
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src="/images/shop-frame-build.jpg" alt="Shop Fabrication" style={{ width: '100%', height: '400px', objectFit: 'cover' }} />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section style={{ padding: '80px 40px', backgroundColor: '#D97706', textAlign: 'center', color: '#FFFFFF' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '38px', fontWeight: '800', marginBottom: '16px' }}>Ready to Upgrade Your Shoreline?</h2>
            <p style={{ fontSize: '18px', color: '#FEF3C7', marginBottom: '32px', lineHeight: '1.5' }}>
              Tell us about your shoreline substrate, water depth, and desired layout for a tailored estimate.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link 
                to="/quote" 
                onMouseEnter={() => setHoveredBtn('ctaPrimary')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  backgroundColor: hoveredBtn === 'ctaPrimary' ? '#1A2E45' : '#0B1D33',
                  color: '#FFFFFF',
                  padding: '14px 32px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'background-color 0.25s ease, transform 0.2s ease',
                  transform: hoveredBtn === 'ctaPrimary' ? 'translateY(-2px)' : 'none',
                  boxShadow: hoveredBtn === 'ctaPrimary' ? '0 4px 12px rgba(11, 29, 51, 0.4)' : 'none'
                }}
              >
                Start Custom Quote
              </Link>
              <Link 
                to="/products" 
                onMouseEnter={() => setHoveredBtn('ctaSecondary')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  backgroundColor: hoveredBtn === 'ctaSecondary' ? '#FFFFFF' : '#0B1D33',
                  color: hoveredBtn === 'ctaSecondary' ? '#0B1D33' : '#FFFFFF',
                  border: '2px solid #0B1D33',
                  padding: '12px 30px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.25s ease',
                  transform: hoveredBtn === 'ctaSecondary' ? 'translateY(-2px)' : 'none',
                  boxShadow: hoveredBtn === 'ctaSecondary' ? '0 4px 12px rgba(11, 29, 51, 0.3)' : 'none'
                }}
              >
                Browse Products
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* FOOTER - UPDATED WITH CLIENT INFORMATION */}
      <footer style={{ backgroundColor: 'var(--card-bg, #071322)', color: '#94A3B8', padding: '60px 40px 30px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div>
            <h3 style={{ color: 'var(--text-main, #FFFFFF)', fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>GERRY'S DOCKS</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>Custom marine construction and engineered dock systems built for ultimate shoreline longevity.</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-main, #FFFFFF)', fontSize: '14px', fontWeight: '700', marginBottom: '16px', letterSpacing: '0.5px' }}>NAVIGATION</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <Link to="/" style={{ color: '#94A3B8', textDecoration: 'none' }}>Home</Link>
              <Link to="/products" style={{ color: '#94A3B8', textDecoration: 'none' }}>Catalog</Link>
              <Link to="/quote" style={{ color: '#94A3B8', textDecoration: 'none' }}>Request Quote</Link>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-main, #FFFFFF)', fontSize: '14px', fontWeight: '700', marginBottom: '16px', letterSpacing: '0.5px' }}>SOCIAL MEDIA</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Instagram (@gerrysdocks)</a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>Facebook (Gerrys Docks)</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-main, #FFFFFF)', fontSize: '14px', fontWeight: '700', marginBottom: '16px', letterSpacing: '0.5px' }}>CONTACT</h4>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 8px 0' }}>Contact: Marty Gates</p>
              <p style={{ margin: '0 0 8px 0' }}>01 Janice St, Restoule, ON P0H 2R0</p>
              <p style={{ margin: '0 0 8px 0' }}>gerrysdocks@gmail.com</p>
              <p style={{ margin: 0 }}>705-477-2872</p>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '20px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))', textAlign: 'center', fontSize: '13px' }}>
          &copy; {new Date().getFullYear()} Gerry's Docks. All rights reserved.
        </div>
      </footer>

    </div>
  );
}