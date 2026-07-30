import React, { useState } from 'react';

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:5004/api/ai';

function parseAssistantResponse(rawText) {
  return rawText
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.replace(/^data:\s*/, '').trim())
    .filter((line) => line && line !== '[done]' && !line.startsWith('{'))
    .join('\n\n');
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi, I can help with dock products, quote requests, and choosing the right setup.',
    },
  ]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const text = message.trim();
    if (!text || isLoading) return;

    setMessage('');
    setMessages((current) => [...current, { role: 'user', text }]);
    setIsLoading(true);

    try {
      const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const rawText = await response.text();

      if (!response.ok) {
        throw new Error(rawText || 'AI assistant request failed.');
      }

      const assistantText =
        parseAssistantResponse(rawText) ||
        'I can help with Gerry’s Docks products and quote requests.';

      setMessages((current) => [...current, { role: 'assistant', text: assistantText }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: 'I could not reach the AI service right now. Please make sure ai-service is running on port 5004.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 1200, fontFamily: 'sans-serif' }}>
      {isOpen && (
        <section
          style={{
            width: '360px',
            maxWidth: 'calc(100vw - 48px)',
            height: '460px',
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: 'white',
            border: '1px solid #CBD5E0',
            borderRadius: '8px',
            boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            marginBottom: '14px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              backgroundColor: '#0B1D33',
              color: 'white',
              padding: '16px 18px',
              borderBottom: '3px solid #C25E14',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Gerry’s AI Assistant</h3>
              <p style={{ margin: '4px 0 0', color: '#A0AEC0', fontSize: '12px' }}>Products, quotes, and setup help</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI assistant"
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
              }}
            >
              x
            </button>
          </div>

          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#F7FAFC' }}>
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: item.role === 'user' ? '#C25E14' : 'white',
                    color: item.role === 'user' ? 'white' : '#2D3748',
                    border: item.role === 'user' ? 'none' : '1px solid #E2E8F0',
                    fontSize: '13px',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {item.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ color: '#718096', fontSize: '13px', fontWeight: '600' }}>
                Assistant is thinking...
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', padding: '14px', borderTop: '1px solid #E2E8F0' }}>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask about docks or quotes..."
              style={{
                flex: 1,
                minWidth: 0,
                padding: '11px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E0',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: '#C25E14',
                color: 'white',
                border: 'none',
                padding: '0 16px',
                borderRadius: '6px',
                fontWeight: '800',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              Send
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open AI assistant"
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '2px solid white',
          backgroundColor: '#C25E14',
          color: 'white',
          boxShadow: '0 10px 24px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease',
        }}
      >
        <svg 
          width="26" 
          height="26" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </button>
    </div>
  );
}