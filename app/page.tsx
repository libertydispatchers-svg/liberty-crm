'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await fetch('/api/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          source: 'WEBSITE'
        })
      });
      // Redirect to Google Form Onboarding Questionnaire
      // Update this URL with the actual form link once provided
      window.location.href = 'https://docs.google.com/forms/d/e/1FAIpQLSdy-E123456789/viewform?usp=pp_url&entry.12345=' + encodeURIComponent(form.email);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
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
        marginBottom: '3rem',
      }}>
        Bringing true liberty to the courier lifestyle. Say goodbye to the rigid constraints of traditional delivery apps. 
        We offer complete freedom, flexible payment structures, instant access to exclusive markets, and <b>no standard commercial DL requirements</b>. 
        <br/><br/>
        Join the dispatch revolution and take control of your route.
      </p>

      {!showForm ? (
        <button onClick={() => setShowForm(true)} style={{
          backgroundColor: '#2563eb',
          color: '#ffffff',
          padding: '1rem 2rem',
          borderRadius: '0.5rem',
          fontSize: '1.125rem',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}>
          Apply Now
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '2rem',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Courier Application</h3>
          <input 
            type="text" 
            required 
            placeholder="Full Name" 
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontSize: '1rem' }}
          />
          <input 
            type="email" 
            required 
            placeholder="Email Address" 
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontSize: '1rem' }}
          />
          <input 
            type="tel" 
            required 
            placeholder="Phone Number" 
            value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})}
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontSize: '1rem' }}
          />
          <button type="submit" disabled={isSubmitting} style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            cursor: isSubmitting ? 'wait' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            marginTop: '0.5rem'
          }}>
            {isSubmitting ? 'Submitting...' : 'Continue to Onboarding'}
          </button>
        </form>
      )}

      <div style={{ marginTop: '5rem', display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
        <Link href="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
      </div>
    </div>
  );
}
