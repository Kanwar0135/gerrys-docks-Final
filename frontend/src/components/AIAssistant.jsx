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

function parseAssistantError(rawText) {
  const errorLine = rawText
    .split('\n')
    .find((line) => line.startsWith('data: {') && line.includes('"error"'));

  if (!errorLine) return null;

  try {
    return JSON.parse(errorLine.replace(/^data:\s*/, '')).error;
  } catch {
    return null;
  }
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
        parseAssistantError(rawText) ||
        'The AI assistant did not return a response. Please check the AI service terminal.';

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
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Gerry's AI Assistant</h3>
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
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        title={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '8px',
          border: '2px solid white',
          backgroundColor: '#C25E14',
          color: 'white',
          boxShadow: '0 10px 24px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        <svg
          aria-hidden="true"
          width="42"
          height="42"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 36v-7c0-10.5 8-18.5 18-18.5s18 8 18 18.5v7"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect x="6" y="29" width="12" height="19" rx="5" fill="currentColor" />
          <rect x="46" y="29" width="12" height="19" rx="5" fill="currentColor" />
          <path
            d="M46 45c0 6-4 9-10 9h-5"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect x="24" y="49" width="13" height="8" rx="4" fill="currentColor" />
          <path
            d="M22 30c0-4 3.2-7 7.2-6.1l2.8.6 2.8-.6C38.8 23 42 26 42 30v6.3c0 2.4-2.2 4.2-4.6 3.7l-3.8-.8a8 8 0 0 0-3.2 0l-3.8.8c-2.4.5-4.6-1.3-4.6-3.7V30Z"
            fill="currentColor"
            opacity="0.92"
          />
          <circle cx="28" cy="32" r="2.5" fill="#C25E14" />
          <circle cx="36" cy="32" r="2.5" fill="#C25E14" />
        </svg>
      </button>
    </div>
  );
}
