import React from 'react';
import AccountSummaryPage from '@components/dashboard/AccountSummaryPage';

export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <AccountSummaryPage caseId={caseId} />;
}
