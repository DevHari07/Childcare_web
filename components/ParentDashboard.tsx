'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  FilePlus2,
  CreditCard,
  FileText,
  Bell,
  Inbox,
  HandCoins,
  CalendarClock,
  FolderKanban,
} from 'lucide-react';
import { useDashboardAuth, StatusPill } from '@components/dashboard/DashboardUI';
import { ChartCard, MiniMeter, StatTile } from '@components/dashboard/Charts';
import {
  getActivity,
  fetchApplications,
  getCases,
  getLastPayment,
  getNextPayment,
  money,
  shortDate,
  longDate,
  daysFromToday,
  type ActivityItem,
  type ApplicationSummary,
  type CaseSummary,
} from '@/lib/dashboardData';

const ACTIVITY_ICON: Record<ActivityItem['kind'], React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  payment: CreditCard,
  application: FileText,
  notice: Bell,
  case: Inbox,
};

export default function ParentDashboard() {
  const router = useRouter();
  const { user, ready } = useDashboardAuth();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [apps, setApps] = useState<ApplicationSummary[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!ready) return;
    setCases(getCases());
    let cancelled = false;
    fetchApplications()
      .then((list) => {
        if (cancelled) return;
        setApps(list);
        setActivity(getActivity(list));
      })
      .catch(() => {
        if (cancelled) return;
        setApps([]);
        setActivity(getActivity([]));
      });
    return () => { cancelled = true; };
  }, [ready, user]);

  const nextPayment = useMemo(() => getNextPayment(), []);
  const lastPayment = useMemo(() => getLastPayment(), []);

  if (!ready || !user) return null;

  const activeCases = cases.filter((c) => c.status === 'Active').length;
  const draftApps = apps.filter((a) => a.isDraft).length;
  const dueInDays = daysFromToday(nextPayment.dueDate);
  const dueSub =
    dueInDays == null
      ? shortDate(nextPayment.dueDate)
      : dueInDays < 0
        ? `Overdue since ${shortDate(nextPayment.dueDate)}`
        : dueInDays === 0
          ? `Due today`
          : `Due ${shortDate(nextPayment.dueDate)} · in ${dueInDays} day${dueInDays === 1 ? '' : 's'}`;

  return (
    <div className="csd-shell csd-dash">
      <header className="csd-dash-header">
        <h1 className="csd-page-title">Child Support Overview</h1>
        <div className="csd-dash-actions">
          <button type="button" className="gov-btn gov-btn-primary gov-btn-sm" onClick={() => router.push('/apply?new=1')}>
            <FilePlus2 size={15} strokeWidth={2} /> New application
          </button>
        </div>
      </header>

      {/* KPI row */}
      <div className="csd-stat-row">
        <StatTile
          label="Open applications"
          value={String(apps.length)}
          sub={
            apps.length === 0
              ? 'No applications yet'
              : draftApps > 0
                ? `${draftApps} in progress`
                : 'All submitted'
          }
          icon={FileText}
          tone="accent"
        />
        <StatTile
          label="Open cases"
          value={String(cases.length)}
          sub={
            cases.length === 0
              ? 'No active cases'
              : activeCases === cases.length
                ? 'All active'
                : `${activeCases} active`
          }
          icon={FolderKanban}
          tone="neutral"
        />
        <StatTile
          label="Next payment due"
          value={money(nextPayment.amount)}
          sub={dueSub}
          icon={CalendarClock}
          tone="info"
        />
        <StatTile
          label="Last payment"
          value={lastPayment ? money(lastPayment.amount) : '—'}
          sub={lastPayment ? `Received ${shortDate(lastPayment.date)}` : 'No payments yet'}
          icon={HandCoins}
          tone="success"
        />
      </div>

      <div className="csd-chart-grid csd-chart-grid-2to1 csd-chart-grid-top">
        {/* Left column: Applications + Cases stacked */}
        <div className="csd-chart-col">
          <ChartCard
            title="Applications"
            right={
              <Link href="/parent/applications" className="csd-textlink">
                View all <ArrowUpRight size={14} strokeWidth={2.4} />
              </Link>
            }
          >
            {apps.length === 0 ? (
              <p className="csd-empty" style={{ textAlign: 'center', padding: '24px 0' }}>
                You haven&apos;t started an application yet.
              </p>
            ) : (
              <div className="csd-table-wrap csd-table-flush">
                <table className="csd-table">
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>Application no</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {apps.slice(0, 4).map((a) => (
                      <tr
                        key={a.id}
                        className={a.isDraft ? 'csd-row-link' : undefined}
                        onClick={a.isDraft ? () => router.push('/apply') : undefined}
                      >
                        <td>
                          <span className="csd-cell-strong">{a.name}</span>
                        </td>
                        <td>{a.isDraft ? 'Not assigned' : a.id}</td>
                        <td>{longDate(a.createdDate)}</td>
                        <td>
                          <StatusPill status={a.status} />
                        </td>
                        <td className="csd-num">
                          {a.isDraft && (
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
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>

          <ChartCard
            title={`Cases (${cases.length})`}
            right={
              <Link href="/parent/cases" className="csd-textlink">
                View all <ArrowUpRight size={14} strokeWidth={2.4} />
              </Link>
            }
          >
            {cases.length === 0 ? (
              <p className="csd-empty">You don&apos;t have any cases yet.</p>
            ) : (
              <div className="csd-table-wrap csd-table-flush">
                <table className="csd-table">
                  <thead>
                    <tr>
                      <th>Case</th>
                      <th>Status</th>
                      <th className="csd-num">Balance owed</th>
                      <th>Paid vs balance</th>
                      <th className="csd-num">Last payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => (
                      <tr key={c.id} className="csd-row-link" onClick={() => router.push(`/parent/cases/${c.id}`)}>
                        <td>
                          <span className="csd-cell-strong">{c.title}</span>
                          <span className="csd-cell-dim">#{c.caseNumber}</span>
                        </td>
                        <td>
                          <StatusPill status={c.status} />
                        </td>
                        <td className="csd-num">{money(c.paymentDue)}</td>
                        <td>
                          <MiniMeter paid={c.lastPaymentAmount ? c.lastPaymentAmount * 12 : 0} total={c.paymentDue} />
                        </td>
                        <td className="csd-num">
                          {c.lastPaymentAmount != null ? money(c.lastPaymentAmount) : '—'}
                          <span className="csd-cell-dim">{c.lastPaymentDate ? shortDate(c.lastPaymentDate) : ''}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Activity */}
        <ChartCard title="Recent activity">
          {activity.length === 0 ? (
            <p className="csd-empty">Nothing recent.</p>
          ) : (
            <ul className="csd-timeline">
              {activity.map((a) => {
                const Icon = ACTIVITY_ICON[a.kind];
                return (
                  <li key={a.id} className="csd-timeline-item">
                    <span className={`csd-timeline-icon csd-timeline-${a.kind}`}>
                      <Icon size={14} strokeWidth={2} />
                    </span>
                    <span className="csd-timeline-body">
                      <span className="csd-timeline-title">{a.title}</span>
                      <span className="csd-timeline-detail">{a.detail}</span>
                      <span className="csd-timeline-date">{longDate(a.date)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
