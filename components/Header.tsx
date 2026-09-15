'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AUTH_CHANGE_EVENT } from '@/lib/authEvents';
import { signOut } from '@/lib/authToken';

type HeaderUser = { id: number; first_name: string; last_name: string; role: string };

function readStoredUser(): HeaderUser | null {
  try {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) return JSON.parse(storedUser) as HeaderUser;
  } catch (e) {
    console.error('Error parsing user data', e);
  }
  return null;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [user, setUser] = useState<HeaderUser | null>(null);

  // Header lives in the root layout and never remounts on client-side
  // navigation, so re-sync from storage on every route change and whenever
  // auth state changes in this tab (login/logout) or another tab.
  useEffect(() => {
    const sync = () => setUser(readStoredUser());
    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [pathname]);

  const handleLogout = () => {
    signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="gov-header">
      <div className="gov-header-container">
        <Link href="/" className="gov-logo-link" aria-label="North Dakota Child Support Home">
          <Logo />
        </Link>

        <nav className="gov-nav" aria-label="Primary Navigation">
          <ul className="gov-nav-list">
            <li>
              <LanguageSwitcher />
            </li>
            {user ? (
              <>
                <li className="user-welcome-item">
                  <span className="user-welcome-text">
                    {t('header.welcome')} <strong>{user.first_name} {user.last_name}</strong>
                    <span className="user-badge">{user.role.toUpperCase()}</span>
                  </span>
                </li>
                <li>
                  <button onClick={handleLogout} className="gov-btn gov-btn-outline gov-btn-sm">
                    <LogOut size={15} strokeWidth={2} />
                    {t('header.logout')}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login" className="gov-btn gov-btn-outline gov-btn-sm">
                    {t('header.signIn')}
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="gov-btn gov-btn-primary gov-btn-sm">
                    {t('header.register')}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
