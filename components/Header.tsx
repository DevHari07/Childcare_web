'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, HeartHandshake, Info, LogOut } from 'lucide-react';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Header() {
  const router = useRouter();
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="gov-header">
      <div className="gov-header-container">
        <Link href="/" className="gov-logo-link" aria-label="North Dakota Child Care Home">
          <Logo />
        </Link>

        <nav className="gov-nav" aria-label="Primary Navigation">
          <ul className="gov-nav-list">
            <li>
              <Link href="/" className="gov-nav-link">
                <Home size={16} strokeWidth={2} />
                {t('header.home')}
              </Link>
            </li>
            <li>
              <a href="#services" className="gov-nav-link">
                <HeartHandshake size={16} strokeWidth={2} />
                {t('header.services')}
              </a>
            </li>
            <li>
              <a href="#about" className="gov-nav-link">
                <Info size={16} strokeWidth={2} />
                {t('header.about')}
              </a>
            </li>
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
