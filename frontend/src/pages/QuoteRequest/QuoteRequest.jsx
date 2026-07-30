import React, { useState, useEffect } from 'react';
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
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [verifiedAddress, setVerifiedAddress] = useState('');
  
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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Accessory multi-select toggle
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
    setStreetAddress('');
    setCity('');
    setProvince('');
    setPostalCode('');
    setCountry('');
    setVerifiedAddress('');
  };

  // Calculate live dynamic estimate
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

  const validateAddress = async () => {
    try {
      const response = await fetch(
        `https://addressvalidation.googleapis.com/v1:validateAddress?key=${import.meta.env.VITE_GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: {
              regionCode: country || 'CA',
              addressLines: [streetAddress, city, province, postalCode].filter(Boolean),
            },
          }),
        }
      );

      const data = await response.json();
      if (data.result?.address?.formattedAddress) {
        setVerifiedAddress(data.result.address.formattedAddress);
      }
    } catch (error) {
      console.error('Address validation error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('');

    if (!isValidNorthAmericanPhone(clientPhone)) {
      setSubmitStatus('Please enter a valid 10-digit phone number, such as (705) 477-2872.');
      return;
    }

    setIsSubmitting(true);

    // Run address validation check before submitting quote
    await validateAddress();

    const selectedProductData = PRODUCT_PRICING[selectedProduct] || PRODUCT_PRICING.custom;
    const fullLocation = [streetAddress, city, province, postalCode, country]
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
    <div style={{ backgroundColor: 'var(--bg-main, #071626)', minHeight: '100vh', padding: isMobile ? '24px 12px' : '40px 20px', fontFamily: 'sans-serif', color: 'var(--text-main, #E2E8F0)', transition: 'background-color 0.3s ease' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header Block */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '40px' }}>
          <h1 style={{ color: '#FFFFFF', fontSize: isMobile ? '28px' : '36px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '1px', lineHeight: 1.1 }}>
            INTERACTIVE QUOTE CONFIGURATOR
          </h1>
          <p style={{ color: 'var(--text-muted, #94A3B8)', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
            Specify your shoreline parameters and layout preferences. Our real-time estimator provides standard commercial pricing immediately.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mainGridColumns, gap: isMobile ? '18px' : '30px', alignItems: 'start' }}>
          
          {/* CONFIGURATION FORM */}
          <form onSubmit={handleSubmit} style={{ backgroundColor: 'var(--card-bg, #0F253F)', padding: isMobile ? '20px' : '40px', borderRadius: '10px', border: '1px solid var(--border-color, #1E3A5F)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: isMobile ? '24px' : '30px', minWidth: 0 }}>
            
            {/* Step 1: Base Platform */}
            <div>
              <h3 style={sectionHeaderStyle}>
                1. Select Platform System
              </h3>
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

            {/* Step 2: Shoreline Substrate */}
            <div>
              <h3 style={sectionHeaderStyle}>
                2. Lakebed Shoreline Substrate
              </h3>
              <p style={{ color: 'var(--text-muted, #94A3B8)', fontSize: '13px', margin: '-10px 0 15px 0' }}>
                Select the option that matches your lakebed environment to ensure proper leg anchoring.
              </p>
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
                        boxShadow: isSelected ? '0 4px 12px rgba(194, 94, 20, 0.4)' : '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: isSelected ? '#FFEDD5' : 'var(--text-muted, #94A3B8)' }}>{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Water Depth Profiles */}
            <div>
              <h3 style={sectionHeaderStyle}>
                3. Water-Depth Profile
              </h3>
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
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(194, 94, 20, 0.4)' : '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: isSelected ? '#FFEDD5' : 'var(--text-muted, #94A3B8)' }}>{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: System Accessories */}
            <div>
              <h3 style={sectionHeaderStyle}>
                4. Select Premium Accessories
              </h3>
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
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(194, 94, 20, 0.4)' : '0 2px 4px rgba(0,0,0,0.2)'
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

            {/* Step 5: Installation Site Address */}
            <div>
              <h3 style={sectionHeaderStyle}>
                5. Installation Site Address
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: addressGridColumns, gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Street Name / Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1301 16 Ave NW"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    style={inputStyle}
                  />
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
                  ✅ Verified: {verifiedAddress}
                </div>
              )}
            </div>

            {/* Step 6: Contact Details & Special Notes */}
            <div>
              <h3 style={sectionHeaderStyle}>
                6. Project Review Details
              </h3>
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
                    pattern="^(\\+?1[\\s.-]?)?(\\(?[2-9][0-9]{2}\\)?[\\s.-]?)[2-9][0-9]{2}[\\s.-]?[0-9]{4}$"
                    title="Enter a valid 10-digit phone number, such as (705) 477-2872."
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

            {/* Submit Button */}
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
                transition: 'background 0.2s ease, transform 0.2s ease',
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

          {/* DYNAMIC ESTIMATE PANEL (Sticky sidebar) */}
          <div style={{ position: viewportWidth < 980 ? 'static' : 'sticky', top: '100px', backgroundColor: 'var(--card-bg, #0B1D33)', color: 'var(--text-main, #FFFFFF)', padding: isMobile ? '22px' : '30px', borderRadius: '10px', border: '1px solid var(--border-color, #1E3A5F)', borderLeft: '6px solid #C25E14', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', minWidth: 0 }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: '800' }}>Layout Summary</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Preliminary Quote Estimate
            </span>

            {/* Large Price Display */}
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

            <div style={{ marginTop: '25px', padding: '15px', backgroundColor: 'var(--bg-main, #071626)', borderRadius: '6px', border: '1px solid var(--border-color, #1E3A5F)', fontSize: '12px', lineHeight: '1.5', color: '#FFFFFF' }}>
              <strong style={{ color: '#FFFFFF', display: 'block', marginBottom: '4px' }}>Note:</strong> This reflects regional material lists. Taxes, assembly labor, and professional delivery freight are calculated upon physical shoreline inspections.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
