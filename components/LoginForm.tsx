'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/mockAuth';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function LoginForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!usernameOrEmail || !password) {
      setError(t('login.errorFillFields'));
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const { token, user } = login(usernameOrEmail, password);

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        setSuccess(t('login.successMessage'));
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1200);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('login.genericError'));
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="modern-split-container">
      {/* Left Column: Visual Brand / Info Column */}
      <div className="modern-split-left">
        <div className="left-overlay"></div>
        <div className="left-content">
          <div className="left-brand">
            <span className="left-brand-state">{t('login.brandState')}</span>
            <span className="left-brand-sub">{t('login.brandSub')}</span>
          </div>

          <h2 className="left-headline">
            {t('login.headline')}
          </h2>
          <p className="left-desc">
            {t('login.desc')}
          </p>

          <div className="left-info-grid">
            <div className="left-info-item">
              <span className="info-stat">{t('login.stat1Num')}</span>
              <span className="info-lbl">{t('login.stat1Label')}</span>
            </div>
            <div className="left-info-item">
              <span className="info-stat">{t('login.stat2Num')}</span>
              <span className="info-lbl">{t('login.stat2Label')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div className="modern-split-right">
        <div className="form-wrapper">
          <div className="form-header">
            <div className="sso-mini-logo">
              <span className="logo-nd">{t('login.brandState')}</span>
              <span className="logo-sso">{t('login.logoSso')}</span>
            </div>
            <h1 className="form-main-title">{t('login.title')}</h1>
            <p className="form-main-subtitle">{t('login.subtitle')}</p>
          </div>

          {/* Secure System Disclaimer Banner */}
          <div className="system-warning-alert">
            <div className="alert-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              {t('login.warningTitle')}
            </div>
            <p>
              {t('login.warningText')}
            </p>
          </div>

          {error && (
            <div className="modern-alert alert-error" style={{ margin: '20px 0 0 0' }} role="alert">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16" />
              </svg>
              <div className="alert-content">{error}</div>
            </div>
          )}

          {success && (
            <div className="modern-alert alert-success" style={{ margin: '20px 0 0 0' }} role="status">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,17L5,12L6.41,10.59L10,14.17L17.59,6.58L19,8" />
              </svg>
              <div className="alert-content">{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="actual-login-form">
            <div className="modern-field-group">
              <label htmlFor="login-username">{t('login.userIdLabel')} <span className="req">*</span></label>
              <input
                id="login-username"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                disabled={loading}
                placeholder={t('login.userIdPlaceholder')}
              />
            </div>

            <div className="modern-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="login-password">{t('login.passwordLabel')} <span className="req">*</span></label>
                <a href="#reset" className="forgot-link">{t('login.forgotPassword')}</a>
              </div>
              <div className="password-input-container">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder={t('login.passwordPlaceholder')}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M2,5.27L3.28,4L20,20.72L18.73,22L15.65,18.92C14.5,19.61 13.28,20 12,20C7,20 2.73,16.89 1,12C1.78,9.79 3.23,7.9 5.09,6.5L2,3.27M12,9A3,3 0 0,1 15,12L12,9M12,4.5C17,4.5 21.27,7.61 23,12.5C22.39,14.22 21.29,15.7 19.87,16.84L18.39,15.36C19.4,14.5 20.19,13.4 20.61,12.12C19.14,8.74 15.82,6.5 12,6.5C10.82,6.5 9.69,6.72 8.64,7.12L7.15,5.63C8.61,4.92 10.26,4.5 12,4.5M12,17C12.55,17 13.08,16.89 13.56,16.68L12.32,15.44C12.22,15.47 12.11,15.5 12,15.5A3.5,3.5 0 0,1 8.5,12C8.5,11.89 8.53,11.78 8.56,11.68L7.32,10.44C7.11,10.92 7,11.45 7,12A5,5 0 0,0 12,17Z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12.5C2.73,17.39 7,20.5 12,20.5C17,20.5 21.27,17.39 23,12.5C21.27,7.61 17,4.5 12,4.5Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="modern-action-row" style={{ marginTop: '12px' }}>
              <button
                type="submit"
                className="modern-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ borderTopColor: '#ffffff', width: '16px', height: '16px' }} />
                    {t('login.submitting')}
                  </>
                ) : (
                  t('login.submit')
                )}
              </button>
            </div>
          </form>

          <div className="form-alternative-footer">
            {t('login.newToPortal')}{' '}
            <Link href="/signup" className="register-link">
              {t('login.createAccount')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
