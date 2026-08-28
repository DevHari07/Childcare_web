'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StoredUser {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
}

export default function ParentDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error('Error parsing user data', e);
      router.push('/login');
      return;
    }

    setCheckedAuth(true);
  }, [router]);

  if (!checkedAuth || !user) {
    return null;
  }

  return (
    <div className="dashboard-shell">
      <div className="dashboard-empty-card">
        <div className="dashboard-empty-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H17V11H13V7H11Z" />
          </svg>
        </div>

        <div className="dashboard-greeting">{t('dashboard.welcomeBack')} {user.first_name}</div>
        <h1 className="dashboard-empty-title">{t('dashboard.parentTitle')}</h1>
        <p className="dashboard-empty-desc">
          {t('dashboard.parentDesc')}
        </p>

        <button
          type="button"
          className="gov-btn gov-btn-primary dashboard-cta-btn"
          onClick={() => router.push('/apply')}
        >
          {t('dashboard.applyBtn')}
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ marginLeft: '8px' }}>
            <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
