'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signup } from '@/lib/mockAuth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/en';

const SECURITY_QUESTIONS_1: TranslationKey[] = ['signup.sq1.0', 'signup.sq1.1', 'signup.sq1.2', 'signup.sq1.3', 'signup.sq1.4'];
const SECURITY_QUESTIONS_2: TranslationKey[] = ['signup.sq2.0', 'signup.sq2.1', 'signup.sq2.2', 'signup.sq2.3', 'signup.sq2.4'];

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [cellPhone, setCellPhone] = useState('');
  const [securityQ1, setSecurityQ1] = useState('');
  const [securityA1, setSecurityA1] = useState('');
  const [securityQ2, setSecurityQ2] = useState('');
  const [securityA2, setSecurityA2] = useState('');
  const [role, setRole] = useState('parent');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Validation States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password Checklist States
  const [hasLength, setHasLength] = useState(false);
  const [hasUpper, setHasUpper] = useState(false);
  const [hasLower, setHasLower] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecial, setHasSpecial] = useState(false);

  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole === 'provider' || urlRole === 'parent') {
      setRole(urlRole);
    }
  }, [searchParams]);

  useEffect(() => {
    setHasLength(password.length >= 8);
    setHasUpper(/[A-Z]/.test(password));
    setHasLower(/[a-z]/.test(password));
    setHasNumber(/[0-9]/.test(password));
    setHasSpecial(/[^A-Za-z0-9]/.test(password));
  }, [password]);

  const getStrengthScore = () => {
    let score = 0;
    if (hasLength) score += 1;
    if (hasUpper) score += 1;
    if (hasLower) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;
    return score;
  };

  const getStrengthDetails = () => {
    const score = getStrengthScore();
    if (!password) return { width: '0%', text: t('signup.strengthNone'), class: '' };
    if (password.length < 8) return { width: '20%', text: t('signup.strengthTooShort'), class: 'weak' };

    switch (score) {
      case 1:
      case 2:
        return { width: '40%', text: t('signup.strengthWeak'), class: 'weak' };
      case 3:
        return { width: '65%', text: t('signup.strengthMedium'), class: 'medium' };
      case 4:
        return { width: '85%', text: t('signup.strengthGood'), class: 'good' };
      case 5:
        return { width: '100%', text: t('signup.strengthStrong'), class: 'strong' };
      default:
        return { width: '0%', text: t('signup.strengthNone'), class: '' };
    }
  };

  const strength = getStrengthDetails();

  // Validate step inputs before proceeding
  const validateStep = (stepNumber: number) => {
    setError('');
    if (stepNumber === 1) {
      if (!firstName.trim()) {
        setError(t('signup.errFirstName'));
        return false;
      }
      if (!lastName.trim()) {
        setError(t('signup.errLastName'));
        return false;
      }
      if (userId.trim().length < 3) {
        setError(t('signup.errUserId'));
        return false;
      }
      if (getStrengthScore() < 5) {
        setError(t('signup.errPasswordReqs'));
        return false;
      }
    } else if (stepNumber === 2) {
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
        setError(t('signup.errEmail'));
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    if (!agreeToTerms) {
      setError(t('signup.errTerms'));
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        signup({
          first_name: firstName,
          last_name: lastName,
          username: userId,
          email: email,
          cell_phone: cellPhone || undefined,
          password: password,
          role: role,
          security_question_1: securityQ1,
          security_answer_1: securityA1,
          security_question_2: securityQ2,
          security_answer_2: securityA2,
        });

        setSuccess(t('signup.successMessage'));
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('signup.genericError'));
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="modern-sso-wrapper relative-container">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="signup-bg-video"
      >
        <source src="/assets/child1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* <div className="signup-bg-overlay"></div> */}

      <header className="modern-sso-header">
        <div className="modern-sso-brand">
          <span className="brand-state">{t('signup.brandState')}</span>
          <span className="brand-mark">{t('signup.brandMark')}</span>
        </div>
      </header>

      <main className="modern-sso-card">
        {/* Step Indicator Header (Progress Stepper) */}
        <div className="sso-stepper">
          <div className={`step-node ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>
            <span className="step-label">{t('signup.stepProfile')}</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step-node ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-circle">{currentStep > 2 ? '✓' : '2'}</div>
            <span className="step-label">{t('signup.stepRecovery')}</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step-node ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span className="step-label">{t('signup.stepSecurity')}</span>
          </div>
        </div>

        <div className="modern-sso-card-header" style={{ borderBottom: 'none', paddingBottom: '0px', paddingTop: '14px' }}>
          <h1 style={{ fontSize: '19px', marginBottom: '2px' }}>
            {currentStep === 1 && t('signup.step1Title')}
            {currentStep === 2 && t('signup.step2Title')}
            {currentStep === 3 && t('signup.step3Title')}
          </h1>
          <p className="subtitle" style={{ fontSize: '13px' }}>
            {currentStep === 1 && t('signup.step1Subtitle')}
            {currentStep === 2 && t('signup.step2Subtitle')}
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
          {/* STEP 1: Account Profile details */}
          {currentStep === 1 && (
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

              <div className="form-row-2">
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

                <div className="modern-field-group">
                  <label htmlFor="user-id">{t('signup.userId')} <span className="req">*</span></label>
                  <input
                    id="user-id"
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    disabled={loading}
                    placeholder={t('signup.userIdPlaceholder')}
                  />
                </div>
              </div>

              <div className="modern-field-group">
                <label htmlFor="password-field">{t('signup.password')} <span className="req">*</span></label>
                <div className="password-input-container">
                  <input
                    id="password-field"
                    type={showPassword ? 'text' : 'password'}
                    className="password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder={t('signup.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M2,5.27L3.28,4L20,20.72L18.73,22L15.65,18.92C14.5,19.61 13.28,20 12,20C7,20 2.73,16.89 1,12C1.78,9.79 3.23,7.9 5.09,6.5L2,3.27M12,9A3,3 0 0,1 15,12L12,9M12,4.5C17,4.5 21.27,7.61 23,12.5C22.39,14.22 21.29,15.7 19.87,16.84L18.39,15.36C19.4,14.5 20.19,13.4 20.61,12.12C19.14,8.74 15.82,6.5 12,6.5C10.82,6.5 9.69,6.72 8.64,7.12L7.15,5.63C8.61,4.92 10.26,4.5 12,4.5M12,17C12.55,17 13.08,16.89 13.56,16.68L12.32,15.44C12.22,15.47 12.11,15.5 12,15.5A3.5,3.5 0 0,1 8.5,12C8.5,11.89 8.53,11.78 8.56,11.68L7.32,10.44C7.11,10.92 7,11.45 7,12A5,5 0 0,0 12,17Z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12.5C2.73,17.39 7,20.5 12,20.5C17,20.5 21.27,17.39 23,12.5C21.27,7.61 17,4.5 12,4.5Z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="modern-pwd-criteria-box">
                  <div className="criteria-left">
                    <div className="criteria-title">{t('signup.securityRequirements')}</div>
                    <ul className="criteria-list">
                      <li className={hasLength ? 'met' : ''}>
                        <span className="dot"></span> {t('signup.req8chars')}
                      </li>
                      <li className={hasUpper ? 'met' : ''}>
                        <span className="dot"></span> {t('signup.reqUpper')}
                      </li>
                      <li className={hasLower ? 'met' : ''}>
                        <span className="dot"></span> {t('signup.reqLower')}
                      </li>
                      <li className={hasNumber ? 'met' : ''}>
                        <span className="dot"></span> {t('signup.reqNumber')}
                      </li>
                      <li className={hasSpecial ? 'met' : ''}>
                        <span className="dot"></span> {t('signup.reqSpecial')}
                      </li>
                    </ul>
                  </div>

                  <div className="criteria-right">
                    <div className="strength-header">
                      <span>{t('signup.strength')}</span>
                      <strong className={`strength-txt ${strength.class}`}>{strength.text}</strong>
                    </div>
                    <div className="strength-meter-bg">
                      <div
                        className={`strength-meter-fill ${strength.class}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modern-action-row" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="modern-btn-submit"
                  onClick={handleNextStep}
                >
                  {t('signup.continueToRecovery')}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginLeft: '4px' }}>
                    <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Account Recovery contact info */}
          {currentStep === 2 && (
            <div className="form-section animate-fade-in">
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
                <label htmlFor="phone-field">{t('signup.cellPhone')}</label>
                <input
                  id="phone-field"
                  type="tel"
                  value={cellPhone}
                  onChange={(e) => setCellPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 7015550199"
                  maxLength={10}
                  disabled={loading}
                />
                <p className="field-hint">{t('signup.cellPhoneHint')}</p>
              </div>

              <div className="modern-action-row" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="modern-btn-cancel"
                  onClick={handlePrevStep}
                  style={{ minWidth: '100px' }}
                >
                  {t('signup.back')}
                </button>
                <button
                  type="button"
                  className="modern-btn-submit"
                  onClick={handleNextStep}
                >
                  {t('signup.continueToSecurity')}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginLeft: '4px' }}>
                    <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Security questions and submission */}
          {currentStep === 3 && (
            <div className="form-section animate-fade-in">
              <div className="form-row-2">
                <div className="modern-field-group">
                  <label htmlFor="question-1">{t('signup.question1')} <span className="req">*</span></label>
                  <div className="select-wrapper">
                    <select
                      id="question-1"
                      value={securityQ1}
                      onChange={(e) => setSecurityQ1(e.target.value)}
                      required
                      disabled={loading}
                    >
                      <option value="" disabled>{t('signup.sq1.placeholder')}</option>
                      {SECURITY_QUESTIONS_1.map((qKey) => (
                        <option key={qKey} value={t(qKey)}>
                          {t(qKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modern-field-group">
                  <label htmlFor="answer-1">{t('signup.answer1')} <span className="req">*</span></label>
                  <input
                    id="answer-1"
                    type="text"
                    value={securityA1}
                    onChange={(e) => setSecurityA1(e.target.value)}
                    required
                    disabled={loading}
                    placeholder={t('signup.answerPlaceholder')}
                  />
                </div>
              </div>

              <div className="form-row-2" style={{ marginTop: '4px' }}>
                <div className="modern-field-group">
                  <label htmlFor="question-2">{t('signup.question2')} <span className="req">*</span></label>
                  <div className="select-wrapper">
                    <select
                      id="question-2"
                      value={securityQ2}
                      onChange={(e) => setSecurityQ2(e.target.value)}
                      required
                      disabled={loading}
                    >
                      <option value="" disabled>{t('signup.sq2.placeholder')}</option>
                      {SECURITY_QUESTIONS_2.map((qKey) => (
                        <option key={qKey} value={t(qKey)}>
                          {t(qKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modern-field-group">
                  <label htmlFor="answer-2">{t('signup.answer2')} <span className="req">*</span></label>
                  <input
                    id="answer-2"
                    type="text"
                    value={securityA2}
                    onChange={(e) => setSecurityA2(e.target.value)}
                    required
                    disabled={loading}
                    placeholder={t('signup.answerPlaceholder')}
                  />
                </div>
              </div>

              {/* Policy certification notice */}
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
                <button
                  type="button"
                  className="modern-btn-cancel"
                  onClick={handlePrevStep}
                  disabled={loading}
                  style={{ minWidth: '100px' }}
                >
                  {t('signup.back')}
                </button>
                <button
                  type="submit"
                  className="modern-btn-submit"
                  disabled={loading}
                >
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
          <Link href="/login" className="login-link">
            {t('signup.signInLink')}
          </Link>
        </div>
      </main>
    </div>
  );
}
