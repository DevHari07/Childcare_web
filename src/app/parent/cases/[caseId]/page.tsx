import React from 'react';
import CaseDetailPage from '@components/dashboard/CaseDetailPage';

export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <CaseDetailPage caseId={caseId} />;
}
