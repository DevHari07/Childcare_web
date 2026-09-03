'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search } from 'lucide-react';
import { CsdPage, StatusPill, useDashboardAuth } from '@components/dashboard/DashboardUI';
import { getApplications, longDate, type ApplicationSummary } from '@/lib/dashboardData';

export default function ApplicationsListPage() {
  const router = useRouter();
  const { ready, user } = useDashboardAuth();
  const [apps, setApps] = useState<ApplicationSummary[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (ready) setApps(getApplications(user));
  }, [ready, user]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return apps;
    return apps.filter(
      (a) => a.name.toLowerCase().includes(t) || a.id.toLowerCase().includes(t) || a.status.toLowerCase().includes(t),
    );
  }, [apps, q]);

  if (!ready || !user) return null;

  return (
    <CsdPage
      title="Applications"
      back={{ href: '/parent/dashboard', label: 'Go back' }}
      action={
        <button type="button" className="gov-btn gov-btn-primary gov-btn-sm" onClick={() => router.push('/apply')}>
          Start a new application
        </button>
      }
    >
      <div className="csd-toolbar">
        <span className="csd-toolbar-count">
          {filtered.length} {filtered.length === 1 ? 'application' : 'applications'}
        </span>
        <label className="csd-search">
          <Search size={15} strokeWidth={2} />
          <input type="search" placeholder="Search applications" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      {apps.length === 0 ? (
        <p className="csd-empty">You haven&apos;t started any applications yet.</p>
      ) : filtered.length === 0 ? (
        <p className="csd-empty">No applications match &ldquo;{q}&rdquo;.</p>
      ) : (
        <div className="csd-table-wrap">
          <table className="csd-table">
            <thead>
              <tr>
                <th>Application</th>
                <th>Status</th>
                <th>Number</th>
                <th>Created</th>
                <th>Submitted</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className={a.isDraft ? 'csd-row-link' : undefined}
                  onClick={a.isDraft ? () => router.push('/apply') : undefined}
                >
                  <td>
                    <span className="csd-cell-strong">{a.name}</span>
                  </td>
                  <td>
                    <StatusPill status={a.status} />
                  </td>
                  <td>{a.isDraft ? 'Not assigned' : a.id}</td>
                  <td>{longDate(a.createdDate)}</td>
                  <td>{a.submittedDate ? longDate(a.submittedDate) : '—'}</td>
                  <td className="csd-num">
                    <span className="csd-row-actions">
                      {a.isDraft ? (
                        <>
                          <button
                            type="button"
                            className="gov-btn gov-btn-primary gov-btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/apply');
                            }}
                          >
                            Continue
                          </button>
                          <span className="csd-row-go">
                            <ChevronRight size={16} strokeWidth={2.4} />
                          </span>
                        </>
                      ) : (
                        <button type="button" className="csd-textlink" onClick={() => window.print()}>
                          Download
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CsdPage>
  );
}
