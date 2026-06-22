'use client';
import { useState, useEffect } from 'react';
import { Briefcase, Send, Plus, Trash2, Users } from 'lucide-react';

export default function JobBoard({ activeDrivers }: { activeDrivers: any[] }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [showNewJob, setShowNewJob] = useState(false);
  const [form, setForm] = useState({ title: '', company: '', pickupAddress: '', dropoffAddress: '', payout: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error('Failed to fetch jobs', e);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setForm({ title: '', company: '', pickupAddress: '', dropoffAddress: '', payout: '' });
        setShowNewJob(false);
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      fetchJobs();
    } catch (err) {}
  };

  const handleNotifyDrivers = async (jobId: string) => {
    // Send email/SMS notification to drivers near the pickup location
    if (!confirm('Send notification to all active drivers?')) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}/notify`, { method: 'POST' });
      if (res.ok) {
        alert('Notifications sent successfully!');
      } else {
        alert('Failed to send notifications.');
      }
    } catch (err) {
      alert('Error sending notifications.');
    }
  };

  const handleAssignDriver = async (jobId: string, driverId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedDriverId: driverId || null })
      });
      fetchJobs();
    } catch (err) {}
  };

  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Briefcase color="var(--accent-color)" /> Job Dispatch Board
        </h2>
        <button 
          onClick={() => setShowNewJob(!showNewJob)}
          className="button highlight"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Post New Job
        </button>
      </div>

      {showNewJob && (
        <div style={{ background: 'var(--panel-bg)', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
          <h3>Create Job Post</h3>
          <form onSubmit={handleCreateJob} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <input required placeholder="Job Title (e.g. Courier Run, Box Truck Delivery)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" style={{ gridColumn: '1 / -1' }} />
            <input placeholder="Company / Client Name" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="input-field" />
            <input required placeholder="Payout (e.g. $150.00)" value={form.payout} onChange={e => setForm({...form, payout: e.target.value})} className="input-field" />
            <input required placeholder="Pickup Address / City" value={form.pickupAddress} onChange={e => setForm({...form, pickupAddress: e.target.value})} className="input-field" />
            <input required placeholder="Dropoff Address / City" value={form.dropoffAddress} onChange={e => setForm({...form, dropoffAddress: e.target.value})} className="input-field" />
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" onClick={() => setShowNewJob(false)} className="button secondary">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="button highlight">Save Job</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {jobs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No jobs posted yet.</p>}
        {jobs.map(job => (
          <div key={job.id} style={{ background: 'var(--glass-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <button 
              onClick={() => handleDeleteJob(job.id)} 
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <Trash2 size={16} />
            </button>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>{job.title}</h3>
            <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{job.company}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Pickup:</span> <span>{job.pickupAddress}</span>
              <span style={{ color: 'var(--text-muted)' }}>Dropoff:</span> <span>{job.dropoffAddress}</span>
              <span style={{ color: 'var(--text-muted)' }}>Payout:</span> <span style={{ fontWeight: 'bold', color: 'var(--status-active)' }}>{job.payout}</span>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span> 
              <span style={{ 
                color: job.status === 'OPEN' ? 'var(--status-new)' : 'var(--status-active)', 
                fontWeight: 'bold' 
              }}>
                {job.status}
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Assign Driver</label>
                <select 
                  className="input-field" 
                  value={job.assignedDriverId || ''} 
                  onChange={(e) => handleAssignDriver(job.id, e.target.value)}
                  style={{ padding: '8px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Unassigned --</option>
                  {activeDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => handleNotifyDrivers(job.id)}
                className="button secondary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
              >
                <Send size={14} /> Notify Area Drivers
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
