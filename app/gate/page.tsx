'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, AlertCircle, Lock, ArrowRight } from 'lucide-react';

function GateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';
  
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If they already have the correct cookie, just send them along
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
      return '';
    };
    if (getCookie('liberty_gate') === '6492') {
      router.push(redirectTarget);
    }
  }, [router, redirectTarget]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code) return;
    
    setLoading(true);
    setErrorMsg('');

    // Simulate network delay for premium feel and security
    setTimeout(() => {
      if (code === '6492') {
        // Set cookie for 30 days
        document.cookie = "liberty_gate=6492; path=/; max-age=2592000; SameSite=Strict; Secure";
        router.push(redirectTarget);
      } else {
        setErrorMsg('Invalid Authorization Passcode. Access Denied.');
        setCode('');
        setLoading(false);
      }
    }, 600);
  };

  const handleKeyPress = (num: string) => {
    setErrorMsg('');
    if (code.length < 8) {
      setCode(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setCode(prev => prev.slice(0, -1));
  };

  // Submit automatically when 4 digits are entered
  useEffect(() => {
    if (code === '6492') {
      handleSubmit();
    } else if (code.length >= 4) {
      // Check if it's incorrect
      handleSubmit();
    }
  }, [code]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #070f1e 0%, #0b2848 50%, #1e40af 100%)',
      fontFamily: "'Outfit', -apple-system, sans-serif",
      color: '#ffffff',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.2,
        pointerEvents: 'none'
      }} />

      {/* Decorative glow elements */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(59, 130, 246, 0.15)',
        filter: 'blur(80px)',
        top: '10%',
        left: '10%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(215, 181, 95, 0.1)',
        filter: 'blur(100px)',
        bottom: '10%',
        right: '10%',
        pointerEvents: 'none'
      }} />

      {/* Center Card */}
      <div className="glass-panel" style={{
        maxWidth: '400px',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '36px 30px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'var(--navy-blue, #0b2848)',
            border: '1px solid var(--border-color, #cbd5e1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
          }}>
            <img src="/logo.png?v=1" alt="Liberty Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#ffffff', margin: 0 }}>
              Liberty Dispatchers
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
              Command Gateway
            </span>
          </div>
        </div>

        {/* Form / Passcode display */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', margin: 0 }}>
            Enter secure authorization code
          </p>

          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {/* Password Dots Indicator */}
            <div style={{ display: 'flex', gap: '14px', margin: '10px 0' }}>
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    background: code.length > i ? '#ffffff' : 'transparent',
                    boxShadow: code.length > i ? '0 0 10px #ffffff' : 'none',
                    transition: 'all 0.15s ease'
                  }} 
                />
              ))}
            </div>

            {/* Hidden Input field for keyboard entries */}
            <input 
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(e) => {
                setErrorMsg('');
                setCode(e.target.value.replace(/\D/g, ''));
              }}
              style={{
                position: 'absolute',
                opacity: 0,
                height: 0,
                width: 0,
                pointerEvents: 'none'
              }}
              autoFocus
              disabled={loading}
            />

            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fca5a5',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                justifyContent: 'center'
              }}>
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          width: '100%',
          maxWidth: '260px'
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={loading}
              className="keypad-btn"
              style={{
                aspectRatio: '1.1',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '1.25rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setCode('')}
            disabled={loading}
            style={{
              borderRadius: '12px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            disabled={loading}
            className="keypad-btn"
            style={{
              aspectRatio: '1.1',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              fontSize: '1.25rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={loading}
            style={{
              borderRadius: '12px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Delete
          </button>
        </div>

        {/* Bottom Lock Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
          <Lock size={10} />
          <span>AES-256 Encrypted Session Access</span>
        </div>
      </div>

      {/* Global CSS for Touch/Click States */}
      <style jsx global>{`
        .keypad-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-1px);
        }
        .keypad-btn:active:not(:disabled) {
          background: rgba(255, 255, 255, 0.08) !important;
          transform: translateY(1px) scale(0.95);
        }
      `}</style>
    </div>
  );
}

export default function GatePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #070f1e 0%, #0b2848 100%)',
        color: '#ffffff',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="spin-anim" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%' }} />
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Loading Command Gateway...</span>
        </div>
        <style jsx global>{`
          .spin-anim {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <GateContent />
    </Suspense>
  );
}
