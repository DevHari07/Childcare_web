'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/en';
import { register } from '@/lib/localAuth';

const SECURITY_QUESTIONS_1: TranslationKey[] = ['signup.sq1.0', 'signup.sq1.1', 'signup.sq1.2', 'signup.sq1.3', 'signup.sq1.4'];
const SECURITY_QUESTIONS_2: TranslationKey[] = ['signup.sq2.0', 'signup.sq2.1', 'signup.sq2.2', 'signup.sq2.3', 'signup.sq2.4'];

export default function LocalSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [currentStep, setCurrentStep] = useState(1);

  const urlRole = searchParams.get('role');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState(urlRole === 'provider' || urlRole === 'parent' ? urlRole : 'parent');
  const [email, setEmail] = useState('');
  const [cellPhone, setCellPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityQ1, setSecurityQ1] = useState('');
  const [securityA1, setSecurityA1] = useState('');
  const [securityQ2, setSecurityQ2] = useState('');
  const [securityA2, setSecurityA2] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fail = (msg: string): false => {
    setError(msg);
    return false;
  };

  const validateStep = (stepNumber: number) => {
    setError('');
    if (stepNumber === 1) {
      if (!firstName.trim()) return fail(t('signup.errFirstName'));
      if (!lastName.trim()) return fail(t('signup.errLastName'));
    } else if (stepNumber === 2) {
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return fail(t('signup.errEmail'));
      if (password.length < 8) return fail('Your password must be at least 8 characters.');
      if (password !== confirmPassword) return fail('The two passwords do not match.');
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((p) => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep((p) => p - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (currentStep !== 3) return;

    if (!securityQ1 || !securityA1.trim()) {
      setError(t('signup.errQ1'));
      return;
    }
    if (!securityQ2 || !securityA2.trim()) {
      setError(t('signup.errQ2'));
      return;
    }
    if (securityQ1 === securityQ2) {
      setError('Please choose two different security questions.');
      return;
    }
    if (!agreeToTerms) {
      setError(t('signup.errTerms'));
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        firstName,
        lastName,
        email,
        password,
        role,
        phone: cellPhone,
        securityQuestions: [
          { question: securityQ1, answer: securityA1 },
          { question: securityQ2, answer: securityA2 },
        ],
      });
      setSuccess('Account created. Signing you in…');
      setTimeout(() => {
        router.push(user.role === 'provider' ? '/provider/dashboard' : '/parent/dashboard');
        router.refresh();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signup.genericError'));
      setLoading(false);
    }
  };

  return (
    <div className="modern-sso-wrapper relative-container">
      <video autoPlay loop muted playsInline className="signup-bg-video">
        <source src="/assets/child1.mp4" type="video/mp4" />
      </video>

      <header className="modern-sso-header">
        <div className="modern-sso-brand">
          <span className="brand-state">{t('signup.brandState')}</span>
          <span className="brand-mark">{t('signup.brandMark')}</span>
        </div>
      </header>

      <main className="modern-sso-card">
        <div className="sso-stepper">
          <div className={`step-node ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>
            <span className="step-label">{t('signup.stepProfile')}</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step-node ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-circle">{currentStep > 2 ? '✓' : '2'}</div>
            <span className="step-label">Account</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step-node ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span className="step-label">{t('signup.stepSecurity')}</span>
          </div>
        </div>

        <div className="modern-sso-card-header" style={{ borderBottom: 'none', paddingBottom: '0px', paddingTop: '14px' }}>
          <h1 style={{ fontSize: '19px', marginBottom: '2px' }}>
            {currentStep === 1 && 'Step 1: Your details'}
            {currentStep === 2 && 'Step 2: Account & password'}
            {currentStep === 3 && t('signup.step3Title')}
          </h1>
          <p className="subtitle" style={{ fontSize: '13px' }}>
            {currentStep === 1 && 'Tell us who you are and how you will use the portal.'}
            {currentStep === 2 && 'Choose the email and password you will sign in with.'}
            {currentStep === 3 && t('signup.step3Subtitle')}
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
          {currentStep === 1 && (
            <div className="form-section animate-fade-in">
              <div className="form-row-2">
                <div className="modern-field-group">
                  <label htmlFor="first-name">{t('signup.firstName')} <span className="req">*</span></label>
                  <input id="first-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={loading} placeholder={t('signup.firstNamePlaceholder')} />
                </div>
                <div className="modern-field-group">
                  <label htmlFor="last-name">{t('signup.lastName')} <span className="req">*</span></label>
                  <input id="last-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={loading} placeholder={t('signup.lastNamePlaceholder')} />
                </div>
              </div>

              <div className="modern-field-group">
                <label htmlFor="registration-portal">{t('signup.registeringAs')} <span className="req">*</span></label>
                <div className="select-wrapper">
                  <select id="registration-portal" value={role} onChange={(e) => setRole(e.target.value)} disabled={loading}>
                    <option value="parent">{t('signup.roleParent')}</option>
                    <option value="provider">{t('signup.roleProvider')}</option>
                  </select>
                </div>
              </div>

              <div className="modern-action-row" style={{ marginTop: '12px' }}>
                <button type="button" className="modern-btn-submit" onClick={handleNextStep}>{t('signup.continueToRecovery')}</button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-section animate-fade-in">
              <div className="modern-field-group">
                <label htmlFor="email-field">{t('signup.emailAddress')} <span className="req">*</span></label>
                <input id="email-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} placeholder="name@domain.com" autoComplete="email" />
              </div>

              <div className="modern-field-group">
                <label htmlFor="phone-field">{t('signup.cellPhone')}</label>
                <input id="phone-field" type="tel" value={cellPhone} onChange={(e) => setCellPhone(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 7015550199" maxLength={10} disabled={loading} />
              </div>

              <div className="form-row-2">
                <div className="modern-field-group">
                  <label htmlFor="password-field">Password <span className="req">*</span></label>
                  <input id="password-field" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} placeholder="At least 8 characters" autoComplete="new-password" />
                </div>
                <div className="modern-field-group">
                  <label htmlFor="confirm-password-field">Confirm password <span className="req">*</span></label>
                  <input id="confirm-password-field" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} placeholder="Re-enter password" autoComplete="new-password" />
                </div>
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, margin: '4px 0 0' }}>
                <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
                {t('login.showPassword')}
              </label>

              <div className="modern-action-row" style={{ marginTop: '12px' }}>
                <button type="button" className="modern-btn-cancel" onClick={handlePrevStep} style={{ minWidth: '100px' }}>{t('signup.back')}</button>
                <button type="button" className="modern-btn-submit" onClick={handleNextStep}>{t('signup.continueToSecurity')}</button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-section animate-fade-in">
              <div className="form-row-2">
                <div className="modern-field-group">
                  <label htmlFor="question-1">{t('signup.question1')} <span className="req">*</span></label>
                  <div className="select-wrapper">
                    <select id="question-1" value={securityQ1} onChange={(e) => setSecurityQ1(e.target.value)} required disabled={loading}>
                      <option value="" disabled>{t('signup.sq1.placeholder')}</option>
                      {SECURITY_QUESTIONS_1.map((qKey) => (
                        <option key={qKey} value={t(qKey)}>{t(qKey)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modern-field-group">
                  <label htmlFor="answer-1">{t('signup.answer1')} <span className="req">*</span></label>
                  <input id="answer-1" type="text" value={securityA1} onChange={(e) => setSecurityA1(e.target.value)} required disabled={loading} placeholder={t('signup.answerPlaceholder')} />
                </div>
              </div>

              <div className="form-row-2" style={{ marginTop: '4px' }}>
                <div className="modern-field-group">
                  <label htmlFor="question-2">{t('signup.question2')} <span className="req">*</span></label>
                  <div className="select-wrapper">
                    <select id="question-2" value={securityQ2} onChange={(e) => setSecurityQ2(e.target.value)} required disabled={loading}>
                      <option value="" disabled>{t('signup.sq2.placeholder')}</option>
                      {SECURITY_QUESTIONS_2.map((qKey) => (
                        <option key={qKey} value={t(qKey)}>{t(qKey)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modern-field-group">
                  <label htmlFor="answer-2">{t('signup.answer2')} <span className="req">*</span></label>
                  <input id="answer-2" type="text" value={securityA2} onChange={(e) => setSecurityA2(e.target.value)} required disabled={loading} placeholder={t('signup.answerPlaceholder')} />
                </div>
              </div>

              <div className="modern-policy-notice" style={{ marginTop: '8px' }}>
                <div className="checkbox-control-wrapper" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <input type="checkbox" id="agree-checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} required style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }} />
                  <label htmlFor="agree-checkbox" className="notice-text" style={{ cursor: 'pointer', fontWeight: '500', color: '#1e3a8a' }}>
                    {t('signup.certifyText')} <a href="#terms" className="policy-link" tabIndex={-1}>{t('signup.termsOfUse')}</a>. <span className="req" style={{ color: '#d9381e' }}>*</span>
                  </label>
                </div>
              </div>

              <div className="modern-action-row" style={{ marginTop: '12px' }}>
                <button type="button" className="modern-btn-cancel" onClick={handlePrevStep} disabled={loading} style={{ minWidth: '100px' }}>{t('signup.back')}</button>
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
          )}
        </form>

        <div className="modern-card-footer">
          {t('signup.alreadyRegistered')}{' '}
          <Link href="/login" className="login-link">{t('signup.signInLink')}</Link>
        </div>
      </main>
    </div>
  );
}
