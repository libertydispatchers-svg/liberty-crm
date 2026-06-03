import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | Liberty Dispatchers',
  description: 'Terms and Conditions and SMS Terms of Service for Liberty Dispatchers.',
};

export default function TermsAndConditions() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#1e293b',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.6',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #e2e8f0',
        padding: '1.25rem 2rem',
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
            🦅 LIBERTY DISPATCHERS
          </span>
        </div>
        <Link href="/" style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#2563eb',
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          backgroundColor: '#f1f5f9',
          transition: 'all 0.2s',
        }}>
          Back to System
        </Link>
      </header>

      {/* Hero Header */}
      <div style={{
        padding: '3rem 2rem 2rem 2rem',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: '0.5rem',
          letterSpacing: '-0.025em',
        }}>
          Terms &amp; Conditions
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          Last Updated: June 2, 2026
        </p>
      </div>

      {/* Content */}
      <main style={{
        padding: '0 2rem 5rem 2rem',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <section style={{ marginBottom: '2rem' }}>
          <p>
            Welcome to Liberty Dispatchers. Please read these Terms &amp; Conditions carefully before submitting your driver application, onboarding, or using our driver dispatch and communication portals. By applying or utilizing our services, you agree to be bound by these terms.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            1. Scope of Agreement
          </h2>
          <p>
            These Terms &amp; Conditions govern the relationship between Liberty Dispatchers ("we", "our", or "us") and independent driver applicants, onboarded drivers, dispatch staff, and contractors. Our platforms facilitate recruitment, credential collection (W-9, driver licenses), shift scheduling, and messaging notifications.
          </p>
        </section>

        {/* SMS COMPLIANCE SECTION */}
        <section style={{
          marginBottom: '2.5rem',
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          borderLeft: '4px solid #2563eb',
          borderRadius: '0.375rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            2. SMS Terms of Service &amp; Consent
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            By submitting an application or participating in our onboarding program, you explicitly agree to our SMS communication terms. 
          </p>
          <p style={{
            fontWeight: '600',
            color: '#0f172a',
            backgroundColor: '#ffffff',
            padding: '1rem',
            border: '1px dashed #cbd5e1',
            borderRadius: '0.25rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            marginBottom: '1rem',
          }}>
            "By providing your phone number, you agree to receive automated security, update, or notification text messages from Liberty Dispatchers. Message and data rates may apply. Message frequency varies. Reply STOP to opt-out, HELP for support. Carriers are not liable for delayed or undelivered messages."
          </p>
          <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
            <li><strong>Opt-Out:</strong> You can opt-out of text alerts at any time by replying <strong>STOP</strong> to any text message received. You will receive one final confirmation message.</li>
            <li><strong>Support:</strong> You can reply <strong>HELP</strong> to request information, or contact our dispatch team at the information below.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            3. Driver Status and Independent Contractor Disclaimer
          </h2>
          <p>
            Drivers cooperating with Liberty Dispatchers are independent contractors and not employees. Nothing in our onboarding platform or communication channels creates an employer-employee relationship. As an independent contractor, you retain control over your shifts, vehicle maintenance, and route execution, subject to customer service guidelines.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            4. Compliance and Intake Forms
          </h2>
          <p>
            You certify that all details provided in your intake forms, availability schedules, and tax forms (W-9) are true, accurate, and complete. Falsification of documents or credential information will lead to immediate deactivation from the platform.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            5. Limitation of Liability
          </h2>
          <p>
            Liberty Dispatchers shall not be liable for any indirect, incidental, or consequential damages resulting from platform downtime, communication delays, or delivery routing errors. Carriers are not liable for delayed or undelivered messages.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            6. Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these Terms &amp; Conditions at any time. Changes will be posted to this page and the date above will be updated. Your continued engagement with our recruitment or dispatch services after modifications are published constitutes agreement to the updated terms.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            7. Contact Support
          </h2>
          <p>
            For help, questions, or updates to your communication preferences, contact us:
          </p>
          <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>
            Liberty Dispatchers Support<br />
            Email: <a href="mailto:apply@libertydispatch.xyz" style={{ color: '#2563eb', textDecoration: 'none' }}>apply@libertydispatch.xyz</a><br />
            Alternate: <a href="mailto:libertydispatchers@gmail.com" style={{ color: '#2563eb', textDecoration: 'none' }}>libertydispatchers@gmail.com</a>
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        padding: '2rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#64748b',
        backgroundColor: '#f8fafc',
      }}>
        © {new Date().getFullYear()} Liberty Dispatchers. All rights reserved.
      </footer>
    </div>
  );
}
