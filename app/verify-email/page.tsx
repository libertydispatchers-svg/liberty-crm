'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Determine display mode
  const isError = !!error;

  const errorMessages: Record<string, string> = {
    invalid: 'This verification link is invalid or has already been used.',
    notfound: 'We could not find an account for this link.',
    server: 'Something went wrong on our end. Please try again.',
  };
  const errorMsg = error ? (errorMessages[error] || 'An unknown error occurred.') : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b131e 0%, #1a2332 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      color: '#f8fafc',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid #0a84ff55',
        borderRadius: '16px',
        padding: '48px 40px',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        {/* Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: isError ? 'rgba(239,68,68,0.15)' : 'rgba(215,181,95,0.15)',
          border: `2px solid ${isError ? '#ef4444' : '#0a84ff'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          {isError
            ? <AlertCircle size={36} color="#ef4444" />
            : <Mail size={36} color="#0a84ff" />
          }
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 12px', color: '#ffffff' }}>
          {isError ? 'Link Problem' : 'Check Your Email'}
        </h1>

        {/* Body */}
        {isError ? (
          <>
            <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '28px' }}>
              {errorMsg}
            </p>
            <a
              href="/"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #0a84ff 0%, #e30022 100%)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: '0 8px 16px rgba(10, 132, 255, 0.3)',
              }}
            >
              Return to Website
            </a>
          </>
        ) : (
          <>
            <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '32px' }}>
              We've just sent a secure magic link to your email address. 
              Please click the link inside to verify your account and continue.
            </p>
            
            {/* Checklist */}
            <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
              {[
                "Check your spam or junk folder.",
                "Make sure you entered the correct email.",
                "The link will expire in 2 hours."
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: i === 2 ? 0 : '16px' }}>
                  <CheckCircle size={18} color="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>{text}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Wrong email?{' '}
              <a href="/" style={{ color: '#0a84ff', textDecoration: 'none', fontWeight: 600 }}>
                Go back and re-register
              </a>
            </p>
          </>
        )}

        {/* Branding */}
        <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>
            Liberty Dispatchers · apply@libertydispatch.xyz
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
