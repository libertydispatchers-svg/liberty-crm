import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Liberty Dispatchers',
  description: 'Bringing liberty to the delivery courier lifestyle.',
};

export default function LandingPage() {
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

      <a href="mailto:apply@libertydispatch.xyz" style={{
        backgroundColor: '#2563eb',
        color: '#ffffff',
        padding: '1rem 2rem',
        borderRadius: '0.5rem',
        fontSize: '1.125rem',
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'background-color 0.2s',
      }}>
        Apply Now
      </a>

      <div style={{ marginTop: '5rem', display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
        <Link href="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
      </div>
    </div>
  );
}
