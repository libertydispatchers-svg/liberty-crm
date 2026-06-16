'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { User, LogOut, CheckCircle, MapPin, Truck, Phone, Mail } from 'lucide-react';

const MiniMap = dynamic(() => import('./components/MiniMap'), { ssr: false });

export default function LandingPage() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>('register');
  const [isLoading, setIsLoading] = useState(true);
  
  // Register Form
  const [regForm, setRegForm] = useState({ name: '', phone: '', email: '', password: '' });
  // Login Form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  // Dashboard Form
  const [profile, setProfile] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', coverageAddress: '', coverageRadius: '25', vehicleType: '' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check auth on load
  useEffect(() => {
    fetch('/api/auth/applicant')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          fetchProfile();
          setView('dashboard');
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => setIsLoading(false));
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/applicant/profile');
      const data = await res.json();
      if (data.id) {
        setProfile(data);
        
        let coverageAddress = '';
        let coverageRadius = '25';
        let vehicle = '';
        const onboardDoc = data.documents?.find((d: any) => d.name === 'Onboarding Material');
        if (onboardDoc?.esignData) {
          try {
            const parsed = JSON.parse(onboardDoc.esignData);
            if (parsed.coverageAddress) coverageAddress = parsed.coverageAddress;
            if (parsed.coverageRadius) coverageRadius = parsed.coverageRadius;
            vehicle = parsed.vehicleType || '';
          } catch(e){}
        }

        setEditForm({
          name: data.name || '',
          phone: data.phone || '',
          coverageAddress,
          coverageRadius,
          vehicleType: vehicle
        });
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...regForm, source: 'WEBSITE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      
      // Auto-logged in
      await fetchProfile();
      setView('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/applicant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      await fetchProfile();
      setView('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/applicant/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchProfile();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/applicant', { method: 'DELETE' });
    setProfile(null);
    setView('login');
  };

  if (isLoading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>Loading...</div>;
  }

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
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <img 
          src="/logo.png" 
          alt="Liberty Dispatchers Logo" 
          style={{ maxWidth: '280px', height: 'auto', objectFit: 'contain', marginBottom: '1rem' }} 
        />
        {view !== 'dashboard' && (
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '500px', lineHeight: '1.6' }}>
            Bringing true liberty to the courier lifestyle. Join the dispatch revolution and take control of your route.
          </p>
        )}
      </div>

      {view === 'dashboard' && profile ? (
        <div style={{ width: '100%', maxWidth: '600px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          {/* Dashboard Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{profile.name}</h2>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} style={{ color: '#10b981' }} /> {profile.status === 'NEW' ? 'Account Created' : profile.status === 'ACTIVE' ? 'Active Courier' : 'Onboarding'}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>

          {/* Dashboard Form */}
          <form onSubmit={handleUpdateProfile} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                <User size={18} /> Personal Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Full Name</label>
                  <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Phone Number</label>
                  <input type="tel" required value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                <MapPin size={18} /> Coverage & Vehicle
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Coverage Address / City / Zip</label>
                  <input type="text" placeholder="e.g. Dallas, TX or 75201" value={editForm.coverageAddress} onChange={e => setEditForm({...editForm, coverageAddress: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Radius (Miles)</label>
                  <select value={editForm.coverageRadius} onChange={e => setEditForm({...editForm, coverageRadius: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: '#1e293b', color: '#fff' }}>
                    <option value="10">10 Miles</option>
                    <option value="25">25 Miles</option>
                    <option value="50">50 Miles</option>
                    <option value="100">100 Miles</option>
                    <option value="250">250 Miles</option>
                    <option value="Anywhere">Nationwide (Anywhere)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Vehicle Type</label>
                  <select value={editForm.vehicleType} onChange={e => setEditForm({...editForm, vehicleType: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: '#1e293b', color: '#fff' }}>
                    <option value="">Select vehicle...</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Cargo Van">Cargo Van</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="Bicycle/Scooter">Bicycle/Scooter</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <MiniMap address={editForm.coverageAddress} radiusStr={editForm.coverageRadius} />
                </div>
              </div>
            </div>

            {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.9rem', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>{errorMsg}</div>}
            {successMsg && <div style={{ color: '#10b981', fontSize: '0.9rem', padding: '10px', background: 'rgba(16,185,129,0.1)', borderRadius: '6px' }}>{successMsg}</div>}

            <button type="submit" disabled={isSubmitting} style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              border: 'none',
              cursor: isSubmitting ? 'wait' : 'pointer',
              opacity: isSubmitting ? 0.8 : 1,
              marginTop: '10px'
            }}>
              {isSubmitting ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem' }}>
          
          <div style={{ display: 'flex', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px' }}>
            <button 
              onClick={() => setView('register')}
              style={{ flex: 1, padding: '8px', border: 'none', background: view === 'register' ? '#2563eb' : 'transparent', color: view === 'register' ? '#fff' : '#94a3b8', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Apply Now
            </button>
            <button 
              onClick={() => setView('login')}
              style={{ flex: 1, padding: '8px', border: 'none', background: view === 'login' ? '#2563eb' : 'transparent', color: view === 'login' ? '#fff' : '#94a3b8', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Sign In
            </button>
          </div>

          {view === 'register' ? (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" required placeholder="Full Name" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '1rem' }} />
              <input type="tel" required placeholder="Phone Number" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '1rem' }} />
              <input type="email" required placeholder="Email Address" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '1rem' }} />
              <input type="password" required placeholder="Create Password" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '1rem' }} />
              
              {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '-4px' }}>{errorMsg}</div>}

              <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 600, border: 'none', cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: '8px' }}>
                {isSubmitting ? 'Creating Profile...' : 'Submit Application'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="email" required placeholder="Email Address" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '1rem' }} />
              <input type="password" required placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '1rem' }} />
              
              {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '-4px' }}>{errorMsg}</div>}

              <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 600, border: 'none', cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: '8px' }}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>
      )}

      <div style={{ marginTop: '4rem', display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
        <Link href="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
      </div>
    </div>
  );
}
