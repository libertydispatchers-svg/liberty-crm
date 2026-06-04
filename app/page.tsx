'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    // In a real app, this would send data to the backend API to record opt-in
    setSubmitted(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <img 
          src="/logo.png" 
          alt="Liberty Dispatchers Logo" 
          style={{ maxWidth: '300px', height: 'auto', objectFit: 'contain' }} 
        />
      </div>
      
      <p style={{
        fontSize: '1.25rem',
        color: '#94a3b8',
        maxWidth: '600px',
        lineHeight: '1.6',
        marginBottom: '2rem',
      }}>
        Bringing true liberty to the courier lifestyle. Say goodbye to the rigid constraints of traditional delivery apps. 
        We offer complete freedom, flexible payment structures, instant access to exclusive markets, and <b>no standard commercial DL requirements</b>. 
        <br/><br/>
        Join the dispatch revolution and take control of your route.
      </p>

      {!submitted ? (
        <form onSubmit={handleSubmit} style={{
          backgroundColor: '#1e293b',
          padding: '2rem',
          borderRadius: '0.75rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'left',
          border: '1px solid #334155'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc' }}>Apply & Stay Updated</h2>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            Enter your mobile phone number to apply and receive updates about available delivery routes, dispatch assignments, and onboarding information from Liberty Dispatchers.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#e2e8f0' }}>
              Mobile Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 555-5555"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              style={{ marginTop: '0.25rem', width: '1.25rem', height: '1.25rem' }}
            />
            <label htmlFor="consent" style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5' }}>
              By checking this box, you agree to receive text messages from Liberty Dispatchers regarding dispatch assignments, route updates, and application status. Message frequency varies. Standard message and data rates may apply. Reply HELP for help or STOP to cancel at any time.
            </label>
          </div>

          <button
            type="submit"
            disabled={!consent || !phoneNumber}
            style={{
              width: '100%',
              backgroundColor: consent && phoneNumber ? '#2563eb' : '#475569',
              color: '#ffffff',
              padding: '1rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              border: 'none',
              cursor: consent && phoneNumber ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
            }}
          >
            Yes, sign me up!
          </button>
        </form>
      ) : (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '2rem',
          borderRadius: '0.75rem',
          maxWidth: '500px',
          width: '100%',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <h2 style={{ fontSize: '1.25rem', color: '#10b981', marginBottom: '0.5rem' }}>Thank You!</h2>
          <p style={{ color: '#94a3b8' }}>You have successfully opted in. We'll be in touch shortly with next steps.</p>
        </div>
      )}

      <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
        <Link href="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
      </div>
    </div>
  );
}
