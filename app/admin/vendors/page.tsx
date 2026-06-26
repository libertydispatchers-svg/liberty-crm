'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft, Building2 } from 'lucide-react';

export default function VendorsAdminPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check auth
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )liberty_gate=([^;]+)'));
      if (!match) {
        router.push('/gate');
        return;
      }
    }
    fetchVendors();
  }, [router]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendors/list'); // we need to create this route
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="admin-header" style={{ 
        borderBottom: '1px solid var(--border-color)', 
        background: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px 32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/admin')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={18} /> Back to CRM
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 /> Vendor Leads
          </h1>
        </div>

        <button onClick={fetchVendors} className="button" style={{ padding: '8px 12px' }}>
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} /> Refresh
        </button>
      </header>

      <main style={{ padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto', flex: 1 }}>
        <div className="glass-panel">
          <h2 style={{ marginBottom: '16px', color: 'var(--navy-blue)' }}>Registered Vendors</h2>
          {loading ? (
            <p>Loading vendors...</p>
          ) : vendors.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No vendors have signed up yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px' }}>Business Name</th>
                  <th style={{ padding: '12px' }}>Type</th>
                  <th style={{ padding: '12px' }}>Contact</th>
                  <th style={{ padding: '12px' }}>Phone / WhatsApp</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{v.businessName}</td>
                    <td style={{ padding: '12px' }}>{v.businessType}</td>
                    <td style={{ padding: '12px' }}>{v.contactName}</td>
                    <td style={{ padding: '12px' }}>
                      {v.phone}
                      {v.whatsapp && <div style={{ fontSize: '0.8rem', color: '#10b981' }}>WA: {v.whatsapp}</div>}
                    </td>
                    <td style={{ padding: '12px' }}>{v.email}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
