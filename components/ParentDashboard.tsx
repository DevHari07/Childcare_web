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
  Wallet,
  HandCoins,
  CalendarClock,
  FolderKanban,
} from 'lucide-react';
import { useDashboardAuth, StatusPill } from '@components/dashboard/DashboardUI';
import { ChartCard, MiniMeter, StatTile } from '@components/dashboard/Charts';
import {
  getActivity,
  getApplications,
  getCases,
  getDocuments,
  getLastPayment,
  getNextPayment,
  getNotices,
  getTotalBalance,
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
    setApps(getApplications(user));
    setActivity(getActivity(user));
  }, [ready, user]);

  const totalBalance = useMemo(() => getTotalBalance(), []);
  const nextPayment = useMemo(() => getNextPayment(), []);
  const lastPayment = useMemo(() => getLastPayment(), []);

  if (!ready || !user) return null;

  const docs = getDocuments();
  const notices = getNotices();
  const activeCases = cases.filter((c) => c.status === 'Active').length;
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
          <button type="button" className="gov-btn gov-btn-primary gov-btn-sm" onClick={() => router.push('/apply')}>
            <FilePlus2 size={15} strokeWidth={2} /> New application
          </button>
        </div>
      </header>

      {/* KPI row */}
      <div className="csd-stat-row">
        <StatTile
          label="Total balance owed"
          value={money(totalBalance)}
          sub={`Across ${cases.length} case${cases.length === 1 ? '' : 's'}`}
          icon={Wallet}
          tone="accent"
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
      </div>

      <div className="csd-chart-grid csd-chart-grid-2to1">
        {/* Cases table */}
        <ChartCard
          title="Cases"
          subtitle={`${cases.length} active`}
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

      {/* Applications + inbox */}
      <div className="csd-chart-grid csd-chart-grid-2to1">
        <ChartCard
          title="Applications"
          right={
            <Link href="/parent/applications" className="csd-textlink">
              View all <ArrowUpRight size={14} strokeWidth={2.4} />
            </Link>
          }
        >
          {apps.length === 0 ? (
            <div className="csd-empty-block">
              <p className="csd-empty">You haven&apos;t started an application yet.</p>
              <button type="button" className="gov-btn gov-btn-primary gov-btn-sm" onClick={() => router.push('/apply')}>
                Start an application
              </button>
            </div>
          ) : (
            <ul className="csd-applist">
              {apps.slice(0, 4).map((a) => (
                <li key={a.id} className="csd-applist-item">
                  <span className="csd-applist-main">
                    <span className="csd-cell-strong">{a.name}</span>
                    <span className="csd-cell-dim">
                      {a.isDraft ? 'Not assigned' : a.id} · {longDate(a.createdDate)}
                    </span>
                  </span>
                  <StatusPill status={a.status} />
                  {a.isDraft && (
                    <button type="button" className="gov-btn gov-btn-primary gov-btn-sm" onClick={() => router.push('/apply')}>
                      Continue
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard title="Inbox">
          <ul className="csd-inbox">
            <li>
              <span className="csd-inbox-k">Messages</span>
              <span className="csd-inbox-v">No new messages</span>
            </li>
            <li>
              <span className="csd-inbox-k">Documents</span>
              <span className="csd-inbox-v">{docs.length > 0 ? `${docs.length} available` : 'None yet'}</span>
            </li>
            <li>
              <span className="csd-inbox-k">Notices</span>
              <span className="csd-inbox-v">{notices.length > 0 ? `${notices.length} to review` : 'None right now'}</span>
            </li>
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
