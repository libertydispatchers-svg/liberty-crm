'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StartVm() {
  const router = useRouter();
  useEffect(() => {
    // Trigger VM start via the protected API
    fetch('/api/vm/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', code: '64928' }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          alert('Failed to start VM: ' + (err.error || res.statusText));
          return;
        }
        return res.json();
      })
      .then(() => {
        // After VM is started, redirect to main app domain
        // You may change this URL to your custom domain if different
        window.location.href = 'https://app.libertydispatchers.com';
      })
      .catch((e) => {
        console.error(e);
        alert('Error contacting start endpoint');
      });
  }, []);

  // Simple loading UI while the request is in flight
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #ffb3c1, #ff69b4)',
      color: '#fff',
      fontFamily: 'sans-serif',
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚀 Starting Liberty Dispatchers…</h1>
      <p>We are waking up the backend VM. You will be redirected shortly.</p>
    </main>
  );
}
