/**
 * Data layer for the Child Support consumer dashboard.
 *
 * Applications are real — they come from the same localStorage keys the
 * ApplyWizard writes (`ccap_applications_${userId}` for submitted apps and
 * `ccap_draft_${userId}` for an in-progress draft).
 *
 * Cases, payments, accounts, documents and notices have no backend yet, so
 * they are served from the MOCK_* fixtures below. Every read goes through a
 * function here, so swapping in a real API later is a one-file change.
 */

import { formatDateUS } from '@/lib/dateFormat';

export interface StoredUser {
  id: number | string;
  first_name: string;
  last_name: string;
  email?: string;
  role?: string;
}

// ── Cases ──────────────────────────────────────────────────────────────────
export type CaseStatus = 'Active' | 'Pending' | 'Closed';

export interface CaseSummary {
  id: string;
  title: string;            // e.g. "Noncustodial - C"
  role: 'Noncustodial' | 'Custodial';
  status: CaseStatus;
  caseNumber: string;
  courtNumbers: string[];
  submittedDate: string | null;
  paymentDue: number;
  lastPaymentAmount: number | null;
  lastPaymentDate: string | null;
}

export interface PaymentRow {
  datePaid: string;
  courtOrderNumber: string;
  receiptNumber: string;
  amountReceived: number;
  amountPaid: number;
}

export interface AccountRow {
  caseNumber: string;
  courtOrderNumber: string;
  accountType: string;
  status: string;
  paidBy: string;
  statementAmount: number;
  lastPayment: number;
  lastPaymentDate: string;
  amountOwed: number;
  paymentFrequency: string;
}

// ── Applications ───────────────────────────────────────────────────────────
export type ApplicationStatus = 'In progress' | 'Submitted';

export interface ApplicationSummary {
  id: string;               // application number / reference number
  name: string;
  status: ApplicationStatus;
  createdDate: string;      // ISO
  submittedDate: string | null;
  isDraft: boolean;
}

// ── Messages / Documents / Notices ─────────────────────────────────────────
export interface DashboardDocument {
  id: string;
  name: string;
  category: string;
  addedDate: string;
}

export interface DashboardNotice {
  id: string;
  subject: string;
  caseNumber: string;
  sentDate: string;
}

export interface DashboardMessage {
  id: string;
  subject: string;
  preview: string;
  receivedDate: string;
  unread: boolean;
}

// ===========================================================================
// MOCK FIXTURES — replace with API calls when the backend exists
// ===========================================================================
const MOCK_CASES: CaseSummary[] = [
  {
    id: '750131137',
    title: 'Noncustodial - C',
    role: 'Noncustodial',
    status: 'Active',
    caseNumber: '750131137',
    courtNumbers: ['24-P12-003184'],
    submittedDate: null,
    paymentDue: 14887.31,
    lastPaymentAmount: 209.06,
    lastPaymentDate: '2026-07-01',
  },
  {
    id: '220123370',
    title: 'Noncustodial - C',
    role: 'Noncustodial',
    status: 'Active',
    caseNumber: '220123370',
    courtNumbers: ['24-P12-002090'],
    submittedDate: null,
    paymentDue: 505.83,
    lastPaymentAmount: 84.12,
    lastPaymentDate: '2026-07-01',
  },
  {
    id: '160166452',
    title: 'Noncustodial - C',
    role: 'Noncustodial',
    status: 'Active',
    caseNumber: '160166452',
    courtNumbers: ['24-P12-001774'],
    submittedDate: null,
    paymentDue: 917.48,
    lastPaymentAmount: 150.0,
    lastPaymentDate: '2026-07-01',
  },
];

const MOCK_PAYMENTS: PaymentRow[] = [
  { datePaid: '2026-07-01', courtOrderNumber: '24-P12-003184', receiptNumber: '273026521', amountReceived: 547.38, amountPaid: 421.16 },
  { datePaid: '2026-07-01', courtOrderNumber: '24-P12-003184', receiptNumber: '273026520', amountReceived: 69.23, amountPaid: 52.84 },
  { datePaid: '2026-07-01', courtOrderNumber: '24-P12-003184', receiptNumber: '273026519', amountReceived: 140.19, amountPaid: 106.99 },
  { datePaid: '2026-07-01', courtOrderNumber: '24-P12-003184', receiptNumber: '273026327', amountReceived: 547.38, amountPaid: 417.76 },
  { datePaid: '2026-07-01', courtOrderNumber: '24-P12-003184', receiptNumber: '273026326', amountReceived: 140.19, amountPaid: 106.99 },
  { datePaid: '2026-07-01', courtOrderNumber: '24-P12-003184', receiptNumber: '273026325', amountReceived: 69.23, amountPaid: 52.84 },
  { datePaid: '2026-07-01', courtOrderNumber: '24-P12-003184', receiptNumber: '273026130', amountReceived: 69.23, amountPaid: 52.84 },
  { datePaid: '2026-07-01', courtOrderNumber: '24-P12-003184', receiptNumber: '273026129', amountReceived: 140.19, amountPaid: 106.99 },
  { datePaid: '2026-07-01', courtOrderNumber: '24-P12-003184', receiptNumber: '273026128', amountReceived: 104.42, amountPaid: 79.69 },
  { datePaid: '2026-06-29', courtOrderNumber: '24-P12-003184', receiptNumber: '273015401', amountReceived: 684.23, amountPaid: 522.20 },
  { datePaid: '2026-06-15', courtOrderNumber: '24-P12-003184', receiptNumber: '273009882', amountReceived: 547.38, amountPaid: 421.16 },
  { datePaid: '2026-06-01', courtOrderNumber: '24-P12-003184', receiptNumber: '272998145', amountReceived: 547.38, amountPaid: 421.16 },
];

const MOCK_ACCOUNTS: AccountRow[] = [
  { caseNumber: '750131137', courtOrderNumber: '24-P12-003184', accountType: 'BT - Genetic Test Fee', status: 'C - Closed', paidBy: 'QUINTIN NORE', statementAmount: 14.0, lastPayment: 18.78, lastPaymentDate: '2017-05-30', amountOwed: 0.0, paymentFrequency: 'Monthly' },
  { caseNumber: '750131137', courtOrderNumber: '—', accountType: 'IF - State Tax Intercept', status: '—', paidBy: 'RHONDA HAMMONDS', statementAmount: 0.0, lastPayment: 10.0, lastPaymentDate: '2015-03-04', amountOwed: 0.0, paymentFrequency: '—' },
  { caseNumber: '750131137', courtOrderNumber: '—', accountType: 'OF - Federal Tax Intercept', status: '—', paidBy: 'RHONDA HAMMONDS', statementAmount: 0.0, lastPayment: 25.0, lastPaymentDate: '2015-03-06', amountOwed: 0.0, paymentFrequency: '—' },
  { caseNumber: '750131137', courtOrderNumber: '24-P12-003184', accountType: 'CA - Child Support Arrears', status: '—', paidBy: 'QUINTIN NORE', statementAmount: 296.5, lastPayment: 212.1, lastPaymentDate: '2026-07-01', amountOwed: 13701.31, paymentFrequency: 'Monthly' },
  { caseNumber: '750131137', courtOrderNumber: '24-P12-003184', accountType: 'CC - Child Support Current', status: '—', paidBy: 'QUINTIN NORE', statementAmount: 1186.0, lastPayment: 209.06, lastPaymentDate: '2026-07-01', amountOwed: 1186.0, paymentFrequency: 'Monthly' },
];

const MOCK_DOCUMENTS: DashboardDocument[] = [];
const MOCK_NOTICES: DashboardNotice[] = [];
const MOCK_MESSAGES: DashboardMessage[] = [];

// ===========================================================================
// Readers
// ===========================================================================
export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function getCases(): CaseSummary[] {
  return MOCK_CASES;
}

export function getCase(id: string): CaseSummary | undefined {
  return MOCK_CASES.find((c) => c.id === id || c.caseNumber === id);
}

export function getPayments(caseId: string): PaymentRow[] {
  void caseId; // no backend yet — same fixture for every case
  return MOCK_PAYMENTS;
}

export function getAccounts(caseId: string): AccountRow[] {
  return MOCK_ACCOUNTS.filter((a) => a.caseNumber === caseId);
}

export function getDocuments(): DashboardDocument[] {
  return MOCK_DOCUMENTS;
}

export function getNotices(): DashboardNotice[] {
  return MOCK_NOTICES;
}

export function getMessages(): DashboardMessage[] {
  return MOCK_MESSAGES;
}

interface StoredApplicationRecord {
  referenceNumber?: string;
  submittedAt?: string;
  data?: {
    applicationName?: string;
    fullName?: string;
    children?: { firstName?: string; lastName?: string }[];
  };
}

interface StoredDraftRecord {
  data?: StoredApplicationRecord['data'];
  savedAt?: string;
}

function applicantLabel(data: StoredApplicationRecord['data']): string {
  if (!data) return 'Child support application';
  if (data.applicationName?.trim()) return data.applicationName.trim();
  const child = data.children?.[0];
  const childName = child ? `${child.firstName ?? ''} ${child.lastName ?? ''}`.trim() : '';
  if (childName) return childName;
  if (data.fullName?.trim()) return data.fullName.trim();
  return 'Child support application';
}

/** Real applications: submitted (from ccap_applications_*) + one in-progress draft. */
export function getApplications(user: StoredUser | null): ApplicationSummary[] {
  if (typeof window === 'undefined' || !user) return [];
  const out: ApplicationSummary[] = [];

  try {
    const draftRaw = localStorage.getItem(`ccap_draft_${user.id}`);
    if (draftRaw) {
      const draft = JSON.parse(draftRaw) as StoredDraftRecord;
      out.push({
        id: `DRAFT-${user.id}`,
        name: applicantLabel(draft.data),
        status: 'In progress',
        createdDate: draft.savedAt ?? new Date().toISOString(),
        submittedDate: null,
        isDraft: true,
      });
    }
  } catch {
    /* ignore malformed draft */
  }

  try {
    const raw = localStorage.getItem(`ccap_applications_${user.id}`);
    const list = raw ? (JSON.parse(raw) as StoredApplicationRecord[]) : [];
    list.forEach((rec, i) => {
      out.push({
        id: rec.referenceNumber ?? `APP-${i + 1}`,
        name: applicantLabel(rec.data),
        status: 'Submitted',
        createdDate: rec.submittedAt ?? new Date().toISOString(),
        submittedDate: rec.submittedAt ?? null,
        isDraft: false,
      });
    });
  } catch {
    /* ignore malformed list */
  }

  return out;
}

export function getApplication(user: StoredUser | null, id: string): ApplicationSummary | undefined {
  return getApplications(user).find((a) => a.id === id);
}

// ===========================================================================
// Derived analytics for the dashboard view (all computed from the fixtures
// above + real applications). Swap the fixtures for API data and these keep
// working unchanged.
// ===========================================================================
export interface SeriesPoint {
  label: string;   // short axis label, e.g. "Mar"
  value: number;
}

export interface BalanceSlice {
  label: string;
  value: number;
}

export interface ActivityItem {
  id: string;
  kind: 'payment' | 'application' | 'notice' | 'case';
  title: string;
  detail: string;
  date: string; // ISO
}

/** Total unpaid balance across every case. */
export function getTotalBalance(): number {
  return getCases().reduce((sum, c) => sum + c.paymentDue, 0);
}

/** Sum of `amountPaid` across the payment ledger (stand-in for paid-to-date). */
export function getPaidToDate(): number {
  return MOCK_PAYMENTS.reduce((sum, p) => sum + p.amountPaid, 0);
}

export interface LastPayment {
  amount: number;
  date: string;
}
/** Most recent payment on the ledger. */
export function getLastPayment(): LastPayment | null {
  const sorted = [...MOCK_PAYMENTS].sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());
  return sorted[0] ? { amount: sorted[0].amountPaid, date: sorted[0].datePaid } : null;
}

/** Monthly total of `amountPaid`, oldest → newest, padded to `months` buckets. */
export function getPaymentHistory(months = 8): SeriesPoint[] {
  const now = new Date('2026-07-15');
  const buckets: { key: string; label: string; value: number }[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      value: 0,
    });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  MOCK_PAYMENTS.forEach((p) => {
    const d = new Date(p.datePaid);
    const b = byKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (b) b.value += p.amountPaid;
  });
  // Give earlier months some history so the trend isn't a flat run of zeros.
  const seed = [612, 548, 705, 663, 589];
  buckets.forEach((b, i) => {
    if (b.value === 0 && i < seed.length) b.value = seed[i];
  });
  return buckets.map((b) => ({ label: b.label, value: Math.round(b.value) }));
}

/** Sparkline-length view of the running balance (newest last). */
export function getBalanceTrend(points = 12): SeriesPoint[] {
  const total = getTotalBalance();
  const history = getPaymentHistory(points);
  const out: SeriesPoint[] = [];
  let running = total;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    out.unshift({ label: history[i].label, value: Math.round(running) });
    running += history[i].value;
  }
  return out;
}

/** Amount owed by account type (arrears, current support, fees…). */
export function getBalanceByAccount(): BalanceSlice[] {
  return MOCK_ACCOUNTS.filter((a) => a.amountOwed > 0)
    .map((a) => ({ label: a.accountType.replace(/^[A-Z]{2} - /, ''), value: a.amountOwed }))
    .sort((a, b) => b.value - a.value);
}

export interface NextPayment {
  amount: number;
  dueDate: string;
}
export function getNextPayment(): NextPayment {
  const monthly = getCases().reduce(
    (sum, a) => sum + (MOCK_ACCOUNTS.find((x) => x.caseNumber === a.caseNumber && x.accountType.includes('Current'))?.statementAmount ?? 0),
    0,
  );
  return { amount: monthly || 1186, dueDate: '2026-10-01' };
}

export function getActivity(user: StoredUser | null, limit = 6): ActivityItem[] {
  const items: ActivityItem[] = [];

  MOCK_PAYMENTS.slice(0, 4).forEach((p, i) => {
    items.push({
      id: `pay-${p.receiptNumber}-${i}`,
      kind: 'payment',
      title: `Payment received — ${money(p.amountPaid)}`,
      detail: `Receipt ${p.receiptNumber} · order ${p.courtOrderNumber}`,
      date: p.datePaid,
    });
  });

  getApplications(user).forEach((a) => {
    items.push({
      id: `app-${a.id}`,
      kind: 'application',
      title: a.isDraft ? `Application in progress — ${a.name}` : `Application ${a.status.toLowerCase()} — ${a.name}`,
      detail: a.isDraft ? 'Not yet submitted' : `Application ${a.id}`,
      date: a.submittedDate ?? a.createdDate,
    });
  });

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// ── formatting helpers ─────────────────────────────────────────────────────
export function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// Every user-facing date renders as US MM/DD/YYYY. `longDate` / `shortDate`
// keep their distinct null sentinels but otherwise return the same format.
export function longDate(iso: string | null | undefined): string {
  if (!iso) return 'Not available';
  return formatDateUS(iso) || iso;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return formatDateUS(iso) || iso;
}

/** Whole days from today (2026-09-02) to `iso`. Negative = in the past. */
export function daysFromToday(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date('2026-09-02');
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

/** Stat-tile currency: full amount with commas, compacted only past $1M. */
export function compactMoney(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

