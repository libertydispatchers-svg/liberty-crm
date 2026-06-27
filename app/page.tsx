/* eslint-disable @next/next/no-img-element, @next/next/no-sync-scripts */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { User, LogOut, CheckCircle, MapPin, Truck, Phone, Mail, Globe } from 'lucide-react';

const MiniMap = dynamic(() => import('./components/MiniMap'), { ssr: false });

// ── Language definitions ──────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en',  label: 'English',    flag: '🇺🇸', dir: 'ltr' },
  { code: 'es',  label: 'Español',    flag: '🇪🇸', dir: 'ltr' },
  { code: 'ar',  label: 'عربي',       flag: '🇸🇦', dir: 'rtl' },
  { code: 'fr',  label: 'Français',   flag: '🇭🇹', dir: 'ltr' },  // Haitian Creole/French
  { code: 'zh',  label: '中文',        flag: '🇨🇳', dir: 'ltr' },
  { code: 'bn',  label: 'বাংলা',       flag: '🇧🇩', dir: 'ltr' },
  { code: 'he',  label: 'עברית',      flag: '🇮🇱', dir: 'rtl' },
  { code: 'am',  label: 'አማርኛ',       flag: '🇪🇹', dir: 'ltr' },
  { code: 'yo',  label: 'Yorùbá',     flag: '🇳🇬', dir: 'ltr' },
  { code: 'ru',  label: 'Русский',    flag: '🇷🇺', dir: 'ltr' },
];

const T: Record<string, Record<string, string>> = {
  tagline: {
    en: 'Bringing true liberty to the courier lifestyle. Join the dispatch revolution and take control of your route.',
    es: 'Libertad real para el estilo de vida del mensajero. Únete a la revolución del despacho.',
    ar: 'أحضر الحرية الحقيقية لأسلوب حياة الساعي. انضم إلى ثورة الإرسال.',
    fr: 'La vraie liberté pour le style de vie du coursier. Rejoignez la révolution.',
    zh: '为快递员带来真正的自由。加入调度革命，掌控你的路线。',
    bn: 'কুরিয়ার জীবনধারায় সত্যিকারের স্বাধীনতা। ডিসপ্যাচ বিপ্লবে যোগ দিন।',
    he: 'חירות אמיתית לחיי השליח. הצטרף למהפכת השיגור.',
    am: 'ለኩሪየር ኑሮ እውነተኛ ነጻነት። የላኪ አብዮቱን ይቀላቀሉ።',
    yo: 'Ominira gidi fun igbesi aye olufin. Darapọ mọ iyipada fifiranṣẹ.',
    ru: 'Настоящая свобода для курьера. Присоединяйтесь к революции диспетчеризации.',
  },
  applyBtn: {
    en: 'Apply Now', es: 'Aplicar Ahora', ar: 'قدم الآن', fr: 'Postuler',
    zh: '立即申请', bn: 'এখন আবেদন করুন', he: 'הגש עכשיו', am: 'አሁን ያመልክቱ', yo: 'Wọle Bayi', ru: 'Подать заявку',
  },
  signIn: {
    en: 'Sign In', es: 'Iniciar Sesión', ar: 'تسجيل الدخول', fr: 'Connexion',
    zh: '登录', bn: 'সাইন ইন', he: 'כניסה', am: 'ግባ', yo: 'Wọle', ru: 'Войти',
  },
  fullName: {
    en: 'Full Name', es: 'Nombre Completo', ar: 'الاسم الكامل', fr: 'Nom Complet',
    zh: '全名', bn: 'পুরো নাম', he: 'שם מלא', am: 'ሙሉ ስም', yo: 'Orukọ Ni kikun', ru: 'Полное имя',
  },
  phone: {
    en: 'Phone Number', es: 'Número de Teléfono', ar: 'رقم الهاتف', fr: 'Numéro de Téléphone',
    zh: '电话号码', bn: 'ফোন নম্বর', he: 'מספר טלפון', am: 'ስልክ ቁጥር', yo: 'Nọmba Foonu', ru: 'Номер телефона',
  },
  whatsapp: {
    en: 'WhatsApp Number (optional)', es: 'Número de WhatsApp (opcional)', ar: 'رقم واتساب (اختياري)',
    fr: 'Numéro WhatsApp (optionnel)', zh: 'WhatsApp 号码（可选）', bn: 'হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)',
    he: 'מספר וואטסאפ (אופציונלי)', am: 'የዋትስአፕ ቁጥር (አማራጭ)', yo: 'Nọmba WhatsApp (aṣayan)', ru: 'Номер WhatsApp (необязательно)',
  },
  email: {
    en: 'Email Address', es: 'Correo Electrónico', ar: 'البريد الإلكتروني', fr: 'Adresse e-mail',
    zh: '电子邮件', bn: 'ইমেইল ঠিকানা', he: 'כתובת אימייל', am: 'ኢሜይል አድራሻ', yo: 'Àdírẹ́sì Ímeèlì', ru: 'Электронная почта',
  },
  password: {
    en: 'Create Password', es: 'Crear Contraseña', ar: 'إنشاء كلمة مرور', fr: 'Créer un mot de passe',
    zh: '创建密码', bn: 'পাসওয়ার্ড তৈরি করুন', he: 'צור סיסמה', am: 'የይለፍ ቃል ፍጠር', yo: 'Ṣẹda Ọrọ Aṣina', ru: 'Создать пароль',
  },
  submit: {
    en: 'Submit Application', es: 'Enviar Solicitud', ar: 'تقديم الطلب', fr: 'Soumettre',
    zh: '提交申请', bn: 'আবেদন জমা দিন', he: 'שלח בקשה', am: 'ማመልከቻ ያስገቡ', yo: 'Fi Ìbéèrè Sí', ru: 'Отправить заявку',
  },
  submitting: {
    en: 'Creating Profile...', es: 'Creando perfil...', ar: 'جارٍ إنشاء الملف...', fr: 'Création...',
    zh: '正在创建...', bn: 'প্রোফাইল তৈরি হচ্ছে...', he: 'יוצר פרופיל...', am: 'መገለጫ እየፈጠረ...', yo: 'Ṣiṣẹ...', ru: 'Создание...',
  },
};

function t(key: string, lang: string): string {
  return T[key]?.[lang] || T[key]?.['en'] || key;
}

export default function LandingPage() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>('register');
  const [isLoading, setIsLoading] = useState(true);

  // Language
  const [lang, setLang] = useState('en');
  const [showLangModal, setShowLangModal] = useState(true);

  const selectLang = (code: string) => {
    setLang(code);
    setShowLangModal(false);
  };

  const currentLangDir = LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';

  // Register Form
  const [regForm, setRegForm] = useState({ name: '', phone: '', whatsapp: '', email: '', password: '' });
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
        setEditForm({ name: data.name || '', phone: data.phone || '', coverageAddress, coverageRadius, vehicleType: vehicle });
      }
    } catch (e) { console.error(e); }
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
        body: JSON.stringify({ ...regForm, source: 'WEBSITE', language: lang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      window.location.href = '/verify-email';
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

  const inputStyle: React.CSSProperties = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.25)',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    direction: currentLangDir as any,
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

      {/* Language Modal */}
      {showLangModal && view !== 'dashboard' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11,19,30,0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <img src="/logo.jpg" alt="Logo" style={{ maxWidth: '200px', marginBottom: '30px', borderRadius: '12px' }} />
          <h2 style={{ color: '#fff', marginBottom: '20px' }}>Select Your Language</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', width: '100%', maxWidth: '600px' }}>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => selectLang(l.code)}
                style={{
                  padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '1rem',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Change Language Button (Top Right) */}
      {!showLangModal && view !== 'dashboard' && (
        <button
          onClick={() => setShowLangModal(true)}
          style={{
            position: 'fixed', top: '16px', right: '16px', zIndex: 100,
            background: 'rgba(11,19,30,0.8)', border: '1px solid rgba(10,132,255,0.3)',
            borderRadius: '20px', padding: '6px 12px', color: '#0a84ff',
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
          }}
        >
          <Globe size={14} /> {LANGUAGES.find(l => l.code === lang)?.label}
        </button>
      )}

      {/* Logo + tagline */}
      <div style={{ marginBottom: '2rem', textAlign: 'center', marginTop: view !== 'dashboard' ? '56px' : '0' }}>
        <img
          src="/logo.jpg"
          alt="Liberty Dispatchers Logo"
          style={{ maxWidth: '280px', height: 'auto', objectFit: 'contain', marginBottom: '1rem' }}
        />
        {view !== 'dashboard' && (
          <p
            key={lang}
            style={{
              fontSize: '1.05rem', color: '#94a3b8', maxWidth: '500px', lineHeight: '1.6',
              direction: currentLangDir as any,
              animation: 'fadeIn 0.4s ease',
            }}
          >
            {t('tagline', lang)}
          </p>
        )}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* ── Dashboard ── */}
      {view === 'dashboard' && profile ? (
        <div style={{ width: '100%', maxWidth: '600px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
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

          {(() => {
            const onboardDoc = profile.documents?.find((d: any) => d.name === 'Onboarding Material');
            if (onboardDoc && onboardDoc.status !== 'SIGNED') {
              return (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ color: '#94a3b8', marginBottom: '16px' }}>Complete your onboarding to get started.</p>
                  <a href={`/esign/${profile.id}`} style={{ background: 'linear-gradient(135deg, #0a84ff, #e30022)', color: '#fff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
                    Complete Onboarding →
                  </a>
                </div>
              );
            }
            return null;
          })()}

          <form onSubmit={handleUpdateProfile} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                <User size={18} /> Personal Info
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Full Name</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Phone Number</label>
                  <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} style={inputStyle} />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                <MapPin size={18} /> Coverage &amp; Vehicle
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Coverage Address / City / Zip</label>
                  <input type="text" placeholder="e.g. Queens NY or 11207" value={editForm.coverageAddress} onChange={e => setEditForm({...editForm, coverageAddress: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Radius (Miles)</label>
                  <select value={editForm.coverageRadius} onChange={e => setEditForm({...editForm, coverageRadius: e.target.value})} style={{ ...inputStyle, background: '#1e293b' }}>
                    <option value="3">3 Miles</option>
                    <option value="5">5 Miles</option>
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
                  <select value={editForm.vehicleType} onChange={e => setEditForm({...editForm, vehicleType: e.target.value})} style={{ ...inputStyle, background: '#1e293b' }}>
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

            <button type="submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.8 : 1, marginTop: '10px' }}>
              {isSubmitting ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

      ) : (
        /* ── Auth Card ── */
        <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem' }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px' }}>
            <button onClick={() => setView('register')} style={{ flex: 1, padding: '8px', border: 'none', background: view === 'register' ? '#2563eb' : 'transparent', color: view === 'register' ? '#fff' : '#94a3b8', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {t('applyBtn', lang)}
            </button>
            <button onClick={() => setView('login')} style={{ flex: 1, padding: '8px', border: 'none', background: view === 'login' ? '#2563eb' : 'transparent', color: view === 'login' ? '#fff' : '#94a3b8', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {t('signIn', lang)}
            </button>
          </div>

          {view === 'register' ? (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} dir={currentLangDir}>
              <input
                type="text" required
                placeholder={t('fullName', lang)}
                value={regForm.name}
                onChange={e => setRegForm({...regForm, name: e.target.value})}
                style={inputStyle}
              />
              <input
                type="tel" required
                placeholder={t('phone', lang)}
                value={regForm.phone}
                onChange={e => setRegForm({...regForm, phone: e.target.value})}
                style={inputStyle}
              />
              {/* WhatsApp field */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>💬</span>
                <input
                  type="tel"
                  placeholder={t('whatsapp', lang)}
                  value={regForm.whatsapp}
                  onChange={e => setRegForm({...regForm, whatsapp: e.target.value})}
                  style={{ ...inputStyle, paddingLeft: '34px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <input
                type="email" required
                placeholder={t('email', lang)}
                value={regForm.email}
                onChange={e => setRegForm({...regForm, email: e.target.value})}
                style={inputStyle}
              />
              <input
                type="password" required
                placeholder={t('password', lang)}
                value={regForm.password}
                onChange={e => setRegForm({...regForm, password: e.target.value})}
                style={inputStyle}
              />

              {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '-4px' }}>{errorMsg}</div>}

              <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '13px', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 700, border: 'none', cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: '4px', letterSpacing: '0.01em' }}>
                {isSubmitting ? t('submitting', lang) : t('submit', lang)}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} dir={currentLangDir}>
              <input type="email" required placeholder={t('email', lang)} value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} style={inputStyle} />
              <input type="password" required placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} style={inputStyle} />
              {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '-4px' }}>{errorMsg}</div>}
              <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 600, border: 'none', cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: '8px' }}>
                {isSubmitting ? 'Signing in...' : t('signIn', lang)}
              </button>
            </form>
          )}
        </div>
      )}

      <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
        <Link href="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
      </div>
    </div>
  );
}
