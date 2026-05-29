'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCrateButton() {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch('/api/crates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      setName('');
      router.refresh();
    }
    setCreating(false);
  };

  return (
    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
      <input 
        type="text" 
        className="input-field" 
        style={{ padding: '8px', fontSize: '0.8rem' }}
        placeholder="New Crate Name" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
      />
      <button 
        className="button" 
        onClick={handleCreate}
        disabled={creating || !name.trim()}
        style={{ padding: '8px', fontSize: '1rem' }}
      >
        +
      </button>
    </div>
  );
}
