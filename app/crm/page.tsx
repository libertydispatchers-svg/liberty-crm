'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Phone, MessageSquare, Mail, Database, FileText, 
  CheckCircle2, AlertCircle, Trash2, Send, Clock, User, 
  ShieldCheck, RefreshCw, X, PhoneCall, Check, Calendar, ExternalLink
} from 'lucide-react';

export default function CrmDashboard() {
  // DB Applicants state
  const [applicants, setApplicants] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
  // Workspace tabs: 'voice', 'gmail', 'sheets', 'docs', 'whatsapp'
  const [activeTab, setActiveTab] = useState<'voice' | 'gmail' | 'sheets' | 'docs' | 'whatsapp'>('voice');
  
  // API statuses
  const [loading, setLoading] = useState(true);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [creatingApplicant, setCreatingApplicant] = useState(false);
  
  // Integration States
  const [gmailData, setGmailData] = useState<any>({ connected: false, emails: [], emailAddress: '' });
  const [voiceData, setVoiceData] = useState<any>({ googleVoiceNumber: '', callLogs: [], smsThreads: [], connected: false });
  const [sheetsData, setSheetsData] = useState<any>({ connected: false, rows: [], spreadsheetName: '' });

  // Voice States
  const [selectedSmsThread, setSelectedSmsThread] = useState<any | null>(null);
  const [smsInputText, setSmsInputText] = useState('');
  const [dialedNumber, setDialedNumber] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [activeCall, setActiveCall] = useState<string | null>(null);

  // Gmail states
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  
  // WhatsApp states
  const [whatsappData, setWhatsappData] = useState<any>({ connected: false, chats: [] });
  const [selectedWhatsappChat, setSelectedWhatsappChat] = useState<any | null>(null);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  
  // Add Note state
  const [noteInput, setNoteInput] = useState('');

  // Sheets inline editing state
  const [editingCell, setEditingCell] = useState<{ rowIdx: number, field: 'name' | 'phone' | 'email', value: string } | null>(null);

  // New Applicant Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApplicantForm, setNewApplicantForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'EMAIL'
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ name: '', phone: '', email: '' });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Refs for polling interval to prevent stale closures overriding selection
  const selectedApplicantIdRef = useRef<string | null>(null);
  const selectedSmsThreadPhoneRef = useRef<string | null>(null);
  const selectedEmailIdRef = useRef<string | null>(null);

  useEffect(() => { selectedApplicantIdRef.current = selectedApplicant?.id || null; }, [selectedApplicant]);
  useEffect(() => { selectedSmsThreadPhoneRef.current = selectedSmsThread?.phone || null; }, [selectedSmsThread]);
  useEffect(() => { selectedEmailIdRef.current = selectedEmail?.id || null; }, [selectedEmail]);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, gmailRes, voiceRes, sheetsRes, whatsappRes] = await Promise.allSettled([
        fetch(`/api/applicants?search=${searchQuery}&status=${statusFilter}&source=${sourceFilter}`).then(r => r.json()),
        fetch('/api/gmail').then(r => r.json()),
        fetch('/api/voice').then(r => r.json()),
        fetch('/api/sheets').then(r => r.json()),
        fetch('/api/whatsapp').then(r => r.json()).catch(() => null)
      ]);

      if (appRes.status === 'fulfilled' && appRes.value) {
        const appData = appRes.value;
        setApplicants(appData);
        if (appData.length > 0 && !selectedApplicantIdRef.current) {
          setSelectedApplicant(appData[0]);
        } else if (selectedApplicantIdRef.current) {
          const refreshed = appData.find((a: any) => a.id === selectedApplicantIdRef.current);
          if (refreshed) setSelectedApplicant(refreshed);
        }
      }

      if (gmailRes.status === 'fulfilled' && gmailRes.value) {
        const gData = gmailRes.value;
        setGmailData(gData);
        if (gData.emails?.length > 0 && !selectedEmailIdRef.current) {
          setSelectedEmail(gData.emails[0]);
        }
      }

      if (voiceRes.status === 'fulfilled' && voiceRes.value) {
        const vData = voiceRes.value;
        setVoiceData(vData);
        if (vData.smsThreads?.length > 0) {
          if (selectedSmsThreadPhoneRef.current) {
            const refreshedThread = vData.smsThreads.find((t: any) => t.phone === selectedSmsThreadPhoneRef.current);
            if (refreshedThread) setSelectedSmsThread(refreshedThread);
          } else {
            setSelectedSmsThread(vData.smsThreads[0]);
          }
        }
      }

      if (sheetsRes.status === 'fulfilled' && sheetsRes.value) {
        setSheetsData(sheetsRes.value);
      }

      if (whatsappRes.status === 'fulfilled' && whatsappRes.value) {
        const wData = whatsappRes.value;
        setWhatsappData(wData);
        if (wData.chats?.length > 0 && !selectedWhatsappChat) {
          setSelectedWhatsappChat(wData.chats[0]);
        }
      }

    } catch (error) {
      console.error('Error loading CRM dashboard data:', error);
    }
    setLoading(false);
  };

  const handleSyncInbox = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      await fetchData(); // Refresh data to show new applicants
    } catch (error) {
      console.error('Error syncing inbox:', error);
    }
    setIsSyncing(false);
  };

  const handleDeleteApplicant = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this applicant?')) return;
    try {
      const res = await fetch(`/api/applicants/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedApplicant?.id === id) setSelectedApplicant(null);
        fetchData();
      } else {
        alert('Failed to delete applicant.');
      }
    } catch (e) { console.error(e); }
  };

  const handleTrashGmail = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Trash this email in your real Gmail inbox?')) return;
    try {
      const res = await fetch(`/api/gmail?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedEmail?.id === id) setSelectedEmail(null);
        fetchData();
      } else {
        alert('Failed to trash email.');
      }
    } catch (e) { console.error(e); }
  };

  const handleTrashVoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Trash this voice log/thread in your real Gmail inbox?')) return;
    try {
      const res = await fetch(`/api/gmail?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedSmsThread?.messages.some((m: any) => m.id === id)) setSelectedSmsThread(null);
        fetchData();
      } else {
        alert('Failed to trash voice log.');
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async () => {
    if (!selectedApplicant) return;
    try {
      const res = await fetch(`/api/applicants/${selectedApplicant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProfileForm)
      });
      if (res.ok) {
        setIsEditingProfile(false);
        const updated = await res.json();
        setSelectedApplicant(updated);
        fetchData();
      }
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh data every 30 seconds to keep services live
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [searchQuery, statusFilter, sourceFilter]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedSmsThread]);

  // Add custom Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant || !noteInput.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/applicants/${selectedApplicant.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteInput })
      });
      if (res.ok) {
        setNoteInput('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
    setSubmittingNote(false);
  };

  // Update Status
  const handleUpdateStatus = async (status: string) => {
    if (!selectedApplicant) return;
    try {
      const res = await fetch(`/api/applicants/${selectedApplicant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add new applicant
  const handleAddApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, phone, email, source } = newApplicantForm;
    if (!name || !phone || !email) return;

    setCreatingApplicant(true);
    try {
      const res = await fetch('/api/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, source })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewApplicantForm({ name: '', phone: '', email: '', source: 'EMAIL' });
        const created = await res.json();
        setSelectedApplicant(created);
        fetchData();
      } else {
        alert('Failed to add applicant.');
      }
    } catch (e) {
      console.error(e);
    }
    setCreatingApplicant(false);
  };

  // Send SMS
  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsInputText.trim() || !selectedSmsThread) return;

    setSendingSms(true);
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedSmsThread.phone,
          applicantId: selectedSmsThread.applicantId,
          text: smsInputText
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Append sent message to local thread state
        const updatedThread = {
          ...selectedSmsThread,
          messages: [
            ...selectedSmsThread.messages,
            data.sentMessage
          ]
        };
        setSelectedSmsThread(updatedThread);
        // Update total voiceState SMS thread
        setVoiceData((prev: any) => ({
          ...prev,
          smsThreads: prev.smsThreads.map((t: any) => 
            t.phone === selectedSmsThread.phone ? updatedThread : t
          )
        }));
        setSmsInputText('');
        fetchData(); // reload timeline logs
      }
    } catch (e) {
      console.error(e);
    }
    setSendingSms(false);
  };

  // Trigger Google Sheets sync
  const handleSheetsSync = async () => {
    setSyncingSheets(true);
    try {
      const res = await fetch('/api/sheets', { method: 'POST' });
      if (res.ok) {
        const sRes = await fetch('/api/sheets');
        const sData = await sRes.json();
        setSheetsData(sData);
        fetchData(); // reload logs
      }
    } catch (e) {
      console.error(e);
    }
    setSyncingSheets(false);
  };

  // Inline editing for Google Sheets rows in tab
  const handleSaveSheetCell = async (id: string, field: 'name' | 'phone' | 'email', value: string) => {
    if (!id || id === 'N/A') return;
    try {
      const res = await fetch(`/api/applicants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      if (res.ok) {
        setSheetsData((prev: any) => {
          const updatedRows = prev.rows.map((row: any) => {
            if (row.id === id) {
              return { ...row, [field]: value };
            }
            return row;
          });
          return { ...prev, rows: updatedRows };
        });
        fetchData();
      }
    } catch (e) {
      console.error('Failed to update sheets cell:', e);
    }
    setEditingCell(null);
  };

  // Generate onboarding docs and flag as SENT
  const handleSendDocument = async (docName: string) => {
    if (!selectedApplicant) return;
    try {
      const res = await fetch(`/api/applicants/${selectedApplicant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docAction: 'SEND', docName })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Outbound call via API (Twilio bridging or native tel dialer fallback)
  const handleDialCall = async (num: string) => {
    if (!num) return;
    setIsCalling(true);
    setActiveCall(num);
    
    try {
      const res = await fetch('/api/voice/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: num,
          applicantId: selectedApplicant?.id
        })
      });
      
      if (res.ok) {
        // Trigger Google Voice Web Dialer in new tab
        const cleanNum = num.replace(/\D/g, '');
        window.open(`https://voice.google.com/u/0/calls?a=nc,%2B1${cleanNum}`, '_blank');
        fetchData(); // refresh note logs
      } else {
        // Direct browser dialer link fallback
        const cleanNum = num.replace(/\D/g, '');
        window.open(`https://voice.google.com/u/0/calls?a=nc,%2B1${cleanNum}`, '_blank');
      }
    } catch (e) {
      console.error('Call dialer error:', e);
      window.location.href = `tel:${num}`;
    }
    
    setIsCalling(false);
    setActiveCall(null);
    setDialedNumber('');
  };

  // Quick SMS template response from Gmail section
  const handleSendGmailTemplate = async (applicant: any, templateType: string) => {
    let emailContent = '';
    let statusText = '';
    
    const esignLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://libertydispatchers.xyz'}/esign/${applicant.id}`;

    if (templateType === 'ONBOARDING') {
      emailContent = `Hi ${applicant.name},\n\nThanks for speaking with us. We are excited to onboard you as a delivery driver! Please click this link to review the onboarding material, fill out your W-9 tax details, sign the Driver Contract, and set your weekly availability hours: ${esignLink}\n\nLet us know if you have any questions.\n\nBest,\nLiberty Dispatchers CRM`;
      statusText = 'ONBOARDING';
    } else if (templateType === 'REJECT') {
      emailContent = `Hi ${applicant.name},\n\nThank you for your interest in the driver position. Unfortunately, we require all drivers to have a personal vehicle and we cannot proceed with your application at this time. We will keep your details on file.\n\nBest,\nLiberty Dispatchers CRM`;
      statusText = 'REJECTED';
    }

    try {
      // 1. Post note
      await fetch(`/api/applicants/${applicant.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `Sent email template (${templateType}) to ${applicant.email}. Content: "${emailContent.substring(0, 100)}..."` })
      });

      // 2. Mark docs as SENT in DB if sending onboarding
      if (templateType === 'ONBOARDING') {
        await fetch(`/api/applicants/${applicant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'ONBOARDING',
            docAction: 'SEND',
            docName: 'Driver Contract' 
          })
        });
        await fetch(`/api/applicants/${applicant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            docAction: 'SEND',
            docName: 'W-9 Form' 
          })
        });
        await fetch(`/api/applicants/${applicant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            docAction: 'SEND',
            docName: 'Onboarding Material' 
          })
        });
      } else {
        await fetch(`/api/applicants/${applicant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: statusText })
        });
      }

      fetchData();
      alert(`Template sent successfully! Candidate marked as ${statusText}.`);
    } catch (e) {
      console.error(e);
    }
  };

  // Funnel calculations
  const totalCount = applicants.length;
  const newCount = applicants.filter(a => a.status === 'NEW').length;
  const contactedCount = applicants.filter(a => a.status === 'CONTACTED').length;
  const onboardingCount = applicants.filter(a => a.status === 'ONBOARDING').length;
  const activeCount = applicants.filter(a => a.status === 'ACTIVE').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Banner */}
      <header style={{ 
        borderBottom: '1px solid var(--border-color)', 
        background: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(10px)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            height: '44px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent'
          }}>
            <img src="/logo.png" alt="Liberty Dispatchers" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--navy-blue)' }}>Liberty Dispatchers CRM</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Google Voice & Email CRM v1.0</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Workspace connected:</p>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>LibertyDispatchers.com</p>
          </div>
          <button onClick={() => fetchData()} className="button" style={{ padding: '8px 12px' }}>
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: '1600px', width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Funnel Row */}
        <div className="funnel-grid">
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--navy-blue)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Applicants</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy-blue)' }}>{totalCount}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>leads in pool</span>
            </div>
          </div>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--status-new)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Leads</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-new)' }}>{newCount}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>waiting screening</span>
            </div>
          </div>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--status-contacted)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contacted</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-contacted)' }}>{contactedCount}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>active contact</span>
            </div>
          </div>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--status-onboarding)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Onboarding</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-onboarding)' }}>{onboardingCount}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>W9/signing</span>
            </div>
          </div>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--status-active)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Drivers</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-active)' }}>{activeCount}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>fully onboarded</span>
            </div>
          </div>
        </div>

        {/* Master Split Grid */}
        <div className="crm-grid">
          
          {/* COLUMN 1: Applicants List */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', maxHeight: '720px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Applicants Feed</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={handleSyncInbox} 
                  disabled={isSyncing}
                  className="button secondary" 
                  style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={14} /> {isSyncing ? 'Syncing...' : 'Sync Inbox'}
                </button>
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="button highlight" 
                  style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} /> Add New
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search candidates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', height: '36px', fontSize: '0.85rem' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
            </div>

            {/* Quick Filters */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                className="input-field" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: '32px', padding: '0 8px', fontSize: '0.75rem', flex: 1 }}
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="ACTIVE">Active</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select 
                className="input-field" 
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                style={{ height: '32px', padding: '0 8px', fontSize: '0.75rem', flex: 1 }}
              >
                <option value="">All Channels</option>
                <option value="CALL">Call</option>
                <option value="TEXT">Text</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>

            {/* Cards List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {applicants.map(app => {
                const isSelected = selectedApplicant && selectedApplicant.id === app.id;
                let srcIcon = <Mail size={12} />;
                if (app.source === 'CALL') srcIcon = <Phone size={12} />;
                if (app.source === 'TEXT') srcIcon = <MessageSquare size={12} />;

                return (
                  <div 
                    key={app.id} 
                    onClick={async () => {
                      const refreshed = await fetch(`/api/applicants/${app.id}`).then(res => res.json());
                      setSelectedApplicant(refreshed);
                      // Auto switch SMS thread if phone matches
                      const matchedThread = voiceData.smsThreads?.find((t: any) => t.phone === app.phone);
                      if (matchedThread) setSelectedSmsThread(matchedThread);
                    }}
                    className={`glass-panel glass-panel-hover`}
                    style={{ 
                      padding: '12px 14px', 
                      cursor: 'pointer', 
                      background: isSelected ? 'rgba(255, 109, 0, 0.08)' : 'rgba(255,255,255,0.01)',
                      borderColor: isSelected ? 'var(--accent-color)' : 'var(--glass-border)',
                      borderLeftWidth: '4px',
                      borderLeftColor: isSelected ? 'var(--accent-color)' : `var(--status-${app.status.toLowerCase()})`
                    }}
                  >
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{app.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trash2 
                          size={14} 
                          style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                          onClick={(e) => handleDeleteApplicant(app.id, e)}
                        />
                        <span className={`status-tag ${app.status.toLowerCase()}`} style={{ scale: '0.85', transformOrigin: 'right' }}>
                          {app.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {srcIcon}
                      <span>{app.phone}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>{app.email}</span>
                      <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}

              {applicants.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.8rem' }}>No applicants found</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: Applicant Detail View */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', maxHeight: '720px', overflowY: 'auto' }}>
            {selectedApplicant ? (
              <>
                {/* Header detail */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      {isEditingProfile ? (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input className="input-field" value={editProfileForm.name} onChange={e => setEditProfileForm({...editProfileForm, name: e.target.value})} style={{ fontSize: '1.25rem', fontWeight: 800, padding: '4px 8px', height: '36px' }} />
                          <button onClick={handleSaveProfile} className="button highlight" style={{ height: '36px', padding: '0 12px' }}>Save</button>
                          <button onClick={() => setIsEditingProfile(false)} className="button" style={{ height: '36px', padding: '0 12px' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedApplicant.name}</h2>
                          <button 
                            onClick={() => {
                              setEditProfileForm({ name: selectedApplicant.name, phone: selectedApplicant.phone, email: selectedApplicant.email });
                              setIsEditingProfile(true);
                            }}
                            className="button"
                            style={{ height: '24px', padding: '0 8px', fontSize: '0.7rem' }}
                          >
                            Edit Details
                          </button>
                        </div>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: {selectedApplicant.id}</span>
                    </div>
                    
                    {/* Status Dropdown */}
                    <select 
                      className="input-field" 
                      value={selectedApplicant.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      style={{ 
                        width: 'auto', 
                        height: '28px', 
                        padding: '0 8px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        color: `var(--status-${selectedApplicant.status.toLowerCase()})`,
                        background: 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="ONBOARDING">Onboarding</option>
                      <option value="ACTIVE">Active</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.8rem', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                      {isEditingProfile ? (
                        <input className="input-field" value={editProfileForm.phone} onChange={e => setEditProfileForm({...editProfileForm, phone: e.target.value})} style={{ fontSize: '0.8rem', padding: '2px 6px', height: '24px', flex: 1 }} />
                      ) : (
                        <span>{selectedApplicant.phone}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                      {isEditingProfile ? (
                        <input className="input-field" value={editProfileForm.email} onChange={e => setEditProfileForm({...editProfileForm, email: e.target.value})} style={{ fontSize: '0.8rem', padding: '2px 6px', height: '24px', flex: 1 }} />
                      ) : (
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{selectedApplicant.email}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                      <span>Applied: {new Date(selectedApplicant.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Database size={12} style={{ color: 'var(--text-muted)' }} />
                      <span>Source: <b style={{ textTransform: 'uppercase' }}>{selectedApplicant.source}</b></span>
                    </div>
                  </div>
                  
                  {/* Action dial call buttons */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                    <button 
                      onClick={() => {
                        setDialedNumber(selectedApplicant.phone);
                        setActiveTab('voice');
                        handleDialCall(selectedApplicant.phone);
                      }} 
                      className="button highlight" 
                      style={{ flex: 1, height: '32px', fontSize: '0.75rem', padding: '0 8px' }}
                    >
                      <Phone size={12} /> Call Applicant
                    </button>
                    
                    <button 
                      onClick={() => {
                        // Find or make thread
                        const foundThread = voiceData.smsThreads?.find((t: any) => t.phone === selectedApplicant.phone) || 
                          { phone: selectedApplicant.phone, applicantName: selectedApplicant.name, messages: [] };
                        setSelectedSmsThread(foundThread);
                        setActiveTab('voice');
                      }} 
                      className="button" 
                      style={{ flex: 1, height: '32px', fontSize: '0.75rem', padding: '0 8px' }}
                    >
                      <MessageSquare size={12} /> Send SMS Text
                    </button>
                  </div>
                </div>

                {/* Onboarding Documents Progress */}
                <div>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Onboarding Documents
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedApplicant.documents?.map((doc: any) => (
                      <div key={doc.id} style={{ 
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {doc.status === 'SIGNED' ? (
                            <CheckCircle2 size={16} color="var(--status-active)" />
                          ) : doc.status === 'SENT' ? (
                            <Clock size={16} color="var(--status-contacted)" />
                          ) : (
                            <AlertCircle size={16} color="var(--text-muted)" />
                          )}
                          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{doc.name}</span>
                        </div>
                        <div>
                          {doc.status === 'SIGNED' ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--status-active)', fontWeight: 600 }}>Signed</span>
                          ) : doc.status === 'SENT' ? (
                            <span style={{ fontSize: '0.7rem', color: 'var(--status-contacted)', fontStyle: 'italic' }}>Pending sign</span>
                          ) : (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              onClick={() => handleSendDocument(doc.name)} 
                              className="button highlight" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem', height: '24px' }}
                            >
                              Email
                            </button>
                            <button 
                              onClick={() => {
                                const cleanNum = selectedApplicant.phone.replace(/\D/g, '');
                                const msg = encodeURIComponent(`Hi ${selectedApplicant.name}, please review and sign your ${doc.name} here: https://liberty-crm-736433125033.europe-west1.run.app/esign/${selectedApplicant.id}`);
                                window.open(`https://voice.google.com/u/0/messages?a=nc,%2B1${cleanNum}&text=${msg}`, '_blank');
                                handleSendDocument(doc.name);
                              }} 
                              className="button" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem', height: '24px', background: 'rgba(255,255,255,0.1)' }}
                            >
                              Text
                            </button>
                          </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Onboarding link display if document is SENT */}
                  {selectedApplicant.documents?.some((d: any) => d.status === 'SENT') && (
                    <div style={{ 
                      marginTop: '8px', 
                      background: 'rgba(6,182,212,0.05)', 
                      border: '1px dashed rgba(6,182,212,0.3)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.75rem'
                    }}>
                      <p style={{ color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '4px' }}>Onboarding Portal Link:</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="text" 
                          readOnly 
                          value={`${typeof window !== 'undefined' ? window.location.origin : 'https://libertydispatchers.xyz'}/esign/${selectedApplicant.id}`}
                          style={{ 
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '4px 8px',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px',
                            flex: 1,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.65rem'
                          }}
                        />
                        <a 
                          href={`/esign/${selectedApplicant.id}`} 
                          target="_blank" 
                          style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center' }}
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Intake Questionnaire Answers Display */}
                  {(() => {
                    const onboardingDoc = selectedApplicant.documents?.find((d: any) => d.name === 'Onboarding Material' && d.status === 'SIGNED' && d.esignData);
                    if (!onboardingDoc) return null;
                    try {
                      const intake = JSON.parse(onboardingDoc.esignData);
                      return (
                        <div style={{ 
                          marginTop: '16px', 
                          background: 'rgba(215,181,95,0.05)', 
                          border: '1px solid rgba(215,181,95,0.15)',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={14} /> Intake Questionnaire Responses
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Vehicle Type:</span>
                              <b style={{ color: 'var(--text-primary)' }}>{intake.vehicleType || 'N/A'}</b>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Hours Preference:</span>
                              <b style={{ color: 'var(--text-primary)' }}>{intake.shiftPreference || 'N/A'}</b>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Payout Method:</span>
                              <b style={{ color: 'var(--text-primary)' }}>{intake.payoutMethod || 'N/A'}</b>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Payout Details:</span>
                              <b style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{intake.payoutDetails || 'N/A'}</b>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>OK with Daily Payouts?</span>
                              <b style={{ color: 'var(--text-primary)' }}>{intake.dailyPayoutsOk || 'N/A'}</b>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Current Apps:</span>
                              <b style={{ color: 'var(--text-primary)' }}>{intake.currentApps || 'N/A'}</b>
                            </div>
                            {intake.experience && (
                              <div style={{ gridColumn: '1 / -1', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '4px' }}>
                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Experience Notes:</span>
                                <p style={{ color: 'var(--text-primary)', marginTop: '2px', lineHeight: '1.4' }}>{intake.experience}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    } catch (err) {
                      return null;
                    }
                  })()}
                </div>

                {/* Driver Availability Visual Grid */}
                <div>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Availability Hours
                  </h3>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: '4px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '6px' }}>
                      <div style={{ textAlign: 'left' }}>Day</div>
                      <div>Morning</div>
                      <div>Afternoon</div>
                      <div>Evening</div>
                    </div>

                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                      let dayAvails: string[] = [];
                      try {
                        const parsed = JSON.parse(selectedApplicant.availability);
                        dayAvails = parsed[day] || [];
                      } catch (e) {}

                      return (
                        <div key={day} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: '4px', textAlign: 'center', padding: '4px 0', alignItems: 'center' }}>
                          <div style={{ textAlign: 'left', fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{day.substring(0,3)}</div>
                          <div style={{ 
                            background: dayAvails.includes('morning') ? 'var(--status-active)' : 'transparent',
                            border: '1px solid ' + (dayAvails.includes('morning') ? 'var(--status-active)' : 'var(--border-color)'),
                            borderRadius: '4px', fontSize: '0.7rem', padding: '2px 0', color: dayAvails.includes('morning') ? 'white' : 'var(--text-muted)'
                          }}>
                            {dayAvails.includes('morning') ? 'Yes' : '-'}
                          </div>
                          <div style={{ 
                            background: dayAvails.includes('afternoon') ? 'var(--status-contacted)' : 'transparent',
                            border: '1px solid ' + (dayAvails.includes('afternoon') ? 'var(--status-contacted)' : 'var(--border-color)'),
                            borderRadius: '4px', fontSize: '0.7rem', padding: '2px 0', color: dayAvails.includes('afternoon') ? 'white' : 'var(--text-muted)'
                          }}>
                            {dayAvails.includes('afternoon') ? 'Yes' : '-'}
                          </div>
                          <div style={{ 
                            background: dayAvails.includes('evening') ? 'var(--navy-blue)' : 'transparent',
                            border: '1px solid ' + (dayAvails.includes('evening') ? 'var(--navy-blue)' : 'var(--border-color)'),
                            borderRadius: '4px', fontSize: '0.7rem', padding: '2px 0', color: dayAvails.includes('evening') ? 'white' : 'var(--text-muted)'
                          }}>
                            {dayAvails.includes('evening') ? 'Yes' : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline interaction notes logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Interaction Timeline & Notes
                  </h3>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Type a log/note..." 
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      style={{ height: '36px', fontSize: '0.8rem' }}
                    />
                    <button 
                      type="submit" 
                      disabled={submittingNote || !noteInput.trim()}
                      className="button highlight" 
                      style={{ padding: '0 12px', height: '36px' }}
                    >
                      Save
                    </button>
                  </form>

                  {/* Log Items */}
                  <div className="timeline" style={{ marginTop: '10px' }}>
                    {selectedApplicant.notes?.map((note: any) => (
                      <div key={note.id} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{note.content}</p>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Admin Delete Action */}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={(e) => handleDeleteApplicant(selectedApplicant.id, e)}
                      className="button"
                      style={{ height: '32px', fontSize: '0.75rem', padding: '0 12px', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', background: 'rgba(239,68,68,0.05)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      Delete Applicant Record
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <User size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p>Select an applicant from the list to inspect details</p>
              </div>
            )}
          </div>

          {/* COLUMN 3: Right workspace integrations */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', maxHeight: '720px' }}>
            
            {/* Horizontal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '4px' }}>
              <button 
                onClick={() => setActiveTab('voice')} 
                className={`tab-button ${activeTab === 'voice' ? 'active' : ''}`}
                style={{ 
                  flex: 1, 
                  borderBottom: 'none', 
                  borderBottomLeftRadius: 0, 
                  borderBottomRightRadius: 0, 
                  background: activeTab === 'voice' ? 'var(--panel-bg-solid)' : 'transparent',
                  borderColor: activeTab === 'voice' ? 'var(--border-color)' : 'transparent',
                  color: activeTab === 'voice' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <Phone size={14} style={{ color: activeTab === 'voice' ? 'var(--status-contacted)' : 'inherit' }} />
                Voice
              </button>

              <button 
                onClick={() => setActiveTab('gmail')} 
                className={`tab-button ${activeTab === 'gmail' ? 'active' : ''}`}
                style={{ 
                  flex: 1, 
                  borderBottom: 'none', 
                  borderBottomLeftRadius: 0, 
                  borderBottomRightRadius: 0, 
                  background: activeTab === 'gmail' ? 'var(--panel-bg-solid)' : 'transparent',
                  borderColor: activeTab === 'gmail' ? 'var(--border-color)' : 'transparent',
                  color: activeTab === 'gmail' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <Mail size={14} style={{ color: activeTab === 'gmail' ? 'var(--status-new)' : 'inherit' }} />
                Gmail
              </button>

              <button 
                onClick={() => setActiveTab('sheets')} 
                className={`tab-button ${activeTab === 'sheets' ? 'active' : ''}`}
                style={{ 
                  flex: 1, 
                  borderBottom: 'none', 
                  borderBottomLeftRadius: 0, 
                  borderBottomRightRadius: 0, 
                  background: activeTab === 'sheets' ? 'var(--panel-bg-solid)' : 'transparent',
                  borderColor: activeTab === 'sheets' ? 'var(--border-color)' : 'transparent',
                  color: activeTab === 'sheets' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <Database size={14} style={{ color: activeTab === 'sheets' ? 'var(--status-active)' : 'inherit' }} />
                Sheets
              </button>

              <button 
                onClick={() => setActiveTab('docs')} 
                className={`tab-button ${activeTab === 'docs' ? 'active' : ''}`}
                style={{ 
                  flex: 1, 
                  borderBottom: 'none', 
                  borderBottomLeftRadius: 0, 
                  borderBottomRightRadius: 0, 
                  background: activeTab === 'docs' ? 'var(--panel-bg-solid)' : 'transparent',
                  borderColor: activeTab === 'docs' ? 'var(--border-color)' : 'transparent',
                  color: activeTab === 'docs' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <FileText size={14} style={{ color: activeTab === 'docs' ? 'var(--status-onboarding)' : 'inherit' }} />
                Docs Center
              </button>
              
              <button 
                onClick={() => setActiveTab('whatsapp')}
                className={`tab-button ${activeTab === 'whatsapp' ? 'active' : ''}`}
                style={{ 
                  background: activeTab === 'whatsapp' ? 'var(--panel-bg-solid)' : 'transparent',
                  borderColor: activeTab === 'whatsapp' ? 'var(--border-color)' : 'transparent',
                  color: activeTab === 'whatsapp' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <MessageSquare size={14} style={{ color: activeTab === 'whatsapp' ? '#25D366' : 'inherit' }} />
                WhatsApp Sync
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              
              {/* TAB 1: GOOGLE VOICE */}
              {activeTab === 'voice' && (
                <div className="tab-layout">
                  
                  {/* Left sub-column: threads and calls log */}
                  <div className="tab-sidebar" style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
                    
                    {/* Connection indicator */}
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Connection State:</span>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                        {voiceData.connected ? 'Live API' : 'Direct Dial'}
                      </span>
                    </div>

                    {/* Call logs */}
                    <div>
                      <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        Voice Call Logs
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                        {voiceData.callLogs?.map((log: any) => (
                          <div key={log.id} style={{ 
                            background: 'rgba(255,255,255,0.01)', 
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '0.7rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <b style={{ color: 'var(--text-primary)' }}>{log.applicantName}</b>
                              <span style={{ 
                                color: log.type === 'missed' ? 'var(--status-rejected)' : 
                                       log.type === 'inbound' ? 'var(--status-active)' : 'var(--status-contacted)',
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                fontSize: '0.6rem'
                              }}>
                                {log.type}
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '2px' }}>
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Duration: {log.duration}
                            </div>
                            {log.voicemailText && (
                              <div style={{ 
                                background: 'rgba(255, 109, 0, 0.05)', 
                                border: '1px solid rgba(255, 109, 0, 0.1)',
                                borderRadius: '4px',
                                padding: '4px',
                                marginTop: '4px',
                                fontStyle: 'italic',
                                fontSize: '0.65rem',
                                color: 'var(--text-secondary)'
                              }}>
                                VM: "{log.voicemailText.substring(0, 50)}..."
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SMS Threads */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        Text Messages
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1 }}>
                        {voiceData.smsThreads?.map((thread: any) => {
                          const isSel = selectedSmsThread && selectedSmsThread.phone === thread.phone;
                          const lastMsg = thread.messages[thread.messages.length - 1];

                          return (
                            <div 
                              key={thread.phone}
                              onClick={() => setSelectedSmsThread(thread)}
                              style={{ 
                                background: isSel ? 'rgba(255, 109, 0, 0.05)' : 'transparent',
                                border: isSel ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                                borderRadius: '6px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{thread.applicantName}</div>
                                {lastMsg?.id && (
                                  <Trash2 
                                    size={12} 
                                    style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                                    onClick={(e) => handleTrashVoice(lastMsg.id, e)}
                                  />
                                )}
                              </div>
                              <div style={{ color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.65rem' }}>
                                {lastMsg ? lastMsg.text : 'No messages'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right sub-column: Active chat and dialer */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Dialer / active call widget */}
                    <div style={{ 
                      background: 'rgba(255,255,255,0.01)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: isCalling ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-color)',
                          color: isCalling ? 'var(--status-active)' : 'var(--text-secondary)'
                        }}>
                          <Phone size={14} className={isCalling ? 'pulse-anim' : ''} />
                        </div>
                        <div>
                          {isCalling ? (
                            <>
                              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--status-active)' }}>Calling...</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{activeCall}</p>
                            </>
                          ) : (
                            <>
                              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Google Voice Dial Out</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Linked line: {voiceData.googleVoiceNumber}</p>
                            </>
                          )}
                        </div>
                      </div>

                      {!isCalling && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Enter number..." 
                            value={dialedNumber}
                            onChange={(e) => setDialedNumber(e.target.value)}
                            style={{ width: '130px', height: '28px', fontSize: '0.75rem', padding: '0 8px' }}
                          />
                          <button 
                            onClick={() => handleDialCall(dialedNumber)}
                            disabled={!dialedNumber} 
                            className="button highlight" 
                            style={{ height: '28px', padding: '0 8px', fontSize: '0.7rem' }}
                          >
                            Call
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Active SMS Chat panel */}
                    {selectedSmsThread ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>Chat with {selectedSmsThread.applicantName}</h4>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedSmsThread.phone}</span>
                        </div>

                        {/* Chat bubbles */}
                        <div className="chat-container" style={{ overflowY: 'auto', maxHeight: '380px', flex: 1, border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                          {selectedSmsThread.messages?.map((m: any, idx: number) => (
                            <div key={idx} className={`chat-bubble ${m.sender}`}>
                              <p>{m.text}</p>
                              <span style={{ 
                                fontSize: '0.55rem', 
                                display: 'block', 
                                marginTop: '4px', 
                                textAlign: m.sender === 'crm' ? 'right' : 'left',
                                opacity: 0.6
                              }}>
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Send SMS Box */}
                        <form onSubmit={handleSendSms} style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Type a text message..." 
                            value={smsInputText}
                            onChange={(e) => setSmsInputText(e.target.value)}
                            style={{ height: '36px', fontSize: '0.8rem' }}
                          />
                          <button 
                            type="submit" 
                            disabled={sendingSms || !smsInputText.trim()}
                            className="button highlight" 
                            style={{ width: '40px', height: '36px', padding: 0 }}
                          >
                            <Send size={14} />
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>
                        <MessageSquare size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                        <p style={{ fontSize: '0.8rem' }}>Select a text thread from the left column</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: GMAIL INBOX */}
              {activeTab === 'gmail' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: '500px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Gmail API Workspace Viewer</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{gmailData.emailAddress || 'recruit@libertydispatchers.com'}</p>
                    </div>
                    <span className={`status-tag ${gmailData.connected ? 'active' : 'contacted'}`} style={{ scale: '0.85' }}>
                      {gmailData.connected ? 'Google Live' : 'Simulation Mode'}
                    </span>
                  </div>

                  <div className="tab-layout">
                    {/* Mail list */}
                    <div className="tab-sidebar" style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px', borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
                      {gmailData.emails?.map((mail: any) => {
                        const isSel = selectedEmail && selectedEmail.id === mail.id;
                        return (
                          <div 
                            key={mail.id}
                            onClick={() => setSelectedEmail(mail)}
                            style={{ 
                              background: isSel ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                              border: isSel ? '1px solid var(--status-new)' : '1px solid var(--border-color)',
                              borderRadius: '6px',
                              padding: '8px 10px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <b style={{ color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                {mail.fromName}
                              </b>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trash2 
                                  size={12} 
                                  style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                                  onClick={(e) => handleTrashGmail(mail.id, e)}
                                />
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                  {new Date(mail.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.65rem', marginBottom: '4px' }}>
                              {mail.subject}
                            </div>
                            <span className="status-tag" style={{ scale: '0.7', transformOrigin: 'left', background: mail.isGoogleVoice ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)', color: mail.isGoogleVoice ? 'var(--status-contacted)' : 'var(--status-new)', border: 'none' }}>
                              {mail.isGoogleVoice ? 'Voice SMS/VM' : 'Email Query'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mail reader and actions */}
                    {selectedEmail ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{selectedEmail.subject}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <p>From: <b>{selectedEmail.fromName}</b> &lt;{selectedEmail.from}&gt;</p>
                            <p>{new Date(selectedEmail.date).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Mail Body */}
                        <div style={{ 
                          flex: 1, 
                          background: 'rgba(0,0,0,0.15)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '8px', 
                          padding: '12px', 
                          fontSize: '0.8rem', 
                          lineHeight: '1.5',
                          overflowY: 'auto', 
                          whiteSpace: 'pre-line',
                          maxHeight: '240px',
                          color: 'var(--text-primary)',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere'
                        }}>
                          {selectedEmail.body}
                        </div>

                        {/* Quick response template actions */}
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Respond via Workspace Email:
                          </p>
                          
                          {/* Match Gmail sender to DB applicant to enable custom links */}
                          {(() => {
                            const matchingApplicant = applicants.find(a => 
                              selectedEmail.from.includes(a.email) || 
                              selectedEmail.body.includes(a.phone) ||
                              selectedEmail.fromName.includes(a.name) ||
                              (selectedEmail.senderNumber && a.phone.replace(/\D/g,'').includes(selectedEmail.senderNumber.replace(/\D/g,'')))
                            );

                            if (matchingApplicant) {
                              return (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button 
                                    onClick={() => handleSendGmailTemplate(matchingApplicant, 'ONBOARDING')}
                                    className="button highlight" 
                                    style={{ fontSize: '0.75rem', height: '30px', padding: '0 10px', flex: 1 }}
                                  >
                                    Send Onboarding Material & E-Sign Link
                                  </button>
                                  
                                  <button 
                                    onClick={() => handleSendGmailTemplate(matchingApplicant, 'REJECT')}
                                    className="button" 
                                    style={{ fontSize: '0.75rem', height: '30px', padding: '0 10px', flex: 1, borderColor: 'rgba(239,68,68,0.2)' }}
                                  >
                                    Send Rejection (No Vehicle)
                                  </button>
                                </div>
                              );
                            } else {
                              return (
                                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Sender not recognized in Applicant Pool. Add them first.
                                  </p>
                                  <button 
                                    onClick={() => {
                                      const emailName = selectedEmail.fromName.replace(/\(via SMS\)|\(via VM\)/, '').trim();
                                      setNewApplicantForm({
                                        name: emailName,
                                        email: selectedEmail.from.includes('@') ? selectedEmail.from : 'unknown@email.com',
                                        phone: selectedEmail.senderNumber || '',
                                        source: selectedEmail.isGoogleVoice ? (selectedEmail.type === 'sms' ? 'TEXT' : 'CALL') : 'EMAIL'
                                      });
                                      setShowAddModal(true);
                                    }}
                                    className="button" 
                                    style={{ height: '26px', fontSize: '0.7rem', padding: '0 8px' }}
                                  >
                                    Add Applicant
                                  </button>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        <Mail size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                        <p style={{ fontSize: '0.8rem' }}>Select an email to view</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: GOOGLE SHEETS */}
              {activeTab === 'sheets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: '500px' }}>
                  
                  {/* Sheets metadata banner */}
                  <div style={{ 
                    background: sheetsData.connected ? 'rgba(16,185,129,0.05)' : 'rgba(234,179,8,0.05)', 
                    border: sheetsData.connected ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(234,179,8,0.15)', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: sheetsData.connected ? 'var(--status-active)' : 'var(--status-contacted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Database size={16} /> Sheets Synchronization Panel
                      </h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Spreadsheet: <b>{sheetsData.spreadsheetName}</b> ({sheetsData.sheetName})
                      </p>
                    </div>
                    <button 
                      onClick={handleSheetsSync}
                      disabled={syncingSheets}
                      className="button highlight" 
                      style={{ 
                        background: sheetsData.connected ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', 
                        boxShadow: sheetsData.connected ? '0 4px 10px rgba(16,185,129,0.2)' : '0 4px 10px rgba(234,179,8,0.2)',
                        height: '32px', 
                        padding: '0 12px', 
                        fontSize: '0.75rem' 
                      }}
                    >
                      <RefreshCw size={12} className={syncingSheets ? 'spin-anim' : ''} style={{ marginRight: '4px' }} />
                      Sync Database to Sheet
                    </button>
                  </div>

                  {/* Spreadsheet Grid Mock */}
                  <div style={{ 
                    flex: 1, 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    overflow: 'auto', 
                    background: 'var(--panel-bg-solid)', 
                    maxHeight: '380px' 
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#172033', borderBottom: '1px solid var(--border-color)' }}>
                          {sheetsData.headers?.map((header: string, i: number) => (
                            <th key={i} style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)' }}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sheetsData.rows?.map((row: any, rowIdx: number) => (
                          <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border-color)', background: rowIdx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)' }}>{row.rowNumber}</td>
                            <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', borderRight: '1px solid var(--border-color)' }}>{row.id}</td>
                            {/* Name cell */}
                            <td 
                              onDoubleClick={() => {
                                if (row.id !== 'N/A') {
                                  setEditingCell({ rowIdx, field: 'name', value: row.name });
                                }
                              }}
                              style={{ 
                                padding: '8px 12px', 
                                fontWeight: 500, 
                                color: 'var(--text-primary)', 
                                borderRight: '1px solid var(--border-color)',
                                cursor: row.id !== 'N/A' ? 'pointer' : 'default'
                              }}
                            >
                              {editingCell && editingCell.rowIdx === rowIdx && editingCell.field === 'name' ? (
                                <input 
                                  type="text" 
                                  value={editingCell.value}
                                  onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                  onBlur={() => handleSaveSheetCell(row.id, 'name', editingCell.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveSheetCell(row.id, 'name', editingCell.value);
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  autoFocus
                                  style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--control-border)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', width: '100%' }}
                                />
                              ) : (
                                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  {row.name}
                                  {row.id !== 'N/A' && <span style={{ opacity: 0.3, fontSize: '0.65rem', fontStyle: 'italic', fontWeight: 400, color: 'var(--text-muted)' }}>(double-click)</span>}
                                </span>
                              )}
                            </td>

                            {/* Phone cell */}
                            <td 
                              onDoubleClick={() => {
                                if (row.id !== 'N/A') {
                                  setEditingCell({ rowIdx, field: 'phone', value: row.phone });
                                }
                              }}
                              style={{ 
                                padding: '8px 12px', 
                                color: 'var(--text-primary)', 
                                borderRight: '1px solid var(--border-color)',
                                cursor: row.id !== 'N/A' ? 'pointer' : 'default'
                              }}
                            >
                              {editingCell && editingCell.rowIdx === rowIdx && editingCell.field === 'phone' ? (
                                <input 
                                  type="text" 
                                  value={editingCell.value}
                                  onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                  onBlur={() => handleSaveSheetCell(row.id, 'phone', editingCell.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveSheetCell(row.id, 'phone', editingCell.value);
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  autoFocus
                                  style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--control-border)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', width: '100%' }}
                                />
                              ) : (
                                <span>{row.phone}</span>
                              )}
                            </td>

                            {/* Email cell */}
                            <td 
                              onDoubleClick={() => {
                                if (row.id !== 'N/A') {
                                  setEditingCell({ rowIdx, field: 'email', value: row.email });
                                }
                              }}
                              style={{ 
                                padding: '8px 12px', 
                                color: 'var(--text-primary)', 
                                borderRight: '1px solid var(--border-color)',
                                cursor: row.id !== 'N/A' ? 'pointer' : 'default'
                              }}
                            >
                              {editingCell && editingCell.rowIdx === rowIdx && editingCell.field === 'email' ? (
                                <input 
                                  type="text" 
                                  value={editingCell.value}
                                  onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                  onBlur={() => handleSaveSheetCell(row.id, 'email', editingCell.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveSheetCell(row.id, 'email', editingCell.value);
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  autoFocus
                                  style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--control-border)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', width: '100%' }}
                                />
                              ) : (
                                <span>{row.email}</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                              <span style={{ 
                                color: `var(--status-${row.status.toLowerCase()})`,
                                fontWeight: 600
                              }}>
                                {row.status}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', borderRight: '1px solid rgba(255,255,255,0.03)' }}>{row.source}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                              {row.availability}
                            </td>
                            <td style={{ padding: '8px 12px' }}>{row.appliedDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'right' }}>
                    Note: {sheetsData.connected ? 'Currently syncing with live Google Sheets APIs.' : 'Running in simulated Sheets mode. Configure .env.local variables to authenticate.'}
                  </p>
                </div>
              )}

              {/* TAB 4: DOCS CENTER / SIGNATURE CHECK */}
              {activeTab === 'docs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: '500px' }}>
                  
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Onboarding Document Center</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Generate e-sign documents, verify SSN entries, and inspect signature hash logs.</p>
                  </div>

                  {selectedApplicant ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem' }}>Active Candidate: <b>{selectedApplicant.name}</b></span>
                        <span className={`status-tag ${selectedApplicant.status.toLowerCase()}`} style={{ scale: '0.8' }}>{selectedApplicant.status}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedApplicant.documents?.map((doc: any) => {
                          let esignObj: any = null;
                          if (doc.esignData) {
                            try { esignObj = JSON.parse(doc.esignData); } catch(e){}
                          }

                          return (
                            <div key={doc.id} style={{ 
                              background: 'rgba(0,0,0,0.15)', 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '8px', 
                              padding: '12px' 
                            }}>
                              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FileText size={14} color="var(--accent-cyan)" /> {doc.name}
                                </h5>
                                <span className={`status-tag ${doc.status === 'SIGNED' ? 'active' : doc.status === 'SENT' ? 'contacted' : 'new'}`} style={{ scale: '0.8' }}>
                                  {doc.status}
                                </span>
                              </div>

                              {doc.status === 'SIGNED' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Signed Timestamp:</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{new Date(doc.signedAt).toLocaleString()}</span>
                                  </div>
                                  
                                  {doc.name === 'W-9 Form' && esignObj && (
                                    <>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Tax SSN/EIN:</span>
                                        <span style={{ color: 'var(--status-contacted)', fontFamily: 'var(--font-mono)' }}>{esignObj.ssn}</span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Tax Address:</span>
                                        <span style={{ color: 'var(--text-primary)' }}>{esignObj.address}</span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Classification:</span>
                                        <span style={{ color: 'var(--text-primary)' }}>{esignObj.classification}</span>
                                      </div>
                                    </>
                                  )}

                                  {doc.name === 'Driver Contract' && esignObj && (
                                    <>
                                      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Digital Signature Name:</span>
                                        <span style={{ color: 'var(--status-active)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                          /s/ {esignObj.signature}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>IP Address Stamp:</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{esignObj.ipAddress}</span>
                                      </div>
                                    </>
                                  )}

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <span>E-Sign Audit Hash:</span>
                                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
                                      {doc.id.toUpperCase()}-E-VERIFY-SECURE
                                    </span>
                                  </div>
                                  
                                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button 
                                      onClick={async () => {
                                        try {
                                          const res = await fetch('/api/drive', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              applicantName: selectedApplicant.name,
                                              docName: doc.name,
                                              esignData: doc.esignData,
                                              signedAt: doc.signedAt
                                            })
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            alert(`Successfully saved to Google Drive!\nLink: ${data.webViewLink}`);
                                            window.open(data.webViewLink, '_blank');
                                          } else {
                                            alert(`Error saving to Drive: ${data.error}`);
                                          }
                                        } catch (e) {
                                          alert('Failed to connect to Google Drive API');
                                        }
                                      }}
                                      className="button"
                                      style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)' }}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 17 4 4 4-4"></path></svg>
                                      Save to Google Drive
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
                                  <span>Document has not been signed.</span>
                                  <button 
                                    onClick={() => handleSendDocument(doc.name)}
                                    className="button" 
                                    style={{ height: '24px', padding: '0 8px', fontSize: '0.7rem' }}
                                  >
                                    Send Signature URL
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Create Document Form */}
                      <div style={{ marginTop: '20px', padding: '16px', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                        <h5 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>Generate New Document</h5>
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const docName = formData.get('docName') as string;
                          if (!docName) return;
                          alert(`Document generation requested: ${docName} for ${selectedApplicant.name}.\\n\\nIn a production environment, this would call the E-Sign API to generate a fresh link.`);
                          (e.target as HTMLFormElement).reset();
                        }} style={{ display: 'flex', gap: '8px' }}>
                          <input type="text" name="docName" placeholder="Document Title (e.g. Background Check Consent)" className="input-field" style={{ flex: 1, height: '32px', fontSize: '0.8rem' }} />
                          <button type="submit" className="button highlight" style={{ height: '32px', padding: '0 12px', fontSize: '0.75rem' }}>Create</button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', padding: '40px 0' }}>
                      <FileText size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                      <p style={{ fontSize: '0.8rem' }}>Select a candidate from the left list to view signed forms</p>
                    </div>
                  )}

                </div>
              )}

              {activeTab === 'whatsapp' && (
                <div style={{ display: 'flex', height: '100%' }}>
                  {/* WHATSAPP LIST */}
                  <div style={{ width: '280px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageSquare size={14} style={{ color: '#25D366' }} /> WhatsApp Chats
                      </h3>
                      <div className={`status-indicator ${whatsappData.connected ? 'active' : 'offline'}`} />
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                      {whatsappData.chats && whatsappData.chats.length > 0 ? (
                        whatsappData.chats.map((chat: any) => {
                          const isSelected = selectedWhatsappChat?.phone === chat.phone;
                          const lastMsg = chat.messages[chat.messages.length - 1];
                          return (
                            <div 
                              key={chat.phone}
                              onClick={() => setSelectedWhatsappChat(chat)}
                              className={`list-item ${isSelected ? 'selected' : ''}`}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                  {chat.applicantName}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {lastMsg ? lastMsg.text : 'No messages'}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          No WhatsApp chats found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WHATSAPP DETAIL */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)' }}>
                    {selectedWhatsappChat ? (
                      <>
                        {/* Header */}
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {selectedWhatsappChat.applicantName}
                            </h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {selectedWhatsappChat.phone}
                            </div>
                          </div>
                        </div>

                        {/* Thread */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="custom-scrollbar">
                          {selectedWhatsappChat.messages?.map((msg: any) => (
                            <div key={msg.id} style={{ alignSelf: msg.sender === 'applicant' ? 'flex-start' : 'flex-end', maxWidth: '80%' }}>
                              <div style={{ 
                                background: msg.sender === 'applicant' ? 'rgba(255,255,255,0.05)' : '#128C7E',
                                padding: '10px 14px',
                                borderRadius: msg.sender === 'applicant' ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                                fontSize: '0.85rem',
                                color: '#ffffff',
                                border: msg.sender === 'applicant' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                lineHeight: 1.4
                              }}>
                                {msg.text}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: msg.sender === 'applicant' ? 'left' : 'right' }}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Reply Input */}
                        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: 'var(--panel-bg-solid)' }}>
                          <form 
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!whatsappInput.trim() || sendingWhatsapp) return;
                              
                              setSendingWhatsapp(true);
                              try {
                                const res = await fetch('/api/whatsapp', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    phone: selectedWhatsappChat.phone,
                                    applicantId: selectedWhatsappChat.applicantId,
                                    text: whatsappInput
                                  })
                                });
                                
                                if (res.ok) {
                                  const data = await res.json();
                                  setWhatsappInput('');
                                  // Update local message list for instant feedback
                                  setSelectedWhatsappChat((prev: any) => {
                                    if (!prev) return null;
                                    return {
                                      ...prev,
                                      messages: [...(prev.messages || []), data.sentMessage]
                                    };
                                  });
                                  fetchData(); // Refresh all data in background
                                } else {
                                  alert('Failed to send WhatsApp message');
                                }
                              } catch (e) {
                                console.error(e);
                              }
                              setSendingWhatsapp(false);
                            }}
                            style={{ display: 'flex', gap: '12px' }}
                          >
                            <input 
                              type="text" 
                              className="input-field" 
                              placeholder="Type a message to send via WhatsApp..." 
                              value={whatsappInput}
                              onChange={(e) => setWhatsappInput(e.target.value)}
                              disabled={sendingWhatsapp}
                            />
                            <button 
                              type="submit" 
                              className="button highlight" 
                              disabled={!whatsappInput.trim() || sendingWhatsapp}
                              style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Send size={14} /> Send
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>Select a WhatsApp chat to reply</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* MODAL: ADD APPLICANT */}
      {showAddModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Add New Driver Candidate</h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddApplicant} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  value={newApplicantForm.name}
                  onChange={(e) => setNewApplicantForm({...newApplicantForm, name: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone Number</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  required
                  value={newApplicantForm.phone}
                  onChange={(e) => setNewApplicantForm({...newApplicantForm, phone: e.target.value})}
                  placeholder="e.g. 410-555-0100"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  required
                  value={newApplicantForm.email}
                  onChange={(e) => setNewApplicantForm({...newApplicantForm, email: e.target.value})}
                  placeholder="e.g. john.doe@gmail.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ad Source Channel</label>
                <select 
                  className="input-field"
                  value={newApplicantForm.source}
                  onChange={(e) => setNewApplicantForm({...newApplicantForm, source: e.target.value})}
                >
                  <option value="EMAIL">Email Query</option>
                  <option value="TEXT">Google Voice SMS Text</option>
                  <option value="CALL">Google Voice Phone Call</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="button" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creatingApplicant}
                  className="button highlight" 
                  style={{ flex: 1 }}
                >
                  Create Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx global>{`
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .pulse-anim {
          animation: pulse 1s infinite alternate;
        }
        @keyframes pulse {
          0% { opacity: 0.5; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
