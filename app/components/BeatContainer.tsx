'use client';
import React, { useState } from 'react';
import BeatCard from './BeatCard';

export default function BeatContainer({ generations, crates }: { generations: any[], crates: any[] }) {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  if (generations.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--accent-orange)', fontSize: '1.2rem', marginBottom: '1rem' }}>No beats found in this crate.</p>
        <p style={{ color: 'var(--text-secondary)' }}>Generate some hits and organize them here!</p>
      </div>
    );
  }

  return (
    <div>
       <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '0.5rem' }}>
         <button className={view === 'list' ? 'button highlight' : 'button'} onClick={() => setView('list')}>List</button>
         <button className={view === 'grid' ? 'button highlight' : 'button'} onClick={() => setView('grid')}>Grid</button>
       </div>

       {view === 'grid' ? (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', alignItems: 'start' }}>
            {generations.map(gen => <BeatCard key={gen.id} gen={gen} crates={crates} view={view} />)}
         </div>
       ) : (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {generations.map(gen => <BeatCard key={gen.id} gen={gen} crates={crates} view={view} />)}
         </div>
       )}
    </div>
  );
}
