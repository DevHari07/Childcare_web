import React from 'react';
import PaymentSummaryPage from '@components/dashboard/PaymentSummaryPage';

export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <PaymentSummaryPage caseId={caseId} />;
}
