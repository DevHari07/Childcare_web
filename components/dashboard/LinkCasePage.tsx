'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CsdPage, useDashboardAuth } from '@components/dashboard/DashboardUI';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatSsn(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

export default function LinkCasePage() {
  const router = useRouter();
  const { ready, user } = useDashboardAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [ssn, setSsn] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!ready || !user) return null;

  const ssnDigits = ssn.replace(/\D/g, '');
  const valid =
    firstName.trim() &&
    lastName.trim() &&
    gender &&
    month &&
    day.trim() &&
    year.trim().length === 4 &&
    ssnDigits.length === 9;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid) setSubmitted(true);
  };

  if (submitted) {
    return (
      <CsdPage title="Link a case" back={{ href: '/parent/dashboard', label: 'Go back' }}>
        <div className="csd-formcard csd-linkform csd-link-success">
          <span className="csd-link-success-icon">
            <CheckCircle2 size={26} strokeWidth={2} />
          </span>
          <h2 className="csd-formcard-title" style={{ border: 'none', paddingBottom: 0, marginBottom: 6 }}>
            Details submitted
          </h2>
          <p className="csd-subtitle" style={{ marginBottom: 20 }}>
            Thanks, {firstName}. We&apos;re matching your information against open child support cases. Any case we find will
            appear under <strong>Cases</strong> on your dashboard, usually within one business day.
          </p>
          <button type="button" className="gov-btn gov-btn-primary" onClick={() => router.push('/parent/dashboard')}>
            Back to dashboard
          </button>
        </div>
      </CsdPage>
    );
  }

  return (
    <CsdPage title="Link a case" back={{ href: '/parent/dashboard', label: 'Go back' }}>
      <div className="csd-linkform">
        <div className="csd-form-note">
          <Link2 size={18} strokeWidth={2} />
          <p>
            Already have a case with North Dakota Child Support? Enter your details exactly as they appear on your
            government ID and we&apos;ll connect it to your account.
          </p>
        </div>

        <form className="csd-formcard" onSubmit={submit}>
          <div className="csd-field-grid">
            <label className="csd-field">
              <span className="csd-field-label">
                First name <span className="csd-req">*</span>
              </span>
              <input className="csd-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
              <span className="csd-field-hint">As written on your ID (passport, driver&apos;s license).</span>
            </label>

            <label className="csd-field">
              <span className="csd-field-label">
                Last name <span className="csd-req">*</span>
              </span>
              <input className="csd-input" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
              <span className="csd-field-hint">As written on your ID (passport, driver&apos;s license).</span>
            </label>
          </div>

          <label className="csd-field">
            <span className="csd-field-label">
              Gender <span className="csd-req">*</span>
            </span>
            <select className="csd-input" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select an option</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other / prefer not to say</option>
            </select>
          </label>

          <div className="csd-field">
            <span className="csd-field-label">
              Date of birth <span className="csd-req">*</span>
            </span>
            <div className="csd-dob">
              <select className="csd-input" aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="">Month</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                className="csd-input csd-input-narrow"
                aria-label="Day"
                placeholder="Day"
                inputMode="numeric"
                value={day}
                onChange={(e) => setDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
              />
              <input
                className="csd-input csd-input-narrow"
                aria-label="Year"
                placeholder="Year"
                inputMode="numeric"
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
            <span className="csd-field-hint">For example: January 19 2000</span>
          </div>

          <label className="csd-field">
            <span className="csd-field-label">
              Social Security Number <span className="csd-req">*</span>
            </span>
            <input
              className="csd-input"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000-00-0000"
              value={ssn}
              onChange={(e) => setSsn(formatSsn(e.target.value))}
            />
          </label>

          <div className="csd-form-actions">
            <span className="csd-form-secure">
              <ShieldCheck size={14} strokeWidth={2} />
              Encrypted and used only to match your case
            </span>
            <button type="submit" className="gov-btn gov-btn-primary" disabled={!valid}>
              Link case
            </button>
          </div>
        </form>
      </div>
    </CsdPage>
  );
}
