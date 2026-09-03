'use client';

import React from 'react';
import Link from 'next/link';
import { CsdPage, StatusPill, useDashboardAuth } from '@components/dashboard/DashboardUI';
import { getCase, longDate, money } from '@/lib/dashboardData';

export default function CaseDetailPage({ caseId }: { caseId: string }) {
  const { ready, user } = useDashboardAuth();
  if (!ready || !user) return null;

  const c = getCase(caseId);
  if (!c) {
    return (
      <CsdPage title="Case not found" back={{ href: '/parent/cases', label: 'Back to cases' }}>
        <p className="csd-empty">We couldn&apos;t find a case with that number.</p>
      </CsdPage>
    );
  }

  return (
    <CsdPage title={c.title} back={{ href: '/parent/cases', label: 'Go back' }}>
      <div className="csd-detail">
        <dl className="csd-detail-rows">
          <div className="csd-card-row">
            <dt>Status</dt>
            <dd><StatusPill status={c.status} /></dd>
          </div>
          <div className="csd-card-row">
            <dt>Case number</dt>
            <dd>{c.caseNumber}</dd>
          </div>
          <div className="csd-card-row">
            <dt>Court number(s)</dt>
            <dd>{c.courtNumbers.join(', ') || '—'}</dd>
          </div>
          <div className="csd-card-row">
            <dt>Submitted date</dt>
            <dd>{c.submittedDate ? longDate(c.submittedDate) : <em>Not available</em>}</dd>
          </div>
        </dl>

        <Link href={`/parent/cases/${c.id}/update`} className="csd-textlink">
          Update case information
        </Link>

        <hr className="csd-divider" />

        <dl className="csd-detail-rows">
          <div className="csd-card-row">
            <dt>Payment due</dt>
            <dd>{money(c.paymentDue)}</dd>
          </div>
          <div className="csd-card-row">
            <dt>Last payment amount</dt>
            <dd>{c.lastPaymentAmount != null ? money(c.lastPaymentAmount) : '—'}</dd>
          </div>
          <div className="csd-card-row">
            <dt>Last payment date</dt>
            <dd>{longDate(c.lastPaymentDate)}</dd>
          </div>
        </dl>

        <div className="csd-detail-links">
          <Link href={`/parent/cases/${c.id}/payment-summary`} className="csd-textlink">
            View payment summary
          </Link>
          <Link href={`/parent/cases/${c.id}/account-summary`} className="csd-textlink">
            View account summary
          </Link>
        </div>
      </div>
    </CsdPage>
  );
}
