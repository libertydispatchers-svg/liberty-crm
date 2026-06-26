'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LogOut, Globe, CheckCircle } from 'lucide-react';

// ── Language definitions ──────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en',  label: 'English',    flag: '🇺🇸', dir: 'ltr' },
  { code: 'es',  label: 'Español',    flag: '🇪🇸', dir: 'ltr' },
  { code: 'ar',  label: 'عربي',       flag: '🇸🇦', dir: 'rtl' },
  { code: 'fr',  label: 'Français',   flag: '🇭🇹', dir: 'ltr' },
  { code: 'zh',  label: '中文',        flag: '🇨🇳', dir: 'ltr' },
  { code: 'bn',  label: 'বাংলা',       flag: '🇧🇩', dir: 'ltr' },
  { code: 'he',  label: 'עברית',      flag: '🇮🇱', dir: 'rtl' },
  { code: 'am',  label: 'አማርኛ',       flag: '🇪🇹', dir: 'ltr' },
  { code: 'yo',  label: 'Yorùbá',     flag: '🇳🇬', dir: 'ltr' },
  { code: 'ru',  label: 'Русский',    flag: '🇷🇺', dir: 'ltr' },
];

const T: Record<string, Record<string, string>> = {
  tagline: {
    en: 'Partner with Liberty Dispatchers for reliable, fast delivery solutions tailored to your business needs.',
    es: 'Asóciese con Liberty Dispatchers para soluciones de entrega rápidas y confiables adaptadas a su negocio.',
    ar: 'كن شريكاً مع شركة Liberty Dispatchers لحلول توصيل سريعة وموثوقة مصممة خصيصاً لاحتياجات عملك.',
    fr: 'Associez-vous à Liberty Dispatchers pour des solutions de livraison fiables et rapides.',
    zh: '与 Liberty Dispatchers 合作，为您提供可靠、快速的业务定制交付解决方案。',
    bn: 'আপনার ব্যবসার প্রয়োজনে নির্ভরযোগ্য, দ্রুত ডেলিভারি সমাধানের জন্য লিবার্টি ডিসপ্যাচারদের সাথে অংশীদারি করুন।',
    he: 'שתף פעולה עם Liberty Dispatchers לפתרונות משלוח אמינים ומהירים המותאמים לצרכי העסק שלך.',
    am: 'ለንግድ ፍላጎቶችዎ ብጁ የሆነ አስተማማኝ እና ፈጣን የመላኪያ መፍትሄዎችን ለማግኘት ከሊበርቲ ላኪዎች ጋር አጋር ይሁኑ።',
    yo: 'Ṣe ajọṣepọ pẹlu Liberty Dispatchers fun igbẹkẹle, awọn solusan ifijiṣẹ yara ti a ṣe apẹrẹ fun awọn iwulo iṣowo rẹ.',
    ru: 'Сотрудничайте с Liberty Dispatchers для надежных и быстрых решений по доставке, адаптированных к потребностям вашего бизнеса.',
  },
  applyBtn: {
    en: 'Sign Up as Vendor', es: 'Registrarse como Vendedor', ar: 'التسجيل كبائع', fr: 'S\'inscrire comme Vendeur',
    zh: '注册为供应商', bn: 'ভেন্ডর হিসেবে সাইন আপ করুন', he: 'הירשם כספק', am: 'እንደ አቅራቢ ይመዝገቡ', yo: 'Forukọsilẹ bi Olutaja', ru: 'Зарегистрироваться как продавец',
  },
  businessName: {
    en: 'Business Name', es: 'Nombre de la Empresa', ar: 'اسم العمل', fr: 'Nom de l\'Entreprise',
    zh: '企业名称', bn: 'ব্যবসার নাম', he: 'שם העסק', am: 'የንግድ ስም', yo: 'Orukọ Iṣowo', ru: 'Название компании',
  },
  contactName: {
    en: 'Contact Name', es: 'Nombre de Contacto', ar: 'اسم جهة الاتصال', fr: 'Nom du Contact',
    zh: '联系人姓名', bn: 'যোগাযোগের নাম', he: 'שם איש קשר', am: 'የግንኙነት ስም', yo: 'Orukọ Olubasọrọ', ru: 'Имя контактного лица',
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
  businessType: {
    en: 'Business Type', es: 'Tipo de Negocio', ar: 'نوع العمل', fr: 'Type d\'Entreprise',
    zh: '业务类型', bn: 'ব্যবসার ধরন', he: 'סוג עסק', am: 'የንግድ ዓይነት', yo: 'Iru Iṣowo', ru: 'Тип бизнеса',
  },
  submit: {
    en: 'Submit Vendor Application', es: 'Enviar Solicitud de Vendedor', ar: 'تقديم طلب البائع', fr: 'Soumettre la Demande',
    zh: '提交供应商申请', bn: 'ভেন্ডর আবেদন জমা দিন', he: 'שלח בקשת ספק', am: 'የአቅራቢ ማመልከቻ ያስገቡ', yo: 'Fi Ìbéèrè Olutaja Sí', ru: 'Отправить заявку продавца',
  },
  submitting: {
    en: 'Submitting...', es: 'Enviando...', ar: 'جارٍ التقديم...', fr: 'Soumission...',
    zh: '正在提交...', bn: 'জমা হচ্ছে...', he: 'שולח...', am: 'እያስገባ ነው...', yo: 'N fi ranṣẹ...', ru: 'Отправка...',
  },
};

function t(key: string, lang: string): string {
  return T[key]?.[lang] || T[key]?.['en'] || key;
}

export default function VendorLandingPage() {
  const [view, setView] = useState<'register' | 'success'>('register');
  const [isLoading, setIsLoading] = useState(false);

  // Language
  const [lang, setLang] = useState('en');
  const [autoLang, setAutoLang] = useState(true); // auto-cycle off when user picks manually
  const autoRef = useRef(true);

  // Auto-cycle through languages every 4 seconds when user hasn't picked one
  useEffect(() => {
    if (!autoRef.current) return;
    const cycle = LANGUAGES.map(l => l.code);
    let idx = 0;
    const interval = setInterval(() => {
      if (!autoRef.current) { clearInterval(interval); return; }
      idx = (idx + 1) % cycle.length;
      setLang(cycle[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoLang]);

  const selectLang = (code: string) => {
    autoRef.current = false;
    setAutoLang(false);
    setLang(code);
  };

  const currentLangDir = LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';

  // Register Form
  const [regForm, setRegForm] = useState({ businessName: '', contactName: '', phone: '', whatsapp: '', email: '', businessType: 'Restaurant' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      setView('success');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Language Selector Bar */}
      {view !== 'success' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          background: 'rgba(11,19,30,0.95)',
          borderBottom: '1px solid rgba(10,132,255,0.2)',
          backdropFilter: 'blur(10px)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 100,
          overflowX: 'auto',
          flexWrap: 'nowrap',
        }}>
          <Globe size={14} style={{ color: '#0a84ff', flexShrink: 0 }} />
          <span style={{ fontSize: '0.72rem', color: '#64748b', marginRight: '4px', flexShrink: 0 }}>Language:</span>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => selectLang(l.code)}
              style={{
                padding: '3px 10px',
                borderRadius: '20px',
                border: `1px solid ${lang === l.code ? '#0a84ff' : 'rgba(255,255,255,0.1)'}`,
                background: lang === l.code ? 'rgba(10,132,255,0.15)' : 'transparent',
                color: lang === l.code ? '#0a84ff' : '#94a3b8',
                fontSize: '0.72rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: lang === l.code ? 700 : 400,
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              {l.flag} {l.label}
            </button>
          ))}
          {!autoRef.current && (
            <button
              onClick={() => { autoRef.current = true; setAutoLang(a => !a); }}
              style={{ fontSize: '0.65rem', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', flexShrink: 0 }}
            >
              auto
            </button>
          )}
        </div>
      )}

      {/* Logo + tagline */}
      <div style={{ marginBottom: '2rem', textAlign: 'center', marginTop: view !== 'success' ? '56px' : '0' }}>
        <img
          src="/logo.jpg"
          alt="Liberty Dispatchers Logo"
          style={{ maxWidth: '280px', height: 'auto', objectFit: 'contain', marginBottom: '1rem' }}
        />
        {view !== 'success' && (
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

      {view === 'success' ? (
        <div style={{ width: '100%', maxWidth: '500px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: '#0a84ff', marginBottom: '16px' }}>Application Received!</h2>
            <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>Thank you for your interest in partnering with Liberty Dispatchers. A member of our team will contact you shortly to complete the onboarding process.</p>
        </div>
      ) : (
        /* ── Auth Card ── */
        <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem' }}>

          <div style={{ display: 'flex', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px' }}>
            <button style={{ flex: 1, padding: '8px', border: 'none', background: '#e30022', color: '#fff', borderRadius: '6px', fontWeight: 600, cursor: 'default', transition: 'all 0.2s' }}>
              {t('applyBtn', lang)}
            </button>
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} dir={currentLangDir}>
            <input
              type="text" required
              placeholder={t('businessName', lang)}
              value={regForm.businessName}
              onChange={e => setRegForm({...regForm, businessName: e.target.value})}
              style={inputStyle}
            />
            <input
              type="text" required
              placeholder={t('contactName', lang)}
              value={regForm.contactName}
              onChange={e => setRegForm({...regForm, contactName: e.target.value})}
              style={inputStyle}
            />
            <input
              type="email" required
              placeholder={t('email', lang)}
              value={regForm.email}
              onChange={e => setRegForm({...regForm, email: e.target.value})}
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
            
            <select
                required
                value={regForm.businessType}
                onChange={e => setRegForm({...regForm, businessType: e.target.value})}
                style={{ ...inputStyle, WebkitAppearance: 'none' }}
            >
                <option value="Restaurant">Restaurant</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Retail">Retail</option>
                <option value="Grocery">Grocery</option>
                <option value="Other">Other</option>
            </select>

            {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '-4px' }}>{errorMsg}</div>}

            <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#0a84ff', color: '#ffffff', padding: '13px', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 700, border: 'none', cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: '4px', letterSpacing: '0.01em' }}>
              {isSubmitting ? t('submitting', lang) : t('submit', lang)}
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
        <Link href="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
      </div>
    </div>
  );
}
