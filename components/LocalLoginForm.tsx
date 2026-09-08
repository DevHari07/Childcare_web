'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { isAuthenticated, login } from '@/lib/localAuth';

export default function LocalLoginForm() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isAuthenticated()) router.push('/');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) {
      setError(t('login.errorFillFields'));
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      setSuccess(t('login.successMessage'));
      setTimeout(() => {
        router.push(
          user.role === 'provider' ? '/provider/dashboard' : user.role === 'parent' ? '/parent/dashboard' : '/',
        );
        router.refresh();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.genericError'));
      setLoading(false);
    }
  };

  return (
    <div className="modern-split-container">
      <div className="modern-split-left">
        <div className="left-overlay"></div>
        <div className="left-content">
          <div className="left-brand">
            <span className="left-brand-state">{t('login.brandState')}</span>
            <span className="left-brand-sub">{t('login.brandSub')}</span>
          </div>
          <h2 className="left-headline">{t('login.headline')}</h2>
          <p className="left-desc">{t('login.desc')}</p>
        </div>
      </div>

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

          <div className="system-warning-alert">
            <div className="alert-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              {t('login.warningTitle')}
            </div>
            <p>{t('login.warningText')}</p>
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
              <label htmlFor="login-email">Email address <span className="req">*</span></label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="name@domain.com"
              />
            </div>

            <div className="modern-field-group">
              <label htmlFor="login-password">{t('login.passwordLabel')} <span className="req">*</span></label>
              <div className="password-input-container">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="password-input"
                  autoComplete="current-password"
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
                  {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <div className="modern-action-row" style={{ marginTop: '12px' }}>
              <button type="submit" className="modern-btn-submit" disabled={loading}>
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
