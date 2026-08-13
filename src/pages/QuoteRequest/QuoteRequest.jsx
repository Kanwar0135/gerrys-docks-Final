import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const QUOTE_API_URL = import.meta.env.VITE_QUOTE_API_URL || 'http://localhost:5002/api/quotes';

function isValidNorthAmericanPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  const normalized = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;

  if (normalized.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(normalized)) return false;
  if (normalized[0] === '0' || normalized[0] === '1') return false;
  if (normalized[3] === '0' || normalized[3] === '1') return false;

  return true;
}

const PRODUCT_PRICING = {
  'dock-sec-16': { name: "Straight Walkway Section (8' x 16')", basePrice: 2450 },
  'dock-lay-l': { name: 'L-Shape Patio Expansion Unit', basePrice: 4800 },
  'dock-lay-t': { name: 'T-Junction Dock System', basePrice: 5200 },
  'dock-hw-joint': { name: 'Heavy-Duty Subframe Joint', basePrice: 1250 },
  'dock-fl-18': { name: '18" HDPE Pontoon Float Mount', basePrice: 1850 },
  'dock-hw-rock': { name: 'Shoreline Rock Mount Bracket', basePrice: 950 },
  'custom': { name: 'Fully Custom Layout Design', basePrice: 3000 }
};

export default function QuoteRequest({ userLoggedIn, triggerLoginPrompt }) {
  const location = useLocation();
  
  // Form State
  const [selectedProduct, setSelectedProduct] = useState('custom');
  const [substrate, setSubstrate] = useState('');
  const [waterDepth, setWaterDepth] = useState('shallow');
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Contact Details
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address State
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [verifiedAddress, setVerifiedAddress] = useState('');

  // Custom Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionWrapperRef = useRef(null);
  
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1200 : window.innerWidth
  );

  const isMobile = viewportWidth < 720;
  const isTablet = viewportWidth >= 720 && viewportWidth < 980;
  const optionGridColumns = isMobile ? '1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))';
  const mainGridColumns = viewportWidth < 980 ? '1fr' : 'minmax(0, 1fr) 380px';
  const addressGridColumns = isMobile ? '1fr' : 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)';
  const twoColumnGrid = isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))';

  // Extract initial product from URL search params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prodId = params.get('product');
    if (prodId && PRODUCT_PRICING[prodId]) {
      setSelectedProduct(prodId);
    }
  }, [location]);

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);

    function handleClickOutside(event) {
      if (suggestionWrapperRef.current && !suggestionWrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch address suggestions using Photon by Komoot (CORS-friendly frontend alternative)
  const handleStreetChange = async (e) => {
    const value = e.target.value;
    setStreet(value);

    if (value.length > 2) {
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=5`
        );
        const rawData = await response.json();
        
        // Map Photon's GeoJSON structure to match your component expectation
        const formattedData = (rawData.features || []).map(feature => {
          const props = feature.properties || {};
          const displayName = [
            props.housenumber,
            props.street,
            props.city,
            props.state,
            props.country
          ].filter(Boolean).join(', ');

          return {
            display_name: displayName,
            address: {
              house_number: props.housenumber || '',
              road: props.street || '',
              city: props.city || props.town || props.village || '',
              state: props.state || '',
              postcode: props.postcode || '',
              country: props.country || ''
            }
          };
        });

        if (formattedData.length > 0) {
          setSuggestions(formattedData);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Error fetching address suggestions:', err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle selecting an address item from suggestions
  const handleSelectPrediction = (item) => {
    const addr = item.address || {};
    const houseNumber = addr.house_number || '';
    const road = addr.road || '';
    const fullStreet = `${houseNumber} ${road}`.trim() || item.display_name.split(',')[0];

    setStreet(fullStreet);
    setCity(addr.city || '');
    setProvince(addr.state || '');
    setPostalCode(addr.postcode || '');
    setCountry(addr.country || '');
    setVerifiedAddress(item.display_name);
    setShowSuggestions(false);
  };

  const toggleAccessory = (accId) => {
    if (selectedAccessories.includes(accId)) {
      setSelectedAccessories(selectedAccessories.filter(id => id !== accId));
    } else {
      setSelectedAccessories([...selectedAccessories, accId]);
    }
  };

  const resetQuoteForm = () => {
    setSelectedProduct('custom');
    setSubstrate('');
    setWaterDepth('shallow');
    setSelectedAccessories([]);
    setAdditionalNotes('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setStreet('');
    setCity('');
    setProvince('');
    setPostalCode('');
    setCountry('');
    setVerifiedAddress('');
  };

  const base = PRODUCT_PRICING[selectedProduct]?.basePrice || 3000;
  const substrateSurcharge = substrate === 'muck' || substrate === 'rock' ? 450 : 0;
  const depthSurcharge = waterDepth === 'deep' ? 600 : waterDepth === 'fluctuating' ? 850 : 0;
  const accessoriesTotal = selectedAccessories.reduce((sum, acc) => {
    if (acc === 'cleats') return sum + 120;
    if (acc === 'bumpers') return sum + 280;
    if (acc === 'ladder') return sum + 350;
    return sum;
  }, 0);
  const totalEstimate = base + substrateSurcharge + depthSurcharge + accessoriesTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('');

    if (!isValidNorthAmericanPhone(clientPhone)) {
      setSubmitStatus('Please enter a valid 10-digit phone number, such as (705) 477-2872.');
      return;
    }

    setIsSubmitting(true);

    const selectedProductData = PRODUCT_PRICING[selectedProduct] || PRODUCT_PRICING.custom;
    const fullLocation = [street, city, province, postalCode, country]
      .filter(Boolean)
      .join(', ');

    try {
      const response = await fetch(QUOTE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: clientName,
          email: clientEmail,
          phone: clientPhone,
          location: fullLocation,
          notes: [
            `Selected product: ${selectedProductData.name}`,
            `Lakebed substrate: ${substrate || 'Not specified'}`,
            `Water depth: ${waterDepth}`,
            `Accessories: ${selectedAccessories.length ? selectedAccessories.join(', ') : 'None'}`,
            additionalNotes,
          ]
            .filter(Boolean)
            .join('\n'),
          subtotal: totalEstimate,
          items: [
            {
              productId: selectedProduct,
              quantity: 1,
              priceAtTime: selectedProductData.basePrice,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit quote request.');
      }

      setSubmitStatus(`Quote request submitted. Preliminary estimate: $${totalEstimate.toLocaleString()}.`);
      resetQuoteForm();
    } catch (error) {
      setSubmitStatus(error.message || 'Unable to submit quote request. Please check quote-service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '6px',
    border: '1px solid var(--border-color, #3B5E8C)',
    backgroundColor: 'var(--bg-main, #1E3E66)',
    color: '#FFFFFF',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: '6px',
    letterSpacing: '0.5px'
  };

  const sectionHeaderStyle = {
    color: 'var(--text-main, #FFFFFF)',
    fontSize: '18px',
    fontWeight: '800',
    margin: '0 0 15px 0',
    borderBottom: '2px solid var(--border-color, #1E3A5F)',
    paddingBottom: '8px'
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main, #071626)', minHeight: '100vh', padding: isMobile ? '24px 12px' : '40px 20px', fontFamily: 'sans-serif', color: 'var(--text-main, #E2E8F0)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '40px' }}>
          <h1 style={{ color: '#FFFFFF', fontSize: isMobile ? '28px' : '36px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '1px', lineHeight: 1.1 }}>
            INTERACTIVE QUOTE CONFIGURATOR
          </h1>
          <p style={{ color: 'var(--text-muted, #94A3B8)', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
            Specify your shoreline parameters and layout preferences. Our real-time estimator provides standard commercial pricing immediately.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mainGridColumns, gap: isMobile ? '18px' : '30px', alignItems: 'start' }}>
          
          <form onSubmit={handleSubmit} style={{ backgroundColor: 'var(--card-bg, #0F253F)', padding: isMobile ? '20px' : '40px', borderRadius: '10px', border: '1px solid var(--border-color, #1E3A5F)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: isMobile ? '24px' : '30px', minWidth: 0 }}>
            
            <div>
              <h3 style={sectionHeaderStyle}>1. Select Platform System</h3>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                style={{ ...inputStyle, height: '44px', fontWeight: '600', color: '#FFFFFF' }}
              >
                {Object.entries(PRODUCT_PRICING).map(([id, data]) => (
                  <option key={id} value={id} style={{ backgroundColor: '#071626', color: '#FFFFFF' }}>
                    {data.name} (Base: ${data.basePrice.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 style={sectionHeaderStyle}>2. Lakebed Shoreline Substrate</h3>
              <div style={{ display: 'grid', gridTemplateColumns: optionGridColumns, gap: '15px' }}>
                {[
                  { id: 'sand', label: 'Sandy / Solid', desc: 'Standard support' },
                  { id: 'muck', label: 'Muddy / Muck', desc: 'Silt mud (+ $450)' },
                  { id: 'rock', label: 'Rocky Shale', desc: 'Heavy anchor (+ $450)' }
                ].map((item) => {
                  const isSelected = substrate === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSubstrate(item.id)}
                      style={{
                        padding: '16px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid #C25E14' : '1px solid var(--border-color, #3B5E8C)',
                        backgroundColor: isSelected ? '#C25E14' : 'var(--bg-main, #1E3E66)',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: isSelected ? '#FFEDD5' : 'var(--text-muted, #94A3B8)' }}>{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 style={sectionHeaderStyle}>3. Water-Depth Profile</h3>
              <div style={{ display: 'grid', gridTemplateColumns: optionGridColumns, gap: '15px' }}>
                {[
                  { id: 'shallow', label: 'Shallow (<4ft)', desc: 'Standard legs' },
                  { id: 'deep', label: 'Deep (4ft - 9ft)', desc: 'Braced columns (+ $600)' },
                  { id: 'fluctuating', label: 'Highly Fluctuating', desc: 'Adaptive chains (+ $850)' }
                ].map((item) => {
                  const isSelected = waterDepth === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWaterDepth(item.id)}
                      style={{
                        padding: '16px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid #C25E14' : '1px solid var(--border-color, #3B5E8C)',
                        backgroundColor: isSelected ? '#C25E14' : 'var(--bg-main, #1E3E66)',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: isSelected ? '#FFEDD5' : 'var(--text-muted, #94A3B8)' }}>{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 style={sectionHeaderStyle}>4. Select Premium Accessories</h3>
              <div style={{ display: 'grid', gridTemplateColumns: optionGridColumns, gap: '15px' }}>
                {[
                  { id: 'cleats', label: 'Tie-Up Cleats', price: '+$120', desc: '4x marine cast nylon' },
                  { id: 'bumpers', label: 'Vertical Bumpers', price: '+$280', desc: 'Polyester shock guards' },
                  { id: 'ladder', label: 'Access Ladder', price: '+$350', desc: '4-step aluminum flip' }
                ].map((item) => {
                  const isSelected = selectedAccessories.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleAccessory(item.id)}
                      style={{
                        padding: '16px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid #C25E14' : '1px solid var(--border-color, #3B5E8C)',
                        backgroundColor: isSelected ? '#C25E14' : 'var(--bg-main, #1E3E66)',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.label}</div>
                      <div style={{ fontWeight: '800', fontSize: '13px', color: isSelected ? '#FFFFFF' : '#FFEDD5', margin: '2px 0' }}>{item.price}</div>
                      <div style={{ fontSize: '11px', color: isSelected ? '#FFEDD5' : 'var(--text-muted, #94A3B8)' }}>{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 style={sectionHeaderStyle}>5. Installation Site Address</h3>

              <div style={{ display: 'grid', gridTemplateColumns: addressGridColumns, gap: '15px', marginBottom: '15px' }}>
                <div style={{ position: 'relative' }} ref={suggestionWrapperRef}>
                  <label style={labelStyle}>Street Name / Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1301 16 Ave NW"
                    value={street}
                    onChange={handleStreetChange}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    style={inputStyle}
                  />

                  {showSuggestions && suggestions.length > 0 && (
                    <ul style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 9999,
                      margin: '4px 0 0 0',
                      padding: 0,
                      listStyle: 'none',
                      backgroundColor: '#0F253F',
                      border: '1px solid #3B5E8C',
                      borderRadius: '6px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      maxHeight: '220px',
                      overflowY: 'auto'
                    }}>
                      {suggestions.map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => handleSelectPrediction(item)}
                          style={{
                            padding: '10px 14px',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            cursor: 'pointer',
                            borderTop: '1px solid #1E3A5F'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E3E66'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {item.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Calgary"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Province / State</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AB"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Postal / ZIP Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. T2M 0L4"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Canada"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {verifiedAddress && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#4BB543', fontWeight: 'bold' }}>
                  ✅ Selected: {verifiedAddress}
                </div>
              )}
            </div>

            <div>
              <h3 style={sectionHeaderStyle}>6. Project Review Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Contact Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="(705) 477-2872"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Shoreline Notes / Location Parameters</label>
                <textarea
                  rows="3"
                  placeholder="List any extreme currents, ice movement, or specific requirements..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? '#718096' : '#C25E14',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(194, 94, 20, 0.4)'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Layout Configuration'}
            </button>

            {submitStatus && (
              <div style={{ padding: '14px 16px', borderRadius: '6px', backgroundColor: submitStatus.startsWith('Quote request submitted') ? '#DEF7EC' : '#FEF3C7', color: submitStatus.startsWith('Quote request submitted') ? '#03543F' : '#92400E', fontSize: '13px', fontWeight: '700' }}>
                {submitStatus}
              </div>
            )}
          </form>

          <div style={{ position: viewportWidth < 980 ? 'static' : 'sticky', top: '100px', backgroundColor: 'var(--card-bg, #0B1D33)', color: 'var(--text-main, #FFFFFF)', padding: isMobile ? '22px' : '30px', borderRadius: '10px', border: '1px solid var(--border-color, #1E3A5F)', borderLeft: '6px solid #C25E14', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', minWidth: 0 }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: '800' }}>Layout Summary</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Preliminary Quote Estimate
            </span>

            <div style={{ fontSize: isMobile ? '34px' : '42px', fontWeight: '900', color: '#C25E14', margin: '15px 0' }}>
              ${totalEstimate.toLocaleString()}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color, #1E3A5F)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #94A3B8)' }}>Base Assembly:</span>
                <span style={{ fontWeight: 'bold' }}>${base.toLocaleString()}</span>
              </div>
              {substrateSurcharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #94A3B8)' }}>Lakebed Anchor Upgrade:</span>
                  <span style={{ fontWeight: 'bold', color: '#C25E14' }}>+${substrateSurcharge}</span>
                </div>
              )}
              {depthSurcharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #94A3B8)' }}>Deep Bracing Structural:</span>
                  <span style={{ fontWeight: 'bold', color: '#C25E14' }}>+${depthSurcharge}</span>
                </div>
              )}
              {accessoriesTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #94A3B8)' }}>Fittings & Accessories:</span>
                  <span style={{ fontWeight: 'bold', color: '#C25E14' }}>+${accessoriesTotal}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}