'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpenDot,
  FileText,
  CreditCard,
  FileBox,
  MessagesSquare,
  Bell,
  Link2,
} from 'lucide-react';

const NAV = [
  { href: '/parent/dashboard', label: 'Overview', icon: LayoutDashboard, match: (p: string) => p === '/parent/dashboard' },
  { href: '/parent/cases', label: 'Cases', icon: FolderOpenDot, match: (p: string) => p.startsWith('/parent/cases') && p !== '/parent/cases/link' },
  { href: '/parent/applications', label: 'Applications', icon: FileText, match: (p: string) => p.startsWith('/parent/applications') },
  { href: '/parent/cases/link', label: 'Link a case', icon: Link2, match: (p: string) => p === '/parent/cases/link' },
];

const SECONDARY = [
  { href: '/parent/dashboard#payments', label: 'Payments', icon: CreditCard },
  { href: '/parent/dashboard#documents', label: 'Documents', icon: FileBox },
  { href: '/parent/dashboard#messages', label: 'Messages', icon: MessagesSquare },
  { href: '/parent/dashboard#notices', label: 'Notices', icon: Bell },
];

export default function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  return (
    <div className="csd-appshell">
      <aside className="csd-sidebar">
        <div className="csd-sidebar-inner">
          <div className="csd-sidebar-heading">My Child Support</div>
          <nav className="csd-sidenav">
            {NAV.map(({ href, label, icon: Icon, match }) => (
              <Link key={href} href={href} className={`csd-sidenav-link ${match(pathname) ? 'is-active' : ''}`}>
                <Icon size={17} strokeWidth={2} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="csd-sidenav-divider" />
          <nav className="csd-sidenav">
            {SECONDARY.map(({ href, label, icon: Icon }) => (
              <Link key={label} href={href} className="csd-sidenav-link csd-sidenav-link-muted">
                <Icon size={17} strokeWidth={2} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <div className="csd-main">{children}</div>
    </div>
  );
}
