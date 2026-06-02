import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Liberty Dispatchers',
  description: 'Privacy Policy and SMS compliance terms for Liberty Dispatchers.',
};

export default function PrivacyPolicy() {
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
          {/* Simple clean Eagle Logo mock */}
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
          Privacy Policy
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
            At Liberty Dispatchers, we respect your privacy and are committed to protecting the personal data of our prospective drivers, independent contractors, dispatchers, and clients. This Privacy Policy describes how we collect, use, and share information in connection with our driver CRM system, dispatch tools, and SMS communication platforms.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly to us when applying to drive with us, completing onboarding documents, signing agreements, or using our platform. This includes:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Contact Information:</strong> Name, email address, physical address, and telephone number.</li>
            <li><strong>Onboarding & Professional Details:</strong> Vehicle type, driver's license details, experience level, availability, shift preferences, payout configurations (e.g. CashApp, bank routing details), and W-9 information.</li>
            <li><strong>Communications:</strong> Call logs, emails, SMS messages, and notes exchanged during recruitment and dispatch operations.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            2. How We Use Your Information
          </h2>
          <p>
            We use the information we collect to operate, maintain, and improve our services, including:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Verifying driver applicant credentials and eligibility.</li>
            <li>Onboarding independent contractors (W-9 compliance, contract signatures).</li>
            <li>Coordinating delivery dispatches and shifts.</li>
            <li>Sending notification texts, SMS confirmations, and system updates.</li>
            <li>Processing payouts.</li>
          </ul>
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
            3. SMS Opt-In and Privacy Compliance
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            When you provide your phone number to Liberty Dispatchers, you consent to receive SMS notifications relating to your driver application status, onboarding documentation requirements, and delivery shifts.
          </p>
          <p style={{
            fontWeight: '600',
            color: '#0f172a',
            backgroundColor: '#ffffff',
            padding: '1rem',
            border: '1px dashed #cbd5e1',
            borderRadius: '0.25rem',
            fontSize: '1rem',
          }}>
            "All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with third parties or affiliates for marketing or promotional purposes."
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            4. Sharing of Information
          </h2>
          <p>
            We do not sell, rent, or trade your personal information to third parties. We may share information with third-party service providers (like database hosting, Google Workspace, and communication gateways) solely to perform services on our behalf, under strict confidentiality terms. We may disclose your information if required to do so by law or in response to valid requests by public authorities.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            5. Data Security
          </h2>
          <p>
            We implement standard organizational and technical security measures (including secure database storage and HTTPS/TLS encryption) to protect your personal information from unauthorized access, loss, or alteration.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            6. Contact Us
          </h2>
          <p>
            If you have any questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>
            Liberty Dispatchers Recruiting<br />
            Email: <a href="mailto:libertydispatchers@gmail.com" style={{ color: '#2563eb', textDecoration: 'none' }}>libertydispatchers@gmail.com</a>
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
