'use client';

import React, { useEffect, useState } from 'react';
import { CsdPage, useDashboardAuth } from '@components/dashboard/DashboardUI';
import { getCase } from '@/lib/dashboardData';

interface AddressForm {
  international: 'yes' | 'no' | '';
  line1: string;
  line2: string;
  city: string;
  state: string;
  county: string;
  zip: string;
  country: string;
}
interface EmployerForm {
  name: string;
  phone: string;
  occupation: string;
  startDate: string;
  endDate: string;
}
interface ContactForm {
  textNotification: 'yes' | 'no' | '';
  emailNotification: 'yes' | 'no' | '';
  cellPhone: string;
  homePhone: string;
  businessPhone: string;
  email: string;
}

const EMPTY_ADDRESS: AddressForm = { international: 'no', line1: '', line2: '', city: '', state: '', county: '', zip: '', country: 'United States of America' };
const EMPTY_EMPLOYER: EmployerForm = { name: '', phone: '', occupation: '', startDate: '', endDate: '' };
const EMPTY_CONTACT: ContactForm = { textNotification: '', emailNotification: '', cellPhone: '', homePhone: '', businessPhone: '', email: '' };

interface CaseInfoState {
  residential: AddressForm;
  mailing: AddressForm;
  mailingSameAsResidential: boolean;
  employer: EmployerForm;
  contact: ContactForm;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="csd-field">
      <span className="csd-field-label">
        {label}
        {required && <span className="csd-req"> *</span>}
      </span>
      {children}
    </label>
  );
}

function YesNo({ name, value, onChange }: { name: string; value: string; onChange: (v: 'yes' | 'no') => void }) {
  return (
    <span className="csd-yesno">
      <label>
        <input type="radio" name={name} checked={value === 'yes'} onChange={() => onChange('yes')} /> Yes
      </label>
      <label>
        <input type="radio" name={name} checked={value === 'no'} onChange={() => onChange('no')} /> No
      </label>
    </span>
  );
}

function AddressFields({
  value,
  onChange,
  namePrefix,
}: {
  value: AddressForm;
  onChange: (patch: Partial<AddressForm>) => void;
  namePrefix: string;
}) {
  return (
    <>
      <Field label="International Address?">
        <YesNo name={`${namePrefix}-intl`} value={value.international} onChange={(v) => onChange({ international: v })} />
      </Field>
      <div className="csd-field-grid">
        <Field label="Address Line 1" required>
          <input className="csd-input" value={value.line1} onChange={(e) => onChange({ line1: e.target.value })} />
        </Field>
        <Field label="Address Line 2">
          <input className="csd-input" value={value.line2} onChange={(e) => onChange({ line2: e.target.value })} />
        </Field>
        <Field label="City" required>
          <input className="csd-input" value={value.city} onChange={(e) => onChange({ city: e.target.value })} />
        </Field>
        <Field label="State" required>
          <input className="csd-input" value={value.state} onChange={(e) => onChange({ state: e.target.value })} />
        </Field>
        <Field label="County" required>
          <input className="csd-input" value={value.county} onChange={(e) => onChange({ county: e.target.value })} />
        </Field>
        <Field label="Zip Code" required>
          <input className="csd-input" value={value.zip} onChange={(e) => onChange({ zip: e.target.value })} />
        </Field>
        <Field label="Country" required>
          <input className="csd-input" value={value.country} onChange={(e) => onChange({ country: e.target.value })} />
        </Field>
      </div>
    </>
  );
}

export default function UpdateCasePage({ caseId }: { caseId: string }) {
  const { ready, user } = useDashboardAuth();
  const storageKey = `ccap_case_info_${caseId}`;

  const [state, setState] = useState<CaseInfoState>({
    residential: EMPTY_ADDRESS,
    mailing: EMPTY_ADDRESS,
    mailingSameAsResidential: false,
    employer: EMPTY_EMPLOYER,
    contact: EMPTY_CONTACT,
  });
  const [savedSection, setSavedSection] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setState((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, [ready, storageKey]);

  if (!ready || !user) return null;
  const c = getCase(caseId);

  const persist = (next: CaseInfoState, section: string) => {
    setState(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setSavedSection(section);
    window.setTimeout(() => setSavedSection((s) => (s === section ? null : s)), 2500);
  };

  return (
    <CsdPage title={c?.title ?? 'Update case information'} back={{ href: `/parent/cases/${caseId}`, label: 'Go back' }}>
      <p className="csd-subtitle">
        Welcome, {user.first_name} {user.last_name}. Updating your information here also updates your CSMS record.
      </p>

      {/* Address */}
      <section className="csd-formcard">
        <h2 className="csd-formcard-title">Address</h2>

        <h3 className="csd-formcard-sub">Residential Address</h3>
        <AddressFields
          namePrefix="res"
          value={state.residential}
          onChange={(patch) => setState((p) => ({ ...p, residential: { ...p.residential, ...patch } }))}
        />

        <h3 className="csd-formcard-sub">Mailing Address</h3>
        <label className="csd-check">
          <input
            type="checkbox"
            checked={state.mailingSameAsResidential}
            onChange={(e) =>
              setState((p) => ({
                ...p,
                mailingSameAsResidential: e.target.checked,
                mailing: e.target.checked ? p.residential : p.mailing,
              }))
            }
          />
          Same as Residential Address
        </label>
        {!state.mailingSameAsResidential && (
          <AddressFields
            namePrefix="mail"
            value={state.mailing}
            onChange={(patch) => setState((p) => ({ ...p, mailing: { ...p.mailing, ...patch } }))}
          />
        )}

        <div className="csd-formcard-actions">
          {savedSection === 'address' && <span className="csd-saved">Saved</span>}
          <button type="button" className="gov-btn gov-btn-primary gov-btn-sm" onClick={() => persist(state, 'address')}>
            Update
          </button>
        </div>
      </section>

      {/* Employer */}
      <section className="csd-formcard">
        <h2 className="csd-formcard-title">Employer Information</h2>
        <div className="csd-field-grid">
          <Field label="Employer Name">
            <input className="csd-input" value={state.employer.name} onChange={(e) => setState((p) => ({ ...p, employer: { ...p.employer, name: e.target.value } }))} />
          </Field>
          <Field label="Phone">
            <input className="csd-input" value={state.employer.phone} onChange={(e) => setState((p) => ({ ...p, employer: { ...p.employer, phone: e.target.value } }))} />
          </Field>
          <Field label="Occupation">
            <input className="csd-input" value={state.employer.occupation} onChange={(e) => setState((p) => ({ ...p, employer: { ...p.employer, occupation: e.target.value } }))} />
          </Field>
          <Field label="Start Date">
            <input type="date" className="csd-input" value={state.employer.startDate} onChange={(e) => setState((p) => ({ ...p, employer: { ...p.employer, startDate: e.target.value } }))} />
          </Field>
          <Field label="End Date">
            <input type="date" className="csd-input" value={state.employer.endDate} onChange={(e) => setState((p) => ({ ...p, employer: { ...p.employer, endDate: e.target.value } }))} />
          </Field>
        </div>
        <div className="csd-formcard-actions">
          {savedSection === 'employer' && <span className="csd-saved">Saved</span>}
          <button type="button" className="gov-btn gov-btn-primary gov-btn-sm" onClick={() => persist(state, 'employer')}>
            Update
          </button>
        </div>
      </section>

      {/* Contact */}
      <section className="csd-formcard">
        <h2 className="csd-formcard-title">Contact Information</h2>
        <div className="csd-field-grid">
          <Field label="Text Notification">
            <YesNo name="text-notif" value={state.contact.textNotification} onChange={(v) => setState((p) => ({ ...p, contact: { ...p.contact, textNotification: v } }))} />
          </Field>
          <Field label="Email Notification">
            <YesNo name="email-notif" value={state.contact.emailNotification} onChange={(v) => setState((p) => ({ ...p, contact: { ...p.contact, emailNotification: v } }))} />
          </Field>
          <Field label="Cell Phone">
            <input className="csd-input" value={state.contact.cellPhone} onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, cellPhone: e.target.value } }))} />
          </Field>
          <Field label="Home Phone">
            <input className="csd-input" value={state.contact.homePhone} onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, homePhone: e.target.value } }))} />
          </Field>
          <Field label="Business Phone">
            <input className="csd-input" value={state.contact.businessPhone} onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, businessPhone: e.target.value } }))} />
          </Field>
          <Field label="Email">
            <input type="email" className="csd-input" value={state.contact.email} onChange={(e) => setState((p) => ({ ...p, contact: { ...p.contact, email: e.target.value } }))} />
          </Field>
        </div>
        <div className="csd-formcard-actions">
          {savedSection === 'contact' && <span className="csd-saved">Saved</span>}
          <button type="button" className="gov-btn gov-btn-primary gov-btn-sm" onClick={() => persist(state, 'contact')}>
            Update
          </button>
        </div>
      </section>
    </CsdPage>
  );
}
