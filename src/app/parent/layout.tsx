import React from 'react';
import DashboardChrome from '@components/dashboard/DashboardChrome';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <DashboardChrome>{children}</DashboardChrome>;
}
