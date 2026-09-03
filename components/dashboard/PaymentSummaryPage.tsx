'use client';

import React, { useState } from 'react';
import { CsdPage, DataTable, Pager, useDashboardAuth } from '@components/dashboard/DashboardUI';
import { getCase, getPayments, longDate, money } from '@/lib/dashboardData';

const PAGE_SIZE = 10;

export default function PaymentSummaryPage({ caseId }: { caseId: string }) {
  const { ready, user } = useDashboardAuth();
  const [page, setPage] = useState(1);

  if (!ready || !user) return null;

  const c = getCase(caseId);
  const payments = getPayments(caseId);
  const pageCount = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
  const shown = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const download = () => window.print();

  return (
    <CsdPage
      title={c?.title ?? 'Payment summary'}
      back={{ href: `/parent/cases/${caseId}`, label: 'Go back' }}
      action={
        <button type="button" className="gov-btn gov-btn-primary gov-btn-sm" onClick={download}>
          Download summary
        </button>
      }
    >
      <h2 className="csd-section-label">Payments</h2>
      <DataTable
        columns={['Date paid', 'Court order number', 'Receipt number', 'Amount received', 'Amount paid']}
        rows={shown.map((p) => [
          longDate(p.datePaid),
          p.courtOrderNumber,
          p.receiptNumber,
          money(p.amountReceived),
          money(p.amountPaid),
        ])}
      />
      <Pager page={page} pageCount={pageCount} onChange={setPage} />
    </CsdPage>
  );
}
