'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
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
                fontSize: '0.95rem',
              }}
            >
              Back to Sign Up
            </a>
          </>
        ) : (
          <>
            <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '8px' }}>
              We sent a confirmation link to your email address.
            </p>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '32px' }}>
              Click <strong style={{ color: '#0a84ff' }}>"Verify My Email & Start Onboarding"</strong> in that email to continue. Check your spam folder if you don't see it within a minute.
            </p>

            {/* Steps */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '28px',
            }}>
              {[
                { num: '1', text: 'Open your email inbox' },
                { num: '2', text: 'Find the email from apply@libertydispatch.xyz' },
                { num: '3', text: 'Click "Verify My Email & Start Onboarding"' },
                { num: '4', text: "You'll be taken straight to your application" },
              ].map(step => (
                <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0a84ff, #e30022)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    flexShrink: 0,
                    color: '#fff',
                  }}>
                    {step.num}
                  </div>
                  <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>{step.text}</span>
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
