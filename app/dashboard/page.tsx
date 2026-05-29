import React from 'react';
import { PrismaClient } from '@prisma/client';
import BeatContainer from '../components/BeatContainer';
import CreateCrateButton from '../components/CreateCrateButton';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function Dashboard({ searchParams }: { searchParams: { crateId?: string } }) {
  const pendingGenerations = await prisma.generation.findMany({ 
    where: { NOT: { status: { in: ['ready', 'SUCCESS', 'FAILURE', 'failed'] } } } 
  });
  
  // Sync pending items with Sonauto before rendering
  for (const gen of pendingGenerations) {
    if (gen.taskId) {
      const res = await fetch(`https://api.sonauto.ai/v1/generations/${gen.taskId}`, {
        headers: { 'Authorization': `Bearer ${process.env.SONAUTO_API_KEY}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Dashboard Polled Data:", data.status, "for", gen.taskId);
        if (data.status === 'SUCCESS' && data.song_paths && data.song_paths.length > 0) {
           await prisma.generation.update({
             where: { id: gen.id },
             data: { status: 'ready', beatUrl: data.song_paths[0] }
           });
           console.log("Updated to ready for", gen.id);
        } else if (data.status === 'FAILURE') {
           await prisma.generation.update({
             where: { id: gen.id },
             data: { status: 'failed' }
           });
        } else if (data.status && data.status !== gen.status) {
           await prisma.generation.update({
             where: { id: gen.id },
             data: { status: data.status }
           });
        }
      } else {
        console.error("Dashboard Poll failed:", res.status, await res.text());
      }
    }
  }

  const targetCrateId = searchParams?.crateId;
  const generations = await prisma.generation.findMany({
    where: targetCrateId ? { crateId: targetCrateId } : undefined,
    orderBy: { createdAt: 'desc' }
  });

  const crates = await prisma.crate.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2.5rem' }}>Your Studio</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/" className="button" style={{ textDecoration: 'none', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>+ New Beat</a>
          <a href="/dashboard" className="button" style={{ textDecoration: 'none' }}>Refresh Status</a>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
        <aside className="glass-panel" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Library</h3>
          <ul style={{ listStyle: 'none', color: 'var(--text-secondary)' }}>
            <li style={{ marginBottom: '0.8rem' }}>
              <a href="/dashboard" style={{ color: !targetCrateId ? 'white' : 'inherit', fontWeight: !targetCrateId ? '600' : '400' }}>All Beats</a>
            </li>
          </ul>

          <h3 style={{ marginBottom: '1rem', marginTop: '2rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Crates</h3>
          <ul style={{ listStyle: 'none', color: 'var(--text-secondary)' }}>
            {crates.map(c => (
              <li key={c.id} style={{ marginBottom: '0.8rem' }}>
                <a href={`/dashboard?crateId=${c.id}`} style={{ color: targetCrateId === c.id ? 'white' : 'inherit', fontWeight: targetCrateId === c.id ? '600' : '400' }}>
                  💿 {c.name}
                </a>
              </li>
            ))}
            {crates.length === 0 && <li style={{ opacity: 0.5, fontSize: '0.85rem' }}>No crates yet.</li>}
          </ul>
          
          <CreateCrateButton />
        </aside>

        <section>
          <BeatContainer generations={generations} crates={crates} />
        </section>
      </div>
    </main>
  );
}
