'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Phone, MessageSquare, Mail, Database, FileText, 
  CheckCircle2, AlertCircle, Trash2, Send, Clock, User, 
  ShieldCheck, RefreshCw, X, PhoneCall, Check, Calendar, ExternalLink, Settings, Map, Lock, Briefcase
} from 'lucide-react';
import { IS_PRODUCTION, BASE_URL } from '../../lib/config';
import dynamic from 'next/dynamic';

const DriverMap = dynamic(() => import('./DriverMap'), { ssr: false });
const JobBoard = dynamic(() => import('./JobBoard'), { ssr: false });

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
};

export default function CrmDashboard() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (getCookie('liberty_gate') !== '6492') {
      window.location.href = `/gate?redirect=${encodeURIComponent(window.location.pathname)}`;
    } else {
      setAuthorized(true);
    }
  }, []);

  // DB Applicants state
  const [applicants, setApplicants] = useState<any[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
  // Workspace tabs: 'voice', 'gmail', 'sheets', 'docs', 'whatsapp', 'map'
  const [activeTab, setActiveTab] = useState<'comms' | 'gmail' | 'sheets' | 'docs' | 'map'>('comms');
  
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

  // New Applicant Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApplicantForm, setNewApplicantForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'EMAIL'
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Settings & Integrations Modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ WHATSAPP_NUMBER: '', DISPATCHER_PHONE_NUMBER: '', GOOGLE_SHEET_ID: '', BLACKLISTED_EMAILS: '' });
  const [savingSettings, setSavingSettings] = useState(false);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (getCookie('liberty_gate') !== '6492') return;
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettingsForm({
          WHATSAPP_NUMBER: data.settings.WHATSAPP_NUMBER || '',
          DISPATCHER_PHONE_NUMBER: data.settings.DISPATCHER_PHONE_NUMBER || '',
          GOOGLE_SHEET_ID: data.settings.GOOGLE_SHEET_ID || '',
          BLACKLISTED_EMAILS: data.settings.BLACKLISTED_EMAILS || ''
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ name: '', phone: '', email: '' });
  const [isSheetsExpanded, setIsSheetsExpanded] = useState(false);
  const [mainView, setMainView] = useState<'crm' | 'map' | 'sheets' | 'jobs'>('crm'); // 'crm' | 'map' | 'sheets' | 'jobs'
  const [customEmailBody, setCustomEmailBody] = useState('');
  const [sendingCustomEmail, setSendingCustomEmail] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string, field: string, value: string } | null>(null);

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
    if (getCookie('liberty_gate') !== '6492') return;
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
        if (Array.isArray(appData)) {
          setApplicants(appData);
          setDbError(null);
          if (appData.length > 0 && !selectedApplicantIdRef.current) {
            setSelectedApplicant(appData[0]);
          } else if (selectedApplicantIdRef.current) {
            const refreshed = appData.find((a: any) => a.id === selectedApplicantIdRef.current);
            if (refreshed) setSelectedApplicant(refreshed);
          }
        } else {
          setApplicants([]);
          setDbError(appData.error || 'Failed to load applicants from database. Check if your DATABASE_URL in Vercel settings is correct.');
          console.error('Applicants fetch error:', appData);
        }
      } else {
        setApplicants([]);
        setDbError('Database connection error. Verify that the Supabase server is accessible and DATABASE_URL is set in Vercel settings.');
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsForm })
      });
      const data = await res.json();
      if (data.success) {
        alert('Settings saved successfully!');
        setShowSettingsModal(false);
        fetchSettings(); // Refresh settings state
        fetchData(); // Refresh UI/integrations numbers
      } else {
        alert(`Failed to save settings: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving settings');
    }
    setSavingSettings(false);
  };

  const handleBlacklistEmail = async (email: string) => {
    if (!email) return;
    if (!confirm(`Are you sure you want to mark "${email}" as a non-applicant? This will hide their emails from the inbox and ignore them in future sheet syncs.`)) return;

    const currentList = settingsForm.BLACKLISTED_EMAILS ? settingsForm.BLACKLISTED_EMAILS.split(',').map(s => s.trim().toLowerCase()) : [];
    if (!currentList.includes(email.toLowerCase())) {
      currentList.push(email.toLowerCase());
    }
    const updatedBlacklist = currentList.join(',');

    try {
      const updatedSettings = {
        ...settingsForm,
        BLACKLISTED_EMAILS: updatedBlacklist
      };
      
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings })
      });
      const data = await res.json();
      if (data.success) {
        // Optimistic UI update
        setSettingsForm(updatedSettings);
        if (selectedEmail && selectedEmail.from.includes(email)) {
          setSelectedEmail(null);
        }

        // Delete the corresponding spam applicant if they exist
        const matchingApp = applicants.find(a => 
          a.email.toLowerCase() === email.toLowerCase() || 
          email.toLowerCase().includes(a.email.toLowerCase())
        );
        if (matchingApp) {
          try {
            await fetch(`/api/applicants/${matchingApp.id}`, { method: 'DELETE' });
          } catch (delErr) {
            console.error('Failed to auto-delete spam applicant', delErr);
          }
        }

        alert('Email marked as non-applicant and ignored successfully!');
        fetchSettings(); // Refresh settings state
        fetchData(); // Refresh UI/Gmail inbox
      } else {
        alert(`Failed to save settings: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while blacklisting email');
    }
  };

  const handleTrashGmail = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Archive this email? It will be removed from your inbox but saved in your All Mail.')) return;
    try {
      const res = await fetch(`/api/gmail?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedEmail?.id === id) setSelectedEmail(null);
        fetchData();
      } else {
        alert('Failed to archive email.');
      }
    } catch (e) { console.error(e); }
  };

  const handleTrashVoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Archive this voice log? It will be removed from your view.')) return;
    try {
      const res = await fetch(`/api/gmail?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedSmsThread?.messages.some((m: any) => m.id === id)) setSelectedSmsThread(null);
        fetchData();
      } else {
        alert('Failed to archive voice log.');
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
    // Auto-refresh data every 60 seconds to process auto-responder quickly
    const interval = setInterval(() => {
      fetchData();
    }, 60000);
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
      
      const data = await res.json();
      
      if (res.ok) {
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
      } else {
        alert(`Failed to send SMS: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Failed to send SMS due to a network error: ${e.message}`);
    }
    setSendingSms(false);
  };

  // Handle Inline Cell Editing
  const handleCellSave = async (id: string, field: string, forcedValue?: string) => {
    const valToSave = forcedValue !== undefined ? forcedValue : (editingCell?.value || '');
    if (!editingCell || editingCell.id !== id || editingCell.field !== field) return;
    
    // Optimistically update the local state to match
    setApplicants(prev => prev.map(app => 
      app.id === id ? { ...app, [field]: valToSave } : app
    ));
    setEditingCell(null);

    try {
      await fetch(`/api/applicants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: editingCell.value })
      });
      fetchData(); // Refresh to ensure backend sync
    } catch (e) {
      console.error('Failed to update inline cell', e);
    }
  };

  const [pullingSheets, setPullingSheets] = useState(false);

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

  // Pull data from Google Sheets master CRM
  const handleSheetsPull = async () => {
    setPullingSheets(true);
    try {
      const res = await fetch('/api/sheets/pull', { method: 'POST' });
      if (res.ok) {
        fetchData(); // reload all applicants to reflect changes
        alert('Successfully synchronized with Google Sheets master CRM.');
      } else {
        alert('Failed to pull from Google Sheets.');
      }
    } catch (e) {
      console.error(e);
      alert('Error pulling from Google Sheets.');
    }
    setPullingSheets(false);
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
    
    // Trigger Google Voice Web Dialer in new tab IMMEDIATELY to avoid pop-up blockers
    const cleanNum = num.replace(/\D/g, '');
    window.open(`https://voice.google.com/u/0/calls?a=nc,%2B1${cleanNum}`, '_blank');
    
    try {
      // Log the call in the background
      await fetch('/api/voice/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: num,
          applicantId: selectedApplicant?.id
        })
      });
      
      fetchData(); // refresh note logs
    } catch (e) {
      console.error('Call dialer logging error:', e);
      // Removed window.location.href = tel:${num} to prevent FaceTime from triggering automatically
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
    } else if (templateType === 'ONBOARDING_SMS') {
      const smsLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://libertydispatchers.xyz'}/onboarding/${applicant.id}`;
      emailContent = `Liberty Dispatchers Onboarding: Please complete your profile and vehicle details here: ${smsLink}`;
      statusText = 'CONTACTED';
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
      } else if (templateType === 'ONBOARDING_SMS') {
        await fetch('/api/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: applicant.phone,
            text: emailContent
          })
        });
        await fetch(`/api/applicants/${applicant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: statusText })
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

  if (authorized !== true) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #070f1e 0%, #0b2848 100%)'
      }}>
        <div className="spin-anim" style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%'
        }} />
        <style>{`
          .spin-anim {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Banner */}
      <header className="admin-header" style={{ 
        borderBottom: '1px solid var(--border-color)', 
        background: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(10px)',
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
            background: 'var(--navy-blue)',
            padding: '6px',
            borderRadius: '6px'
          }}>
            <img src="/logo.png?v=1" alt="Liberty Dispatchers" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--navy-blue)' }}>Liberty Dispatchers CRM</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Google Voice & Email CRM v1.0</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Workspace connected:</p>
                <button 
                  onClick={() => fetchData()}
                  style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    color: 'white', 
                    borderRadius: '4px', 
                    padding: '2px 8px', 
                    fontSize: '0.7rem', 
                    cursor: 'pointer' 
                  }}>
                  ↻ Refresh
                </button>
              </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>{BASE_URL}</p>
          </div>
          <button onClick={() => setShowSettingsModal(true)} className="button" style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={14} /> Settings
          </button>
          <button onClick={() => fetchData()} className="button" style={{ padding: '8px 12px' }}>
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          </button>
          <button 
            onClick={() => {
              document.cookie = "liberty_gate=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              window.location.href = '/gate';
            }} 
            className="button" 
            style={{ padding: '8px 12px', borderColor: 'var(--status-rejected)', color: 'var(--status-rejected)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Lock size={14} /> Lock CRM
          </button>
        </div>
      </header>

      {dbError && (
        <div style={{
          background: '#fee2e2',
          borderBottom: '1px solid #fca5a5',
          color: '#991b1b',
          padding: '12px 32px',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 49,
        }}>
          <AlertCircle size={16} />
          <span>{dbError}</span>
        </div>
      )}

      <main style={{ padding: '24px', maxWidth: '1600px', width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Funnel Row */}
        <div className="funnel-grid">
          <div className="glass-panel" onClick={() => { setMainView('crm'); setStatusFilter(''); }} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: statusFilter === '' && mainView === 'crm' ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--navy-blue)', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Applicants</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy-blue)' }}>{totalCount}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>leads in pool</span>
            </div>
          </div>
          <div className="glass-panel" onClick={() => { setMainView('crm'); setStatusFilter('NEW'); }} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: statusFilter === 'NEW' && mainView === 'crm' ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--status-new)', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Leads</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-new)' }}>{newCount}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>waiting screening</span>
            </div>
          </div>
          <div className="glass-panel" onClick={() => { setMainView('crm'); setStatusFilter('CONTACTED'); }} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: statusFilter === 'CONTACTED' && mainView === 'crm' ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--status-contacted)', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contacted</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-contacted)' }}>{contactedCount}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>active contact</span>
            </div>
          </div>
          <div className="glass-panel" onClick={() => { setMainView('crm'); setStatusFilter('ONBOARDING'); }} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: statusFilter === 'ONBOARDING' && mainView === 'crm' ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--status-onboarding)', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Onboarding</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-onboarding)' }}>{onboardingCount}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>W9/signing</span>
            </div>
          </div>
          <div className="glass-panel" onClick={() => { setMainView('crm'); setStatusFilter('ACTIVE'); }} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: statusFilter === 'ACTIVE' && mainView === 'crm' ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--status-active)', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Drivers</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-active)' }}>{activeCount}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>fully onboarded</span>
            </div>
          </div>

          {/* New Map, Sheets, Jobs Nav Cards */}
          <div className="glass-panel" onClick={() => setMainView('map')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: mainView === 'map' ? 'rgba(168,85,247,0.15)' : 'rgba(0,0,0,0.02)', borderTop: mainView === 'map' ? '2px solid #a855f7' : '2px solid rgba(168,85,247,0.3)', transition: 'all 0.2s', justifyContent: 'center', alignItems: 'center' }}>
            <Map size={24} style={{ color: '#a855f7', marginBottom: '4px' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: mainView === 'map' ? '#c084fc' : 'var(--text-primary)' }}>Coverage Map</span>
          </div>
          <div className="glass-panel" onClick={() => setMainView('jobs')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: mainView === 'jobs' ? 'rgba(234,179,8,0.15)' : 'rgba(0,0,0,0.02)', borderTop: mainView === 'jobs' ? '2px solid #eab308' : '2px solid rgba(234,179,8,0.3)', transition: 'all 0.2s', justifyContent: 'center', alignItems: 'center' }}>
            <Briefcase size={24} style={{ color: '#eab308', marginBottom: '4px' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: mainView === 'jobs' ? '#fde047' : 'var(--text-primary)' }}>Job Dispatch</span>
          </div>
          <div className="glass-panel" onClick={() => setMainView('sheets')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: mainView === 'sheets' ? 'rgba(15,157,88,0.15)' : 'rgba(0,0,0,0.02)', borderTop: mainView === 'sheets' ? '2px solid #0f9d58' : '2px solid rgba(15,157,88,0.3)', transition: 'all 0.2s', justifyContent: 'center', alignItems: 'center' }}>
            <Database size={24} style={{ color: '#0f9d58', marginBottom: '4px' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: mainView === 'sheets' ? '#34d399' : 'var(--text-primary)' }}>Google Sheets</span>
          </div>
        </div>

        {/* Master Split Grid */}
        {mainView === 'crm' && (
        <div className="crm-grid">
          
          {/* COLUMN 1: Applicants List */}
          <div className="glass-panel crm-column">
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
              {applicants.filter(app => {
                const blacklisted = (settingsForm.BLACKLISTED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                return !app.email || !blacklisted.includes(app.email.toLowerCase());
              }).map(app => {
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
          <div className="glass-panel crm-column" style={{ overflowY: 'auto' }}>
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
                        setActiveTab('comms');
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
                        setActiveTab('comms');
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
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {doc.status === 'SENT' && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--status-contacted)', fontStyle: 'italic' }}>Pending sign</span>
                              )}
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
                                    if (cleanNum.length >= 10) {
                                      window.open(`https://wa.me/1${cleanNum.slice(-10)}?text=${msg}`, '_blank');
                                    } else {
                                      alert('Invalid phone number for texting.');
                                    }
                                    handleSendDocument(doc.name); // Updates status to SENT and triggers email
                                  }} 
                                  className="button" 
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', height: '24px', background: '#25D366', borderColor: '#25D366', color: '#fff' }}
                                >
                                  Text (WA)
                                </button>
                              </div>
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
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Coverage Area:</span>
                              <b style={{ color: 'var(--text-primary)' }}>{intake.coverageAddress || intake.coverageArea || 'N/A'} {intake.coverageRadius && `(${intake.coverageRadius} mi)`}</b>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Desired Distance:</span>
                              <b style={{ color: 'var(--text-primary)' }}>{intake.desiredDistance || 'N/A'}</b>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Charging Stations Help:</span>
                              <b style={{ color: 'var(--text-primary)' }}>{intake.chargingStationsHelp || 'N/A'}</b>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Charging Stations Worth:</span>
                              <b style={{ color: 'var(--text-primary)' }}>{intake.chargingStationsWorth || 'N/A'}</b>
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

          {/* COLUMN 3: Communications & Workspace */}
          <div className="glass-panel crm-column">
            
            {/* Horizontal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '4px' }}>
              <button 
                onClick={() => setActiveTab('comms')} 
                className={`tab-button ${activeTab === 'comms' ? 'active' : ''}`}
                style={{ 
                  flex: 1, 
                  borderBottom: 'none', 
                  borderBottomLeftRadius: 0, 
                  borderBottomRightRadius: 0, 
                  background: activeTab === 'comms' ? 'var(--panel-bg-solid)' : 'transparent',
                  borderColor: activeTab === 'comms' ? 'var(--border-color)' : 'transparent',
                  color: activeTab === 'comms' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <MessageSquare size={14} style={{ color: activeTab === 'comms' ? 'var(--status-contacted)' : 'inherit' }} />
                Comms Hub
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
            </div>

            {/* TAB CONTENTS */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              
              {/* TAB 1: COMMS HUB */}
              {activeTab === 'comms' && (
                <div style={{ height: '100%', minHeight: '520px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>External Comms Hub</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Launch your preferred communication platforms in dedicated windows to avoid browser security restrictions.</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {/* Google Voice Launcher */}
                    <div style={{ flex: '1 1 250px', background: 'var(--panel-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                        <Phone size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Google Voice</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Make calls and send text messages through your Google Voice number.</p>
                      </div>
                      <button 
                        onClick={() => window.open('https://voice.google.com/', 'Voice', 'width=800,height=900,left=200,top=100')}
                        className="button highlight"
                        style={{ width: '100%', marginTop: 'auto' }}
                      >
                        Launch Voice Window
                      </button>
                    </div>

                    {/* WhatsApp Launcher */}
                    <div style={{ flex: '1 1 250px', background: 'var(--panel-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366' }}>
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>WhatsApp Web</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chat directly with applicants via WhatsApp.</p>
                      </div>
                      <button 
                        onClick={() => window.open('https://web.whatsapp.com/', 'WhatsApp', 'width=1000,height=900,left=250,top=100')}
                        className="button highlight"
                        style={{ width: '100%', marginTop: 'auto', background: '#25D366', borderColor: '#25D366' }}
                      >
                        Launch WhatsApp Window
                      </button>
                    </div>

                    {/* Gmail Launcher */}
                    <div style={{ flex: '1 1 250px', background: 'var(--panel-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                        <Mail size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Gmail</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Access your full inbox and draft emails.</p>
                      </div>
                      <button 
                        onClick={() => window.open('https://mail.google.com/', 'Gmail', 'width=1200,height=900,left=300,top=100')}
                        className="button highlight"
                        style={{ width: '100%', marginTop: 'auto' }}
                      >
                        Launch Gmail Window
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GMAIL INBOX */}
              {activeTab === 'gmail' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: '500px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Google Workspace Viewer (Unified Inbox)</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{gmailData.emailAddress || 'recruit@libertydispatchers.com'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        onClick={() => {
                          setLoading(true);
                          fetch('/api/gmail').then(r => r.json()).then(data => { setGmailData(data); setLoading(false); });
                        }}
                        className="button highlight"
                        style={{ fontSize: '0.7rem', padding: '4px 10px', height: '26px' }}
                      >
                        Refresh Inbox
                      </button>
                      <span className={`status-tag ${gmailData.connected ? 'active' : 'contacted'}`} style={{ scale: '0.85' }}>
                        {gmailData.connected ? 'Google Live' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                  {!gmailData.connected && gmailData.error && (
                    <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.8rem', marginTop: '10px' }}>
                      <strong>Sync Error:</strong> {gmailData.error}
                    </div>
                  )}
                  {selectedApplicant && selectedApplicant.email && (
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Compose Email to {selectedApplicant.name} ({selectedApplicant.email}):
                      </p>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const subject = formData.get('subject') as string;
                        const body = formData.get('body') as string;
                        if (!subject.trim() || !body.trim()) return;
                        
                        // Using same state as custom email just for simplicity, but no strict need to disable
                        try {
                          const res = await fetch('/api/gmail', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              to: selectedApplicant.email,
                              subject: subject,
                              body: body
                            })
                          });
                          if (res.ok) {
                            alert('Email sent successfully!');
                            (e.target as HTMLFormElement).reset();
                          } else {
                            const errData = await res.json();
                            alert(`Failed to send: ${errData.error}`);
                          }
                        } catch (err) {
                          console.error('Error sending custom email', err);
                          alert('Network error sending email');
                        }
                      }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input type="text" name="subject" placeholder="Subject" className="input-field" style={{ fontSize: '0.8rem', height: '32px' }} required />
                        <textarea 
                          name="body"
                          placeholder="Type your message..." 
                          className="input-field" 
                          style={{ minHeight: '60px', resize: 'vertical', fontSize: '0.8rem', padding: '8px' }}
                          required
                        />
                        <button 
                          type="submit" 
                          className="button highlight" 
                          style={{ alignSelf: 'flex-end', padding: '0 16px', height: '32px', fontSize: '0.75rem' }}
                        >
                          <Send size={14} style={{ marginRight: '6px' }} />
                          Send Email
                        </button>
                      </form>
                    </div>
                  )}
                  <div className="tab-layout">
                    {/* Mail list */}
                    <div className="tab-sidebar" style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px', borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
                      {(gmailData.emails || []).filter((mail: any) => {
                        const blacklisted = (settingsForm.BLACKLISTED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                        return !mail.from || !blacklisted.includes(mail.from.toLowerCase());
                      }).map((mail: any) => {
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
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '300px' }}>
                        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{selectedEmail.subject}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <p>From: <b>{selectedEmail.fromName}</b> &lt;{selectedEmail.from}&gt;</p>
                              {(() => {
                                const matchingApp = applicants.find((a: any) => 
                                  selectedEmail.from.includes(a.email) || 
                                  selectedEmail.body.includes(a.phone) ||
                                  selectedEmail.fromName.includes(a.name) ||
                                  (selectedEmail.senderNumber && a.phone.replace(/\D/g,'').includes(selectedEmail.senderNumber.replace(/\D/g,'')))
                                );
                                if (matchingApp) {
                                  return (
                                    <button 
                                      onClick={async () => {
                                        const newName = prompt('Enter new name for this applicant:', matchingApp.name);
                                        if (newName && newName !== matchingApp.name) {
                                          const res = await fetch(`/api/applicants/${matchingApp.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ name: newName })
                                          });
                                          if (res.ok) fetchData();
                                        }
                                      }}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '0.8rem' }}
                                      title="Edit Applicant Name"
                                    >
                                      ✏️
                                    </button>
                                  );
                                }
                                return null;
                              })()}
                            </div>                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button 
                                onClick={() => handleBlacklistEmail(selectedEmail.from)}
                                className="button" 
                                style={{ fontSize: '0.65rem', padding: '2px 8px', height: '24px', borderColor: 'var(--status-rejected)', color: 'var(--status-rejected)' }}
                              >
                                Not an Applicant
                              </button>
                              <p>{new Date(selectedEmail.date).toLocaleString()}</p>
                            </div>
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
                          {selectedEmail.senderNumber && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <button 
                                onClick={() => {
                                  setDialedNumber(selectedEmail.senderNumber);
                                  handleDialCall(selectedEmail.senderNumber);
                                  setActiveTab('comms');
                                }}
                                className="button" 
                                style={{ fontSize: '0.75rem', height: '30px', padding: '0 10px', flex: 1, borderColor: 'var(--status-active)', color: 'var(--status-active)' }}
                              >
                                Call {selectedEmail.senderNumber}
                              </button>
                              <button 
                                onClick={() => {
                                  setActiveTab('comms');
                                }}
                                className="button" 
                                style={{ fontSize: '0.75rem', height: '30px', padding: '0 10px', flex: 1, borderColor: 'var(--status-active)', color: 'var(--status-active)' }}
                              >
                                Text (SMS)
                              </button>
                            </div>
                          )}

                          {/* Match Gmail sender to DB applicant to enable custom links */}
                          {(() => {
                            const matchingApplicant = applicants.find((a: any) => 
                              selectedEmail.from.includes(a.email) || 
                              selectedEmail.body.includes(a.phone) ||
                              selectedEmail.fromName.includes(a.name) ||
                              (selectedEmail.senderNumber && a.phone.replace(/\D/g,'').includes(selectedEmail.senderNumber.replace(/\D/g,'')))
                            );

                            if (matchingApplicant) {
                              const docs = matchingApplicant.documents?.find((d: any) => d.name === 'Onboarding Material');
                              const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
                              
                              return (
                                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', padding: '16px', borderRadius: '8px', marginTop: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                        👤 Lead Manager: {matchingApplicant.name}
                                      </h4>
                                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                                        Status: {matchingApplicant.status}
                                      </span>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setSelectedApplicant(matchingApplicant);
                                        setEditProfileForm({
                                          status: matchingApplicant.status,
                                          vehicle: esignData.vehicleType || '',
                                          area: (esignData.coverageAddress || esignData.coverageArea || '') + (esignData.coverageRadius ? ` (${esignData.coverageRadius} mi)` : '')
                                        });
                                        setMainView('crm'); // Switch to main CRM view to edit profile
                                        setStatusFilter('');
                                        setTimeout(() => setIsEditingProfile(true), 100);
                                      }}
                                      className="button"
                                      style={{ fontSize: '0.7rem', height: '26px', padding: '0 8px' }}
                                    >
                                      Full Profile
                                    </button>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '0.8rem' }}>
                                    <div style={{ background: 'var(--panel-bg)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Vehicle</span>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{esignData.vehicleType || 'Not specified'}</div>
                                    </div>
                                    <div style={{ background: 'var(--panel-bg)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Coverage Area</span>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{esignData.coverageAddress || esignData.coverageArea || 'Not specified'} {esignData.coverageRadius && `(${esignData.coverageRadius} mi)`}</div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <button 
                                      onClick={() => handleSendGmailTemplate(matchingApplicant, 'ONBOARDING')}
                                      className="button highlight" 
                                      style={{ fontSize: '0.75rem', height: '36px', padding: '0 10px', flex: 1 }}
                                    >
                                      Send Onboarding & E-Sign
                                    </button>
                                    
                                    <button 
                                      onClick={() => handleSendGmailTemplate(matchingApplicant, 'REJECT')}
                                      className="button" 
                                      style={{ fontSize: '0.75rem', height: '36px', padding: '0 10px', flex: 1, borderColor: 'rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.8)' }}
                                    >
                                      Reject (No Vehicle)
                                    </button>
                                  </div>

                                  {matchingApplicant.phone && matchingApplicant.phone !== 'N/A' && (
                                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px', marginTop: '4px' }}>
                                      <button 
                                        onClick={() => {
                                          setDialedNumber(matchingApplicant.phone);
                                          handleDialCall(matchingApplicant.phone);
                                          setActiveTab('comms');
                                        }}
                                        className="button" 
                                        style={{ fontSize: '0.7rem', height: '30px', padding: '0 8px', flex: 1, borderColor: 'var(--status-active)', color: 'var(--status-active)' }}
                                      >
                                        <Phone size={12} /> Call
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setDialedNumber(matchingApplicant.phone);
                                          setActiveTab('comms');
                                        }}
                                        className="button" 
                                        style={{ fontSize: '0.7rem', height: '30px', padding: '0 8px', flex: 1, borderColor: 'var(--status-active)', color: 'var(--status-active)' }}
                                      >
                                        <MessageSquare size={12} /> Text
                                      </button>
                                      <button 
                                        onClick={() => handleSendGmailTemplate(matchingApplicant, 'ONBOARDING_SMS')}
                                        className="button highlight" 
                                        style={{ fontSize: '0.7rem', height: '30px', padding: '0 8px', flex: 2, background: 'var(--status-active)', borderColor: 'var(--status-active)', color: '#fff' }}
                                      >
                                        <CheckCircle2 size={12} /> Send Onboarding Link (SMS)
                                      </button>
                                    </div>
                                  )}

                                  {/* Custom Email Composer */}
                                  <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                      Draft Custom Email Reply:
                                    </p>
                                    <form onSubmit={async (e) => {
                                      e.preventDefault();
                                      if (!customEmailBody.trim()) return;
                                      setSendingCustomEmail(true);
                                      try {
                                        const res = await fetch('/api/gmail', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            to: matchingApplicant.email,
                                            subject: `Re: ${selectedEmail.subject || 'Your Inquiry'}`,
                                            body: customEmailBody
                                          })
                                        });
                                        if (res.ok) {
                                          alert('Email sent successfully!');
                                          setCustomEmailBody('');
                                        } else {
                                          const errData = await res.json();
                                          alert(`Failed to send: ${errData.error}`);
                                        }
                                      } catch (err) {
                                        console.error('Error sending custom email', err);
                                        alert('Failed to send email due to a network error');
                                      }
                                      setSendingCustomEmail(false);
                                    }}>
                                      <textarea 
                                        className="input-field" 
                                        placeholder={`Compose an email directly to ${matchingApplicant.name}...`}
                                        value={customEmailBody}
                                        onChange={(e) => setCustomEmailBody(e.target.value)}
                                        style={{ width: '100%', height: '80px', fontSize: '0.8rem', padding: '8px', marginBottom: '8px', resize: 'vertical' }}
                                      />
                                      <button 
                                        type="submit" 
                                        disabled={sendingCustomEmail || !customEmailBody.trim()}
                                        className="button highlight" 
                                        style={{ fontSize: '0.75rem', height: '30px', padding: '0 16px' }}
                                      >
                                        {sendingCustomEmail ? 'Sending...' : 'Send Custom Email'}
                                      </button>
                                    </form>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', padding: '16px', borderRadius: '8px', marginTop: '8px', textAlign: 'center' }}>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                    Sender not recognized in Applicant Pool.
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
                                    className="button highlight" 
                                    style={{ fontSize: '0.8rem', height: '36px', padding: '0 24px', margin: '0 auto', display: 'inline-flex' }}
                                  >
                                    + Add as New Lead
                                  </button>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', minWidth: '300px' }}>
                        <Mail size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                        <p style={{ fontSize: '0.8rem' }}>Select an email to view</p>
                      </div>
                    )}
                  </div>
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
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                      onClick={() => {
                                        const phone = selectedApplicant.phone || '';
                                        const cleanPhone = phone.replace(/\D/g, '');
                                        const url = `https://libertydispatchers.com/onboarding/${selectedApplicant.id}`;
                                        const msg = encodeURIComponent(`Hi ${selectedApplicant.name}, please complete your ${doc.name} here: ${url}`);
                                        if (cleanPhone.length >= 10) {
                                          window.open(`https://wa.me/1${cleanPhone.slice(-10)}?text=${msg}`, '_blank');
                                        } else {
                                          alert('Invalid phone number.');
                                        }
                                      }}
                                      className="button highlight" 
                                      style={{ height: '24px', padding: '0 8px', fontSize: '0.7rem', background: '#25D366', borderColor: '#25D366', color: '#fff' }}
                                    >
                                      Text Link (WA)
                                    </button>
                                    <button 
                                      onClick={() => handleSendDocument(doc.name)}
                                      className="button" 
                                      style={{ height: '24px', padding: '0 8px', fontSize: '0.7rem' }}
                                    >
                                      Email Signature URL
                                    </button>
                                  </div>
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



              {/* MAP TAB CONTENT MOVED OUT */}
            </div>
          </div>
        </div>
        )}

        {/* MAP MAIN VIEW */}
        {mainView === 'map' && (
          <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 100px)', minHeight: '800px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <DriverMap activeDrivers={applicants.filter(a => {
              // Show applicants who have a completed location/onboarding or are ACTIVE
              const docs = a.documents?.find((d: any) => d.name === 'Onboarding Material');
              const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
              return a.status === 'ACTIVE' || (esignData.coverageAddress && esignData.coverageAddress !== '') || (esignData.coverageArea && esignData.coverageArea !== '');
            })} />
          </div>
        )}

        {/* JOBS MAIN VIEW */}
        {mainView === 'jobs' && (
          <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 100px)', minHeight: '800px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', background: 'var(--panel-bg-solid)' }}>
            <JobBoard activeDrivers={applicants.filter(a => a.status === 'ACTIVE')} />
          </div>
        )}

        {/* SHEETS MAIN VIEW */}
        {mainView === 'sheets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '720px', padding: '24px', background: 'var(--panel-bg-solid)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            
            {/* Data Export metadata banner */}
            <div style={{ 
              background: 'rgba(16,185,129,0.05)', 
              border: '1px solid rgba(16,185,129,0.15)', 
              padding: '16px 24px', 
              borderRadius: '8px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--status-active)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={20} /> Driver Data Roster
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Currently viewing <b>{applicants.length}</b> total applicants
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleSheetsPull}
                  disabled={pullingSheets}
                  className="button" 
                  style={{ 
                    background: pullingSheets ? 'var(--bg-color)' : 'var(--accent-color)', 
                    color: '#fff',
                    border: '1px solid var(--control-border)',
                    height: '36px', 
                    padding: '0 16px', 
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    cursor: pullingSheets ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RefreshCw size={14} className={pullingSheets ? "spin" : ""} />
                  {pullingSheets ? 'Pulling...' : 'Pull from Sheets'}
                </button>
                <button 
                  onClick={() => {
                    import('./exportCsv').then(m => m.downloadCSV(applicants, 'liberty_dispatchers_roster.csv'));
                  }}
                  className="button highlight" 
                  style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    boxShadow: '0 4px 10px rgba(16,185,129,0.2)',
                    height: '36px', 
                    padding: '0 16px', 
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <Database size={14} />
                  Export to Branded CSV
                </button>
              </div>
            </div>

            {/* Spreadsheet Grid Mock */}
            <div style={{ 
              flex: 1, 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff' // keep sheet background white for realism
            }}>
              <div style={{ overflowX: 'auto', flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', color: '#111827' }}>
                  <thead style={{ background: '#f3f4f6', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <tr>
                      {['#', 'ID', 'Name', 'Phone', 'Email', 'Status', 'Availability', 'Vehicle', 'Coverage Area', 'Applied Date', 'Actions'].map((header: string, idx: number) => (
                        <th key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((row: any, i: number) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ padding: '10px 16px', borderRight: '1px solid #e5e7eb', color: '#6b7280', fontWeight: 500 }}>{i + 1}</td>
                        <td style={{ padding: '10px 16px', borderRight: '1px solid #e5e7eb', fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.id}</td>
                        <td 
                          style={{ padding: '10px 16px', borderRight: '1px solid #e5e7eb', fontWeight: 500, cursor: 'pointer' }}
                          onClick={() => setEditingCell({ id: row.id, field: 'name', value: row.name })}
                        >
                          {editingCell?.id === row.id && editingCell?.field === 'name' ? (
                            <input 
                              autoFocus
                              value={editingCell.value}
                              onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                              onBlur={() => handleCellSave(row.id, 'name')}
                              onKeyDown={e => e.key === 'Enter' && handleCellSave(row.id, 'name')}
                              style={{ width: '100%', padding: '4px', border: '1px solid var(--accent-color)', borderRadius: '4px' }}
                            />
                          ) : (row.name)}
                        </td>
                        <td 
                          style={{ padding: '10px 16px', borderRight: '1px solid #e5e7eb', cursor: 'pointer' }}
                          onClick={() => setEditingCell({ id: row.id, field: 'phone', value: row.phone })}
                        >
                          {editingCell?.id === row.id && editingCell?.field === 'phone' ? (
                            <input 
                              autoFocus
                              value={editingCell.value}
                              onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                              onBlur={() => handleCellSave(row.id, 'phone')}
                              onKeyDown={e => e.key === 'Enter' && handleCellSave(row.id, 'phone')}
                              style={{ width: '100%', padding: '4px', border: '1px solid var(--accent-color)', borderRadius: '4px' }}
                            />
                          ) : (row.phone)}
                        </td>
                        <td 
                          style={{ padding: '10px 16px', borderRight: '1px solid #e5e7eb', cursor: 'pointer' }}
                          onClick={() => setEditingCell({ id: row.id, field: 'email', value: row.email })}
                        >
                          {editingCell?.id === row.id && editingCell?.field === 'email' ? (
                            <input 
                              autoFocus
                              value={editingCell.value}
                              onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                              onBlur={() => handleCellSave(row.id, 'email')}
                              onKeyDown={e => e.key === 'Enter' && handleCellSave(row.id, 'email')}
                              style={{ width: '100%', padding: '4px', border: '1px solid var(--accent-color)', borderRadius: '4px' }}
                            />
                          ) : (row.email)}
                        </td>
                        <td 
                          style={{ padding: '10px 16px', borderRight: '1px solid #e5e7eb', cursor: 'pointer' }}
                          onClick={() => setEditingCell({ id: row.id, field: 'status', value: row.status })}
                        >
                          {editingCell?.id === row.id && editingCell?.field === 'status' ? (
                            <select 
                              autoFocus
                              value={editingCell.value}
                              onChange={e => {
                                setEditingCell({ ...editingCell, value: e.target.value });
                                handleCellSave(row.id, 'status', e.target.value);
                              }}
                              onBlur={() => handleCellSave(row.id, 'status')}
                              style={{ width: '100%', padding: '4px', border: '1px solid var(--accent-color)', borderRadius: '4px', background: '#fff' }}
                            >
                              <option value="NEW">NEW</option>
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="PENDING">PENDING</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          ) : (
                            <span style={{ 
                              background: row.status === 'NEW' ? '#dbeafe' : row.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6', 
                              color: row.status === 'NEW' ? '#1e40af' : row.status === 'ACTIVE' ? '#065f46' : '#374151',
                              padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 
                            }}>
                              {row.status}
                            </span>
                          )}
                        </td>
                        <td 
                          style={{ padding: '10px 16px', borderRight: '1px solid #e5e7eb', color: '#4b5563', fontSize: '0.75rem', cursor: 'pointer' }}
                          onClick={() => {
                            const docs = row.documents?.find((d: any) => d.name === 'Onboarding Material');
                            const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
                            setEditingCell({ id: row.id, field: 'availability', value: (esignData.availabilityDays || []).join(', ') || row.availability || '' });
                          }}
                        >
                          {editingCell?.id === row.id && editingCell?.field === 'availability' ? (
                            <input 
                              autoFocus
                              value={editingCell.value}
                              onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                              onBlur={() => handleCellSave(row.id, 'availability')}
                              onKeyDown={e => e.key === 'Enter' && handleCellSave(row.id, 'availability')}
                              style={{ width: '100%', padding: '4px', border: '1px solid var(--accent-color)', borderRadius: '4px' }}
                            />
                          ) : (
                            (() => {
                              const docs = row.documents?.find((d: any) => d.name === 'Onboarding Material');
                              const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
                              
                              let availText = '';
                              if (esignData.availabilityDays && esignData.availabilityDays.length > 0) {
                                availText = esignData.availabilityDays.join(', ');
                              } else if (row.availability) {
                                try {
                                  const parsed = JSON.parse(row.availability);
                                  const days = Object.entries(parsed).filter(([k,v]:any) => v && v.length > 0).map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
                                  if (days.length > 0) {
                                    availText = days.join(', ');
                                  }
                                } catch(e) {
                                  if (row.availability !== '{}') availText = row.availability;
                                }
                              }
                              return availText || '-';
                            })()
                          )}
                        </td>
                        <td 
                          style={{ padding: '10px 16px', borderRight: '1px solid #e5e7eb', color: '#4b5563', fontSize: '0.75rem', cursor: 'pointer' }}
                          onClick={() => {
                            const docs = row.documents?.find((d: any) => d.name === 'Onboarding Material');
                            const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
                            setEditingCell({ id: row.id, field: 'vehicleType', value: esignData.vehicleType || '' });
                          }}
                        >
                          {editingCell?.id === row.id && editingCell?.field === 'vehicleType' ? (
                            <input 
                              autoFocus
                              value={editingCell.value}
                              onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                              onBlur={() => handleCellSave(row.id, 'vehicleType')}
                              onKeyDown={e => e.key === 'Enter' && handleCellSave(row.id, 'vehicleType')}
                              style={{ width: '100%', padding: '4px', border: '1px solid var(--accent-color)', borderRadius: '4px' }}
                            />
                          ) : (
                            (() => {
                              const docs = row.documents?.find((d: any) => d.name === 'Onboarding Material');
                              const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
                              return esignData.vehicleType || 'Unknown';
                            })()
                          )}
                        </td>
                        <td 
                          style={{ padding: '10px 16px', borderRight: '1px solid #e5e7eb', color: '#4b5563', fontSize: '0.75rem', cursor: 'pointer' }}
                          onClick={() => {
                            const docs = row.documents?.find((d: any) => d.name === 'Onboarding Material');
                            const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
                            setEditingCell({ id: row.id, field: 'coverageArea', value: (esignData.coverageAddress || esignData.coverageArea || '') + (esignData.coverageRadius ? ` (${esignData.coverageRadius} mi)` : '') });
                          }}
                        >
                          {editingCell?.id === row.id && editingCell?.field === 'coverageArea' ? (
                            <input 
                              autoFocus
                              value={editingCell.value}
                              onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                              onBlur={() => handleCellSave(row.id, 'coverageArea')}
                              onKeyDown={e => e.key === 'Enter' && handleCellSave(row.id, 'coverageArea')}
                              style={{ width: '100%', padding: '4px', border: '1px solid var(--accent-color)', borderRadius: '4px' }}
                            />
                          ) : (
                            (() => {
                              const docs = row.documents?.find((d: any) => d.name === 'Onboarding Material');
                              const esignData = docs?.esignData ? JSON.parse(docs.esignData) : {};
                              return (esignData.coverageAddress || esignData.coverageArea || 'Not specified') + (esignData.coverageRadius ? ` (${esignData.coverageRadius} mi)` : '');
                            })()
                          )}
                        </td>
                        <td style={{ padding: '10px 16px', borderRight: '1px solid #e5e7eb', color: '#4b5563' }}>{row.appliedDate}</td>
                        <td style={{ padding: '10px 16px', color: '#4b5563', textAlign: 'center' }}>
                          <button onClick={(e) => handleDeleteApplicant(row.id, e)} className="button" style={{ padding: '6px', color: 'var(--status-rejected)' }} title="Delete Record">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer links at bottom of page */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'rgba(255, 255, 255, 0.01)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        marginTop: 'auto'
      }}>
        <span>© {new Date().getFullYear()} Liberty Dispatchers. All rights reserved.</span>
        <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy-blue)', textDecoration: 'underline' }}>Privacy Policy</a>
        <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy-blue)', textDecoration: 'underline' }}>Terms &amp; Conditions</a>
      </footer>

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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

      {/* MODAL: INTEGRATION SETTINGS */}
      {showSettingsModal && (
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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="var(--accent-cyan)" /> CRM Integrations & Settings
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  WhatsApp Sync Number
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  value={settingsForm.WHATSAPP_NUMBER}
                  onChange={(e) => setSettingsForm({...settingsForm, WHATSAPP_NUMBER: e.target.value})}
                  placeholder="e.g. +1 (516) 497-4669"
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  The number used to match database candidates and simulate WhatsApp chats.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Dispatcher / Google Voice Number
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  value={settingsForm.DISPATCHER_PHONE_NUMBER}
                  onChange={(e) => setSettingsForm({...settingsForm, DISPATCHER_PHONE_NUMBER: e.target.value})}
                  placeholder="e.g. (410) 635-4001"
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  The source phone number shown in the SMS & Call Log workspaces.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Google Sheets Spreadsheet ID
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  value={settingsForm.GOOGLE_SHEET_ID}
                  onChange={(e) => setSettingsForm({...settingsForm, GOOGLE_SHEET_ID: e.target.value})}
                  placeholder="e.g. 15vJCu-X-0oeYXT7O-iJKpPPT2pv94smM-AFnN5HlT4s"
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  The spreadsheet ID used to synchronize candidate tables live.
                </span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Ignored Email Senders (Blacklist)
                </label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '60px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                  value={settingsForm.BLACKLISTED_EMAILS}
                  onChange={(e) => setSettingsForm({...settingsForm, BLACKLISTED_EMAILS: e.target.value})}
                  placeholder="e.g. news@mg.resume-now.com, mailer-daemon@googlemail.com"
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Comma-separated list of email addresses to exclude from the applicant feed and sync logs.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowSettingsModal(false)} 
                  className="button" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingSettings}
                  className="button highlight" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
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
