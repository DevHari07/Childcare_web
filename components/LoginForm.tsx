'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  signIn,
  completeNewPassword,
  submitMfaCode,
  currentClaims,
  syncLegacyUser,
  isAuthenticated,
  type LoginResult,
} from '@/lib/cognitoAuth';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type Phase = 'PASSWORD' | 'NEW_PASSWORD' | 'MFA';

export default function LoginForm() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [phase, setPhase] = useState<Phase>('PASSWORD');
  const [challenge, setChallenge] = useState<{ session: string; email: string; challengeName?: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const finishLogin = () => {
    syncLegacyUser();
    setSuccess(t('login.successMessage'));
    const role = currentClaims()?.role;
    setTimeout(() => {
      router.push(role === 'provider' ? '/provider/dashboard' : role === 'parent' ? '/parent/dashboard' : '/');
      router.refresh();
    }, 1000);
  };

  const handleResult = (result: LoginResult) => {
    if (result.step === 'DONE') {
      finishLogin();
      return;
    }
    if (result.step === 'NEW_PASSWORD_REQUIRED') {
      setChallenge({ session: result.session, email: result.email });
      setPhase('NEW_PASSWORD');
      setSuccess('');
      return;
    }
    // MFA_CODE
    setChallenge({ session: result.session, email: result.email, challengeName: result.challengeName });
    setPhase('MFA');
    setSuccess('A verification code was sent to your email.');
  };

  const messageFromError = (err: unknown): string => {
    if (!(err instanceof Error)) return t('login.genericError');
    const name = err.name || '';
    if (name === 'NotAuthorizedException') return 'Incorrect email or password. Please try again.';
    if (name === 'UserNotFoundException') return 'No account was found for that email address.';
    if (name === 'UserNotConfirmedException') return 'This account is not confirmed yet. Contact your administrator.';
    if (name === 'PasswordResetRequiredException') return 'A password reset is required. Use "Forgot password".';
    if (name === 'CodeMismatchException') return 'That code is not correct. Please re-enter it.';
    if (name === 'ExpiredCodeException') return 'That code has expired. Please sign in again to get a new one.';
    if (name === 'InvalidPasswordException') return err.message.replace(/^.*?: /, '');
    return err.message || t('login.genericError');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) {
      setError(t('login.errorFillFields'));
      return;
    }
    setLoading(true);
    try {
      handleResult(await signIn(email.trim(), password));
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!challenge) return;
    if (newPassword.length < 8) {
      setError('Your new password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      handleResult(await completeNewPassword(challenge.email, challenge.session, newPassword));
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!challenge || !challenge.challengeName) return;
    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    setLoading(true);
    try {
      handleResult(await submitMfaCode(challenge.email, challenge.session, challenge.challengeName, code.trim()));
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setLoading(false);
    }
  };

  const backToPassword = () => {
    setPhase('PASSWORD');
    setChallenge(null);
    setNewPassword('');
    setConfirmPassword('');
    setCode('');
    setError('');
    setSuccess('');
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

          <h2 className="left-headline">{t('login.headline')}</h2>
          <p className="left-desc">{t('login.desc')}</p>
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
            <h1 className="form-main-title">
              {phase === 'PASSWORD' && t('login.title')}
              {phase === 'NEW_PASSWORD' && 'Set a new password'}
              {phase === 'MFA' && 'Verify your identity'}
            </h1>
            <p className="form-main-subtitle">
              {phase === 'PASSWORD' && t('login.subtitle')}
              {phase === 'NEW_PASSWORD' && 'This is your first sign-in. Choose a permanent password to replace the temporary one from your email.'}
              {phase === 'MFA' && 'Enter the verification code we just sent to your email.'}
            </p>
          </div>

          {/* Secure System Disclaimer Banner */}
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

          {phase === 'PASSWORD' && (
            <form onSubmit={handlePasswordSubmit} className="actual-login-form">
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="login-password">{t('login.passwordLabel')} <span className="req">*</span></label>
                  <a href="#reset" className="forgot-link">{t('login.forgotPassword')}</a>
                </div>
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
          )}

          {phase === 'NEW_PASSWORD' && (
            <form onSubmit={handleNewPasswordSubmit} className="actual-login-form">
              <div className="modern-field-group">
                <label htmlFor="new-password">New password <span className="req">*</span></label>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="modern-field-group">
                <label htmlFor="confirm-password">Confirm new password <span className="req">*</span></label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Re-enter new password"
                />
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, margin: '4px 0 12px' }}>
                <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
                {t('login.showPassword')}
              </label>
              <div className="modern-action-row" style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="modern-btn-cancel" onClick={backToPassword} disabled={loading}>
                  {t('signup.back')}
                </button>
                <button type="submit" className="modern-btn-submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Set password & sign in'}
                </button>
              </div>
            </form>
          )}

          {phase === 'MFA' && (
            <form onSubmit={handleMfaSubmit} className="actual-login-form">
              <div className="modern-field-group">
                <label htmlFor="mfa-code">Verification code <span className="req">*</span></label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={loading}
                  placeholder="6-digit code"
                  maxLength={8}
                />
              </div>
              <div className="modern-action-row" style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="modern-btn-cancel" onClick={backToPassword} disabled={loading}>
                  {t('signup.back')}
                </button>
                <button type="submit" className="modern-btn-submit" disabled={loading}>
                  {loading ? t('login.submitting') : 'Verify & sign in'}
                </button>
              </div>
            </form>
          )}

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
