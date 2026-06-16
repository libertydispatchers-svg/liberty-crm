'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [applicant, setApplicant] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    vehicleType: '',
    coverageArea: ''
  });

  useEffect(() => {
    fetch(`/api/applicants/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setApplicant(data);
        setForm({
          name: data.name !== 'Unknown' ? data.name : '',
          email: data.email && !data.email.includes('txt.voice') ? data.email : '',
          vehicleType: '',
          coverageArea: ''
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/applicants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          vehicleType: form.vehicleType,
          coverageArea: form.coverageArea,
          status: 'ONBOARDING'
        })
      });
      
      if (!res.ok) throw new Error('Failed to update details');
      
      alert('Thank you! Your details have been updated. You will now be redirected to the full onboarding form.');
      window.location.href = 'https://docs.google.com/forms/d/e/1FAIpQLSdy-E123456789/viewform?usp=pp_url&entry.12345=' + encodeURIComponent(form.email);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: 'white' }}>Loading...</div>;
  if (error) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#fca5a5' }}>Error: {error}</div>;

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
      padding: '2rem',
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <img 
          src="/logo.png" 
          alt="Liberty Dispatchers Logo" 
          style={{ maxWidth: '250px', height: 'auto', objectFit: 'contain' }} 
        />
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>Complete Your Profile</h2>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem', textAlign: 'center' }}>
          Please provide your real name and email address so we can send you the official onboarding documents.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Full Name</label>
            <input 
              type="text" 
              required 
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontSize: '1rem', boxSizing: 'border-box', color: '#000' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Real Email Address</label>
            <input 
              type="email" 
              required 
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontSize: '1rem', boxSizing: 'border-box', color: '#000' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Vehicle Type</label>
            <select 
              required 
              value={form.vehicleType}
              onChange={e => setForm({...form, vehicleType: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontSize: '1rem', boxSizing: 'border-box', color: '#000' }}
            >
              <option value="">Select your vehicle...</option>
              <option value="Sedan / Compact">Sedan / Compact</option>
              <option value="SUV / Minivan">SUV / Minivan</option>
              <option value="Cargo Van">Cargo Van</option>
              <option value="Box Truck">Box Truck</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Primary Coverage Area</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Downtown, Northside, All"
              value={form.coverageArea}
              onChange={e => setForm({...form, coverageArea: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', fontSize: '1rem', boxSizing: 'border-box', color: '#000' }}
            />
          </div>
          
          <button type="submit" disabled={submitting} style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '1rem',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            marginTop: '1rem'
          }}>
            {submitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
