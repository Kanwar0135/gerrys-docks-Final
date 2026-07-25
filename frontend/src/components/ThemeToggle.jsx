import React, { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) return savedTheme;

    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    const handleSystemChange = (e) => {
      if (!localStorage.getItem('app-theme')) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('app-theme', nextTheme);
  };

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      style={{
        position: 'relative',
        width: '46px',
        height: '24px',
        borderRadius: '12px',
        backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
        border: '1px solid var(--border-color, #3B5E8C)',
        cursor: 'pointer',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
        outline: 'none',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
      }}
    >
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: isDark ? '#334155' : '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transform: isDark ? 'translateX(22px)' : 'translateX(0px)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease',
          userSelect: 'none'
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  );
}