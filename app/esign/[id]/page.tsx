'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Check, ShieldCheck, ArrowRight, ArrowLeft, 
  Calendar, CheckCircle, AlertCircle, Info, Edit3, Trash2
} from 'lucide-react';

export default function EsignPage({ params }: { params: { id: string } }) {
  const applicantId = params.id;
  
  // Applicant details loaded from DB
  const [applicant, setApplicant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step state: 1: Onboarding, 2: W9, 3: Contract, 4: Availability
  const [step, setStep] = useState(1);

  // Step 1: Read material checkbox
  const [readMaterial, setReadMaterial] = useState(false);

  // Step 2: W9 Form
  const [w9Form, setW9Form] = useState({
    fullName: '',
    ssn: '',
    address: '',
    cityStateZip: '',
    classification: 'Individual/Sole Proprietor',
    certify: false
  });

  // Step 3: Contract Signature
  const [typedSignature, setTypedSignature] = useState('');
  const [isCanvasSigned, setIsCanvasSigned] = useState(false);

  // Step 4: Availability grid
  const [availability, setAvailability] = useState<any>({
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
  });

  // Step 1: Onboarding intake questionnaire
  const [intakeForm, setIntakeForm] = useState({
    vehicleType: 'Sedan',
    experience: '',
    shiftPreference: 'Night Hours (Overnight - higher rates)',
    payoutMethod: 'CashApp',
    payoutDetails: '',
    dailyPayoutsOk: 'Yes',
    currentApps: ''
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // Fetch applicant name and confirm they exist
  useEffect(() => {
    const fetchApplicant = async () => {
      try {
        const res = await fetch(`/api/applicants/${applicantId}`);
        if (res.ok) {
          const data = await res.json();
          setApplicant(data);
          setW9Form(prev => ({ ...prev, fullName: data.name }));
          
          // If applicant is already active, show they already completed onboarding
          if (data.status === 'ACTIVE') {
            setSubmitted(true);
          }
        } else {
          setErrorMsg('Invalid onboarding link. Please contact dispatch.');
        }
      } catch (e) {
        setErrorMsg('Failed to connect to database. Try again.');
      }
      setLoading(false);
    };
    fetchApplicant();
  }, [applicantId]);

  // Set up drawing canvas event handlers
  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
      }
    }
  }, [step]);

  // Canvas drawing logic (supports Mouse and Touch)
  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if Touch Event
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    isDrawing.current = true;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.preventDefault();
  };

  const draw = (e: any) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsCanvasSigned(true);
    e.preventDefault();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsCanvasSigned(false);
  };

  // Toggle availability shifts
  const toggleShift = (day: string, shift: string) => {
    setAvailability((prev: any) => {
      const dayShifts = prev[day] || [];
      const updated = dayShifts.includes(shift)
        ? dayShifts.filter((s: string) => s !== shift)
        : [...dayShifts, shift];
      return { ...prev, [day]: updated };
    });
  };

  // Check if current step is valid to proceed
  const isStepValid = () => {
    if (step === 1) return readMaterial && intakeForm.vehicleType && intakeForm.payoutDetails && intakeForm.shiftPreference;
    if (step === 2) return w9Form.fullName && w9Form.ssn.length >= 9 && w9Form.address && w9Form.cityStateZip && w9Form.certify;
    if (step === 3) return typedSignature.trim() && isCanvasSigned;
    return true; // availability shift count doesn't matter (can be empty if they want)
  };

  // Submit onboarding details
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/applicants/${applicantId}/esign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          w9Data: {
            ssn: w9Form.ssn,
            address: `${w9Form.address}, ${w9Form.cityStateZip}`,
            classification: w9Form.classification,
            fullName: w9Form.fullName
          },
          signature: typedSignature,
          availability: availability,
          intakeData: intakeForm
        })
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit onboarding documents.');
      }
    } catch (e) {
      alert('An error occurred during submission. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spin-anim" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', margin: '0 auto 16px auto' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Securing onboarding connection...</p>
        </div>
        <style jsx global>{`
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

  if (errorMsg) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-color)' }}>
        <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
          <AlertCircle size={40} color="var(--status-rejected)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Access Terminated or Invalid URL</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-color)' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', borderTop: '4px solid var(--status-active)' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            background: 'rgba(16,185,129,0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            color: 'var(--status-active)'
          }}>
            <ShieldCheck size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>Onboarding Complete!</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
            Thank you, <b>{applicant?.name}</b>! Your W-9, signed Driver Agreement, and availability schedule have been submitted securely and filed under your dispatcher profile.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            E-Sign ID: {applicant?.id?.toUpperCase()}-SECURE-VERIFIED
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '32px 16px', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* Container Card */}
      <div className="glass-panel" style={{ maxWidth: '640px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Portal Header */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
              <img src="/logo.png" alt="Liberty Dispatchers" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Driver Onboarding</span>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>Liberty Dispatchers</h1>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Welcome,</span>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{applicant?.name}</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
          <div style={{ borderBottom: '3px solid', borderColor: step >= 1 ? 'var(--accent-color)' : 'var(--border-color)', paddingBottom: '6px', color: step >= 1 ? 'white' : 'var(--text-muted)' }}>
            1. Role Overview
          </div>
          <div style={{ borderBottom: '3px solid', borderColor: step >= 2 ? 'var(--accent-color)' : 'var(--border-color)', paddingBottom: '6px', color: step >= 2 ? 'white' : 'var(--text-muted)' }}>
            2. W-9 Details
          </div>
          <div style={{ borderBottom: '3px solid', borderColor: step >= 3 ? 'var(--accent-color)' : 'var(--border-color)', paddingBottom: '6px', color: step >= 3 ? 'white' : 'var(--text-muted)' }}>
            3. E-Sign Contract
          </div>
          <div style={{ borderBottom: '3px solid', borderColor: step >= 4 ? 'var(--accent-color)' : 'var(--border-color)', paddingBottom: '6px', color: step >= 4 ? 'white' : 'var(--text-muted)' }}>
            4. Availability
          </div>
        </div>

        {/* STEP 1: ONBOARDING MATERIALS */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--accent-cyan)" /> Driver Role & Dispatch Overview
            </h3>

            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', fontSize: '0.88rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto' }}>
              <p>Welcome to <b>Liberty Dispatchers</b>, the official delivery platform for our network of local flower and smoke shop storefronts.</p>
              
              <b style={{ color: '#fff' }}>1. How Delivery Operations Work:</b>
              <p>Orders are routed through our central dispatcher panel. Drivers receive order details (pickup storefront, delivery address, order contents, and special drop-off instructions) via SMS and on the driver application.</p>
              
              <b style={{ color: '#fff' }}>2. Pay Structure & Tips:</b>
              <p>Drivers earn a base delivery commission fee per order, plus 100% of customer tips. Payouts are compiled weekly and transferred via direct deposit.</p>

              <b style={{ color: '#fff' }}>3. Professional Requirements:</b>
              <ul>
                <li>Must maintain a valid driver's license and up-to-date auto insurance.</li>
                <li>Operate a clean, smoke-free, reliable personal vehicle.</li>
                <li>Verify age (21+) via government ID on deliveries containing restricted products.</li>
                <li>Maintain a polite, helpful attitude with storefront staff and customers.</li>
              </ul>
            </div>

            {/* Questionnaire fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '8px' }}>Driver Intake Questionnaire</h4>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Type of Vehicle</label>
                <select 
                  className="input-field"
                  value={intakeForm.vehicleType}
                  onChange={(e) => setIntakeForm({ ...intakeForm, vehicleType: e.target.value })}
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Truck">Truck</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Shift Preference (Note: Overnight pays more!)</label>
                <select 
                  className="input-field"
                  value={intakeForm.shiftPreference}
                  onChange={(e) => setIntakeForm({ ...intakeForm, shiftPreference: e.target.value })}
                >
                  <option value="Night Hours (Overnight - higher rates)">Night Hours (Overnight - higher rates)</option>
                  <option value="Day Hours">Day Hours</option>
                  <option value="Any Hours / Flexible">Any Hours / Flexible</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Payout Option</label>
                <select 
                  className="input-field"
                  value={intakeForm.payoutMethod}
                  onChange={(e) => setIntakeForm({ ...intakeForm, payoutMethod: e.target.value })}
                >
                  <option value="CashApp">CashApp</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Chime">Chime</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Payout Account Info (username/phone/email)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={intakeForm.payoutDetails}
                  onChange={(e) => setIntakeForm({ ...intakeForm, payoutDetails: e.target.value })}
                  placeholder="e.g. $cashapptag or phone number"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>OK with Daily Payouts?</label>
                <select 
                  className="input-field"
                  value={intakeForm.dailyPayoutsOk}
                  onChange={(e) => setIntakeForm({ ...intakeForm, dailyPayoutsOk: e.target.value })}
                >
                  <option value="Yes">Yes, prefer daily payouts</option>
                  <option value="No">No, prefer weekly payouts</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Current Apps You Drive For</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={intakeForm.currentApps}
                  onChange={(e) => setIntakeForm({ ...intakeForm, currentApps: e.target.value })}
                  placeholder="e.g. Uber, DoorDash, none"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Driving History / Experience Notes</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  value={intakeForm.experience}
                  onChange={(e) => setIntakeForm({ ...intakeForm, experience: e.target.value })}
                  placeholder="Tell us briefly about your driving or delivery experience..."
                  style={{ resize: 'vertical', minHeight: '40px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--control-border)', borderRadius: '6px', width: '100%', padding: '8px', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              background: 'rgba(255,255,255,0.01)', 
              border: '1px solid var(--border-color)', 
              padding: '12px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}>
              <input 
                type="checkbox" 
                checked={readMaterial} 
                onChange={(e) => setReadMaterial(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-color)' }}
              />
              <span>I have read the onboarding overview and confirm I meet the requirements.</span>
            </label>
          </div>
        )}

        {/* STEP 2: W-9 DETAILS */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent-cyan)" /> W-9 Tax Classification Form
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Full Taxpayer Name (as shown on income tax return)
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={w9Form.fullName}
                  onChange={(e) => setW9Form({ ...w9Form, fullName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Federal Tax Classification
                </label>
                <select 
                  className="input-field"
                  value={w9Form.classification}
                  onChange={(e) => setW9Form({ ...w9Form, classification: e.target.value })}
                >
                  <option value="Individual/Sole Proprietor">Individual/Sole Proprietor or Single-member LLC</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LLC-C Corp">Limited Liability Company (C Corp classification)</option>
                  <option value="LLC-S Corp">Limited Liability Company (S Corp classification)</option>
                  <option value="Corporation">Corporation (C or S Corp)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Social Security Number (SSN) or EIN
                  </label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={w9Form.ssn}
                    onChange={(e) => setW9Form({ ...w9Form, ssn: e.target.value.replace(/\D/g, '') })}
                    placeholder="Enter SSN without dashes"
                    maxLength={9}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    9-digit number. Encrypted and masked on submit.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Street Address
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={w9Form.address}
                    onChange={(e) => setW9Form({ ...w9Form, address: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  City, State, and ZIP Code
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={w9Form.cityStateZip}
                  onChange={(e) => setW9Form({ ...w9Form, cityStateZip: e.target.value })}
                  placeholder="Baltimore, MD 21201"
                />
              </div>

              <label style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px', 
                background: 'rgba(255,255,255,0.01)', 
                border: '1px solid var(--border-color)', 
                padding: '12px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '0.8rem',
                marginTop: '6px'
              }}>
                <input 
                  type="checkbox" 
                  checked={w9Form.certify} 
                  onChange={(e) => setW9Form({ ...w9Form, certify: e.target.checked })}
                  style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: 'var(--accent-color)' }}
                />
                <span style={{ lineHeight: '1.4' }}>
                  Under penalties of perjury, I certify that: (1) The number shown on this form is my correct taxpayer identification number, and (2) I am not subject to backup withholding.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: CONTRACT E-SIGN */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent-cyan)" /> Independent Contractor Agreement
            </h3>

            {/* Scrollable Agreement Contract */}
            <div style={{ 
              background: 'rgba(0,0,0,0.15)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '16px', 
              fontSize: '0.85rem', 
              lineHeight: '1.6', 
              maxHeight: '220px', 
              overflowY: 'auto',
              color: 'var(--text-secondary)'
            }}>
              <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '0.9rem' }}>DELIVERY DRIVER CONTRACTOR AGREEMENT</h4>
              <p>This Delivery Driver Contractor Agreement (the "Agreement") is entered into by and between Liberty Dispatchers ("Company") and the Applicant ("Contractor").</p>
              
              <b style={{ color: '#fff', display: 'block', marginTop: '8px' }}>1. Services:</b>
              <p>Contractor agrees to perform logistics and delivery services for storefront orders. Contractor retains sole discretion over working hours, route choices, and accepting or declining dispatch offers.</p>
              
              <b style={{ color: '#fff', display: 'block', marginTop: '8px' }}>2. Relationship:</b>
              <p>Contractor is an independent contractor. Nothing in this Agreement shall construct an employer-employee relationship. Contractor is solely responsible for personal tax withholdings, auto expenses, and equipment maintenance.</p>

              <b style={{ color: '#fff', display: 'block', marginTop: '8px' }}>3. Liability & Insurance:</b>
              <p>Contractor agrees to maintain valid auto liability insurance matching or exceeding Maryland state minimums. Contractor assumes liability for vehicle operations during pickups and deliveries.</p>
              
              <b style={{ color: '#fff', display: 'block', marginTop: '8px' }}>4. Restricted Goods:</b>
              <p>Contractor agrees to verify state IDs and ensure customers are of legal age (21+) for deliveries requiring identification. Deliveries must never be released to minors.</p>
            </div>

            {/* Signature Draw Canvas */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Draw your signature on the pad:
              </label>
              <div style={{ position: 'relative', width: '100%', height: '120px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--control-border)', borderRadius: '8px' }}>
                <canvas 
                  ref={canvasRef}
                  width={560}
                  height={120}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
                />
                <button 
                  type="button" 
                  onClick={clearCanvas}
                  className="button"
                  style={{ 
                    position: 'absolute', 
                    right: '8px', 
                    bottom: '8px', 
                    height: '24px', 
                    padding: '0 8px', 
                    fontSize: '0.65rem', 
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                    color: 'var(--status-rejected)'
                  }}
                >
                  <Trash2 size={10} style={{ marginRight: '2px' }} /> Clear
                </button>
              </div>
            </div>

            {/* Typed Signature Verification */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Type your name to sign (acts as electronic signature approval):
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Type Full Legal Name"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>
        )}

        {/* STEP 4: AVAILABILITY HOURS */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--accent-cyan)" /> Weekly Availability Schedule
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click blocks to toggle shifts</span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Select the shifts when you are available to accept delivery routes. Your schedule will be synced with dispatcher calendar templates.
            </p>

            {/* Weekly Schedule Grid */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', background: 'rgba(0,0,0,0.15)' }}>
              
              {/* Table headers */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '90px 1fr 1fr 1fr', 
                gap: '8px', 
                textAlign: 'center', 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                color: 'var(--text-secondary)', 
                borderBottom: '1px solid var(--border-color)', 
                paddingBottom: '8px', 
                marginBottom: '12px' 
              }}>
                <div style={{ textAlign: 'left' }}>Day of Week</div>
                <div>Morning<br /><span style={{ fontSize: '0.6rem', fontWeight: 400, opacity: 0.7 }}>9am - 1pm</span></div>
                <div>Afternoon<br /><span style={{ fontSize: '0.6rem', fontWeight: 400, opacity: 0.7 }}>1pm - 5pm</span></div>
                <div>Evening<br /><span style={{ fontSize: '0.6rem', fontWeight: 400, opacity: 0.7 }}>5pm - 9pm</span></div>
              </div>

              {/* Grid Rows */}
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                const dayShifts = availability[day] || [];
                return (
                  <div key={day} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '90px 1fr 1fr 1fr', 
                    gap: '8px', 
                    padding: '6px 0', 
                    alignItems: 'center' 
                  }}>
                    <div style={{ textAlign: 'left', fontSize: '0.8rem', fontWeight: 500, textTransform: 'capitalize', color: 'white' }}>
                      {day}
                    </div>
                    
                    <button 
                      onClick={() => toggleShift(day, 'morning')}
                      className={`availability-cell ${dayShifts.includes('morning') ? 'active' : ''}`}
                      style={{ 
                        border: '1px solid',
                        background: dayShifts.includes('morning') ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.01)',
                        borderColor: dayShifts.includes('morning') ? 'var(--status-active)' : 'var(--glass-border)',
                        color: dayShifts.includes('morning') ? 'white' : 'var(--text-muted)',
                        padding: '8px 0',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: dayShifts.includes('morning') ? 600 : 400
                      }}
                    >
                      {dayShifts.includes('morning') ? 'Available' : 'Closed'}
                    </button>

                    <button 
                      onClick={() => toggleShift(day, 'afternoon')}
                      className={`availability-cell ${dayShifts.includes('afternoon') ? 'active' : ''}`}
                      style={{ 
                        border: '1px solid',
                        background: dayShifts.includes('afternoon') ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.01)',
                        borderColor: dayShifts.includes('afternoon') ? 'var(--status-active)' : 'var(--glass-border)',
                        color: dayShifts.includes('afternoon') ? 'white' : 'var(--text-muted)',
                        padding: '8px 0',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: dayShifts.includes('afternoon') ? 600 : 400
                      }}
                    >
                      {dayShifts.includes('afternoon') ? 'Available' : 'Closed'}
                    </button>

                    <button 
                      onClick={() => toggleShift(day, 'evening')}
                      className={`availability-cell ${dayShifts.includes('evening') ? 'active' : ''}`}
                      style={{ 
                        border: '1px solid',
                        background: dayShifts.includes('evening') ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.01)',
                        borderColor: dayShifts.includes('evening') ? 'var(--status-active)' : 'var(--glass-border)',
                        color: dayShifts.includes('evening') ? 'white' : 'var(--text-muted)',
                        padding: '8px 0',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: dayShifts.includes('evening') ? 600 : 400
                      }}
                    >
                      {dayShifts.includes('evening') ? 'Available' : 'Closed'}
                    </button>
                  </div>
                );
              })}

            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="button">
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button 
              onClick={() => setStep(step + 1)} 
              disabled={!isStepValid()}
              className="button highlight"
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="button highlight" 
              style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                borderColor: 'transparent'
              }}
            >
              {submitting ? 'Submitting Forms...' : 'Complete Onboarding & E-Sign'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
