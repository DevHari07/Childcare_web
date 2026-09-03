'use client';

import React from 'react';
import { CsdPage, DataTable, useDashboardAuth } from '@components/dashboard/DashboardUI';
import { getAccounts, getCase, longDate, money } from '@/lib/dashboardData';

export default function AccountSummaryPage({ caseId }: { caseId: string }) {
  const { ready, user } = useDashboardAuth();
  if (!ready || !user) return null;

  const c = getCase(caseId);
  const accounts = getAccounts(caseId);

  const download = () => window.print();

  return (
    <CsdPage
      title={c?.title ?? 'Account summary'}
      back={{ href: `/parent/cases/${caseId}`, label: 'Go back' }}
      action={
        <button type="button" className="gov-btn gov-btn-primary gov-btn-sm" onClick={download}>
          Download summary
        </button>
      }
    >
      <h2 className="csd-section-label">Accounts</h2>
      {accounts.length === 0 ? (
        <p className="csd-empty">No account activity for this case.</p>
      ) : (
        <DataTable
          columns={[
            'Case number',
            'Court order number',
            'Account type',
            'Status',
            'Paid by',
            'Statement amount',
            'Last payment',
            'Last payment date',
            'Amount owed',
            'Payment frequency',
          ]}
          rows={accounts.map((a) => [
            a.caseNumber,
            a.courtOrderNumber,
            a.accountType,
            a.status,
            a.paidBy,
            money(a.statementAmount),
            money(a.lastPayment),
            longDate(a.lastPaymentDate),
            money(a.amountOwed),
            a.paymentFrequency,
          ])}
        />
      )}
    </CsdPage>
  );
}
