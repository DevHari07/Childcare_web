import React from 'react';
import UpdateCasePage from '@components/dashboard/UpdateCasePage';

export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <UpdateCasePage caseId={caseId} />;
}
