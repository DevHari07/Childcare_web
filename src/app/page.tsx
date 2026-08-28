'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const [user, setUser] = useState<{ id: number; first_name: string; last_name: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  return (
    <div className="page-container">
      {/* Hero Welcome Banner */}
      <section className="hero-section" aria-labelledby="welcome-title">
        <span className="hero-eyebrow">{t('home.eyebrow')}</span>
        <h1 id="welcome-title" className="hero-title">
          {t('home.title')}
        </h1>
        <p className="hero-subtitle">
          {t('home.subtitle')}
        </p>

        {user ? (
          <div className="hero-actions">
            <span className="hero-welcome-msg">
              {t('home.loggedInAs')} <strong>{user.first_name} {user.last_name}</strong> ({user.role.toUpperCase()})
            </span>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <Link href={user.role === 'provider' ? '/provider/dashboard' : '/parent/dashboard'} className="gov-btn gov-btn-primary">
                {t('home.goToDashboard')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="hero-actions" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/login" className="gov-btn gov-btn-primary">
              {t('home.signInCta')}
            </Link>
            <Link href="/signup" className="gov-btn gov-btn-outline">
              {t('home.registerCta')}
            </Link>
          </div>
        )}
      </section>

      {/* Main Grid for Parents & Providers */}
      <div className="portal-grid">
        {/* Parent Portal Card */}
        <article className="portal-card parent-card">
          <div className="portal-card-icon" aria-hidden="true">👪</div>
          <h2 className="portal-card-title">
            {t('home.parentCardTitle')}
          </h2>
          <p className="portal-card-desc">
            {t('home.parentCardDesc')}
          </p>
          <ul className="bullet-list">
            <li>{t('home.parentBullet1')}</li>
            <li>{t('home.parentBullet2')}</li>
            <li>{t('home.parentBullet3')}</li>
            <li>{t('home.parentBullet4')}</li>
          </ul>
          <div style={{ marginTop: 'auto' }}>
            <Link href="/signup?role=parent" className="gov-btn gov-btn-outline" style={{ width: '100%' }}>
              {t('home.parentCta')}
            </Link>
          </div>
        </article>

        {/* Provider Portal Card */}
        <article className="portal-card provider-card">
          <div className="portal-card-icon" aria-hidden="true">🏢</div>
          <h2 className="portal-card-title">
            {t('home.providerCardTitle')}
          </h2>
          <p className="portal-card-desc">
            {t('home.providerCardDesc')}
          </p>
          <ul className="bullet-list">
            <li>{t('home.providerBullet1')}</li>
            <li>{t('home.providerBullet2')}</li>
            <li>{t('home.providerBullet3')}</li>
            <li>{t('home.providerBullet4')}</li>
          </ul>
          <div style={{ marginTop: 'auto' }}>
            <Link href="/signup?role=provider" className="gov-btn gov-btn-outline" style={{ width: '100%' }}>
              {t('home.providerCta')}
            </Link>
          </div>
        </article>
      </div>

      {/* Info Notice Section */}
      <section id="services" className="announcement-card">
        <h3 className="announcement-title">{t('home.announcementsTitle')}</h3>
        <p className="announcement-text">
          {t('home.announcementProviders')}
        </p>
        <p className="announcement-text" style={{ marginBottom: 0 }}>
          {t('home.announcementFamilies')}
        </p>
      </section>
    </div>
  );
}
