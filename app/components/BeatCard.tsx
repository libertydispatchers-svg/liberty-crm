'use client';
import React, { useState } from 'react';

export default function BeatCard({ gen, crates, view = 'grid' }: { gen: any, crates: any[], view?: 'grid' | 'list' }) {
  const [stemStatus, setStemStatus] = useState(gen.stemStatus);
  const [splitting, setSplitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const [title, setTitle] = useState(gen.title || '');
  const [vibe, setVibe] = useState(gen.vibe || '');
  const [keyProperty, setKeyProperty] = useState(gen.key || '');
  const [crateId, setCrateId] = useState(gen.crateId || '');

  const handleSplit = async () => {
    setSplitting(true);
    setStemStatus('splitting');
    const res = await fetch(`/api/split/${gen.id}`, { method: 'POST' });
    if (res.ok) {
        setStemStatus('ready');
    }
    setSplitting(false);
  };

  const handleSaveMeta = async () => {
    await fetch(`/api/generations/${gen.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, vibe, crateId, key: keyProperty })
    });
    setEditing(false);
  };

  const displayTitle = gen.title || gen.prompt.substring(0, 40) + (gen.prompt.length > 40 ? '...' : '');
  const isList = view === 'list';

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: isList ? 'row' : 'column', position: 'relative', gap: isList ? '1rem' : '0' }}>
      
      {/* Top Banner Accent */}
      {!isList && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--accent-orange)' }} />}
      {isList && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '4px', background: 'var(--accent-orange)' }} />}

      <div style={{ flex: isList ? '1' : 'none', paddingLeft: isList ? '1rem' : '0' }}>
        {!editing ? (
          <>
            <h4 style={{ marginBottom: '0.2rem', marginTop: isList ? '0' : '0.5rem', color: '#fff', fontSize: '1.1rem' }}>{displayTitle}</h4>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
               {gen.vibe && <span style={{ background: '#2a2f34', color: 'var(--accent-green)', padding: '2px 8px', borderRadius: '2px', fontSize: '0.7rem' }}>{gen.vibe}</span>}
            </div>
            
            <button className="button" onClick={() => setShowDetails(!showDetails)} style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--text-secondary)', textTransform: 'none', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
               Details {showDetails ? '▲' : '▼'}
            </button>

            {showDetails && (
              <div style={{ background: 'var(--control-bg)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '2px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>TEMPO</span>
                    <p style={{ color: 'var(--accent-orange)', fontSize: '0.85rem' }}>{gen.bpm ? `${gen.bpm} BPM` : 'AUTO'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>KEY</span>
                    <p style={{ color: 'var(--accent-orange)', fontSize: '0.85rem' }}>{gen.key || 'UNKNOWN'}</p>
                  </div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>PROMPT</span>
                <p style={{ color: '#ccc', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '4px' }}>"{gen.prompt}"</p>
              </div>
            )}
            
            <button onClick={() => setEditing(true)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--accent-orange)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>EDIT</button>
          </>
        ) : (
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: isList ? '0' : '0.5rem' }}>
            <input type="text" className="input-field" placeholder="Beat Title" value={title} onChange={e => setTitle(e.target.value)} />
            <input type="text" className="input-field" placeholder="Vibe / Genre" value={vibe} onChange={e => setVibe(e.target.value)} />
            <input type="text" className="input-field" placeholder="Musical Key (e.g. C# Minor)" value={keyProperty} onChange={e => setKeyProperty(e.target.value)} />
            <select className="input-field" value={crateId} onChange={e => setCrateId(e.target.value)}>
              <option value="">No Crate</option>
              {crates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="button highlight" onClick={handleSaveMeta} style={{ alignSelf: 'flex-start' }}>Save Data</button>
          </div>
        )}

        {gen.status !== 'ready' && gen.status !== 'failed' && (
          <button className="button" disabled style={{ width: '100%', marginTop: isList ? '0' : '1rem' }}>
            Rendering... ({gen.status})
          </button>
        )}
      </div>

      {gen.status === 'ready' && gen.beatUrl && (
        <div style={{ flex: isList ? '2' : 'none', marginTop: isList ? '0' : 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <div style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '50%' }}></div>
             <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 500 }}>MASTER RENDER</span>
          </div>
          <audio controls src={`/api/audio/${gen.id}`} style={{ width: '100%', height: '32px', marginBottom: '0.5rem', filter: 'invert(0.9) hue-rotate(180deg) grayscale(1)' }} />

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <a href={`/api/audio/${gen.id}`} download={`Typebeat_${gen.id}_Master.mp3`} className="button" style={{ flex: 1, textAlign: 'center' }}>
              MP3
            </a>
            {stemStatus === 'none' && (
              <button onClick={handleSplit} disabled={splitting} className="button highlight" style={{ flex: 2 }}>
                {splitting ? 'Extracting...' : 'Isolate Stems'}
              </button>
            )}
            {stemStatus === 'splitting' && (
              <button disabled className="button" style={{ flex: 2, background: 'var(--accent-orange)' }}>
                Processing... 
              </button>
            )}
          </div>

          {stemStatus === 'ready' && (
             <div style={{ background: 'var(--control-bg)', padding: '0.5rem', borderRadius: '2px', border: '1px solid var(--border-color)' }}>
                <h5 style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem', fontSize: '0.7rem' }}>TRACK MULTITRACKS</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem' }}>
                   {['Vocals', 'Drums', 'Bass', 'Melody'].map((stemName, idx) => (
                      <a key={idx} href={`/api/audio/${gen.id}?stem=${stemName}`} download={`Typebeat_${gen.id}_${stemName}.mp3`} className="button" style={{ fontSize: '0.7rem', padding: '4px', textAlign: 'center', background: '#30363a' }}>
                        {stemName}
                      </a>
                   ))}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
