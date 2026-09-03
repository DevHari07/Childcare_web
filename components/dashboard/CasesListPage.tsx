'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search } from 'lucide-react';
import { CsdPage, StatusPill, Pager, useDashboardAuth } from '@components/dashboard/DashboardUI';
import { getCases, longDate, money } from '@/lib/dashboardData';

const PAGE_SIZE = 10;

export default function CasesListPage() {
  const router = useRouter();
  const { ready, user } = useDashboardAuth();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');

  const all = useMemo(() => getCases(), []);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return all;
    return all.filter(
      (c) => c.title.toLowerCase().includes(t) || c.caseNumber.toLowerCase().includes(t) || c.status.toLowerCase().includes(t),
    );
  }, [all, q]);

  if (!ready || !user) return null;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <CsdPage title="Cases" back={{ href: '/parent/dashboard', label: 'Go back' }}>
      <div className="csd-toolbar">
        <span className="csd-toolbar-count">
          {filtered.length} {filtered.length === 1 ? 'case' : 'cases'}
        </span>
        <label className="csd-search">
          <Search size={15} strokeWidth={2} />
          <input
            type="search"
            placeholder="Search cases"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      {all.length === 0 ? (
        <p className="csd-empty">You don&apos;t have any cases.</p>
      ) : filtered.length === 0 ? (
        <p className="csd-empty">No cases match &ldquo;{q}&rdquo;.</p>
      ) : (
        <>
          <div className="csd-table-wrap">
            <table className="csd-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Status</th>
                  <th>Case number</th>
                  <th className="csd-num">Payment due</th>
                  <th>Last payment</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id} className="csd-row-link" onClick={() => router.push(`/parent/cases/${c.id}`)}>
                    <td>
                      <span className="csd-cell-strong">{c.title}</span>
                    </td>
                    <td>
                      <StatusPill status={c.status} />
                    </td>
                    <td>{c.caseNumber}</td>
                    <td className="csd-num">{money(c.paymentDue)}</td>
                    <td>{longDate(c.lastPaymentDate)}</td>
                    <td className="csd-num">
                      <span className="csd-row-actions">
                        <Link
                          href={`/parent/cases/${c.id}/payment-summary`}
                          className="csd-textlink"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Payment summary
                        </Link>
                        <span className="csd-row-go">
                          <ChevronRight size={16} strokeWidth={2.4} />
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={safePage} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </CsdPage>
  );
}
