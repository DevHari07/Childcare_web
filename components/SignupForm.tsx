'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUser } from '@/lib/authApi';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('parent');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole === 'provider' || urlRole === 'parent') {
      setRole(urlRole);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName.trim()) {
      setError(t('signup.errFirstName'));
      return;
    }
    if (!lastName.trim()) {
      setError(t('signup.errLastName'));
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError(t('signup.errEmail'));
      return;
    }
    if (!agreeToTerms) {
      setError(t('signup.errTerms'));
      return;
    }

    setLoading(true);
    try {
      await createUser({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), role });
      setSuccess(
        'Account created. We have emailed a temporary password to ' +
          email.trim() +
          '. Use it to sign in, then you will be asked to set a permanent password.'
      );
      setTimeout(() => {
        router.push('/login');
      }, 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signup.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-sso-wrapper relative-container">
      <video autoPlay loop muted playsInline className="signup-bg-video">
        <source src="/assets/child1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <header className="modern-sso-header">
        <div className="modern-sso-brand">
          <span className="brand-state">{t('signup.brandState')}</span>
          <span className="brand-mark">{t('signup.brandMark')}</span>
        </div>
      </header>

      <main className="modern-sso-card">
        <div className="modern-sso-card-header" style={{ borderBottom: 'none', paddingBottom: '0px', paddingTop: '14px' }}>
          <h1 style={{ fontSize: '19px', marginBottom: '2px' }}>Create your account</h1>
          <p className="subtitle" style={{ fontSize: '13px' }}>
            Enter your details. We will email you a temporary password to sign in with for the first time.
          </p>
        </div>

        {error && (
          <div className="modern-alert alert-error" role="alert">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16" />
            </svg>
            <div className="alert-content">{error}</div>
          </div>
        )}

        {success && (
          <div className="modern-alert alert-success" role="status">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,17L5,12L6.41,10.59L10,14.17L17.59,6.58L19,8" />
            </svg>
            <div className="alert-content">{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modern-sso-form" style={{ paddingTop: '12px' }}>
          <div className="form-section animate-fade-in">
            <div className="form-row-2">
              <div className="modern-field-group">
                <label htmlFor="first-name">{t('signup.firstName')} <span className="req">*</span></label>
                <input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                  placeholder={t('signup.firstNamePlaceholder')}
                />
              </div>

              <div className="modern-field-group">
                <label htmlFor="last-name">{t('signup.lastName')} <span className="req">*</span></label>
                <input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                  placeholder={t('signup.lastNamePlaceholder')}
                />
              </div>
            </div>

            <div className="modern-field-group">
              <label htmlFor="email-field">{t('signup.emailAddress')} <span className="req">*</span></label>
              <input
                id="email-field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="name@domain.com"
                autoComplete="email"
              />
              <p className="field-hint">{t('signup.emailHint')}</p>
            </div>

            <div className="modern-field-group">
              <label htmlFor="registration-portal">{t('signup.registeringAs')} <span className="req">*</span></label>
              <div className="select-wrapper">
                <select
                  id="registration-portal"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                >
                  <option value="parent">{t('signup.roleParent')}</option>
                  <option value="provider">{t('signup.roleProvider')}</option>
                </select>
              </div>
            </div>

            <div className="modern-policy-notice" style={{ marginTop: '8px' }}>
              <div className="checkbox-control-wrapper" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  id="agree-checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  required
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <label htmlFor="agree-checkbox" className="notice-text" style={{ cursor: 'pointer', fontWeight: '500', color: '#1e3a8a' }}>
                  {t('signup.certifyText')} <a href="#terms" className="policy-link" tabIndex={-1}>{t('signup.termsOfUse')}</a>. <span className="req" style={{ color: '#d9381e' }}>*</span>
                </label>
              </div>
            </div>

            <div className="modern-action-row" style={{ marginTop: '12px' }}>
              <button type="submit" className="modern-btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner" style={{ borderTopColor: '#ffffff', width: '16px', height: '16px' }} />
                    {t('signup.creatingAccount')}
                  </>
                ) : (
                  t('signup.createAccountBtn')
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="modern-card-footer">
          {t('signup.alreadyRegistered')}{' '}
          <Link href="/login" className="login-link">
            {t('signup.signInLink')}
          </Link>
        </div>
      </main>
    </div>
  );
}
