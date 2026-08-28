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

export default function ProviderDashboardPage() {
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
            <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10A2,2 0 0,1 6,8H9V6A3,3 0 0,1 12,3A3,3 0 0,1 15,6V8H18M12,5A1,1 0 0,0 11,6V8H13V6A1,1 0 0,0 12,5Z" />
          </svg>
        </div>

        <div className="dashboard-greeting">{t('dashboard.welcomeBack')} {user.first_name}</div>
        <h1 className="dashboard-empty-title">{t('dashboard.providerTitle')}</h1>
        <p className="dashboard-empty-desc">
          {t('dashboard.providerDesc')}
        </p>
      </div>
    </div>
  );
}
