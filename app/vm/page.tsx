// app/vm/page.tsx
'use client';
import React, { useState } from 'react';

export default function VmControl() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'start' | 'stop') => {
    if (!code) {
      setMessage('Enter the gate code.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/vm/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ VM ${action}ed: ${data.message || data.success}`);
      } else {
        setMessage(`❌ ${data.error || 'Error'}`);
      }
    } catch (e) {
      setMessage('❌ Request failed');
    }
    setLoading(false);
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      background: 'linear-gradient(135deg, #0a0f17, #1a2b3c)',
      color: '#fff',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
        Liberty Dispatchers – VM Control Panel
      </h1>
      <input
        type="password"
        placeholder="Gate code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{
          padding: '0.75rem 1rem',
          fontSize: '1rem',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.05)',
          color: '#fff',
        }}
      />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => handleAction('start')}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#28a745',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
          }}>
          Start VM
        </button>
        <button
          onClick={() => handleAction('stop')}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#dc3545',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
          }}>
          Stop VM
        </button>
      </div>
      {message && (
        <p style={{ marginTop: '1rem', fontSize: '1rem' }}>{message}</p>
      )}
    </main>
  );
}
