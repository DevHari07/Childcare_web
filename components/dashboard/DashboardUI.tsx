'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, ChevronRight } from 'lucide-react';

/* ── Back link ──────────────────────────────────────────────────────────── */
export function BackLink({ href, label = 'Go back' }: { href?: string; label?: string }) {
  const router = useRouter();
  const content = (
    <>
      <ArrowLeft size={15} strokeWidth={2.4} />
      {label}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="csd-back">
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className="csd-back" onClick={() => router.back()}>
      {content}
    </button>
  );
}

/* ── Page shell (drill-down pages) ──────────────────────────────────────── */
export function CsdPage({
  title,
  action,
  back,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  back?: { href?: string; label?: string };
  children: React.ReactNode;
}) {
  return (
    <div className="csd-shell">
      <div className="csd-page-head">
        <h1 className="csd-page-title">{title}</h1>
        <div className="csd-page-head-actions">
          {action}
          {back && <BackLink href={back.href} label={back.label} />}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Accordion ─────────────────────────────────────────────────────────── */
export function Accordion({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`csd-acc ${open ? 'is-open' : ''}`}>
      <button type="button" className="csd-acc-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="csd-acc-title">
          {title}
          {typeof count === 'number' && count > 0 && <span className="csd-acc-count">{count}</span>}
        </span>
        {open ? <Minus size={18} strokeWidth={2.4} /> : <Plus size={18} strokeWidth={2.4} />}
      </button>
      {open && <div className="csd-acc-body">{children}</div>}
    </div>
  );
}

/* ── Empty state line ─────────────────────────────────────────────────── */
export function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="csd-empty">{children}</p>;
}

/* ── Inline link list (footer of an accordion) ────────────────────────── */
export function LinkList({ items }: { items: { href: string; label: string }[] }) {
  return (
    <div className="csd-linklist">
      {items.map((it) => (
        <Link key={it.label} href={it.href} className="csd-textlink">
          {it.label}
          <ChevronRight size={14} strokeWidth={2.4} />
        </Link>
      ))}
    </div>
  );
}

/* ── Status pill ─────────────────────────────────────────────────────── */
export function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, '-');
  return <span className={`csd-pill csd-pill-${key}`}>{status}</span>;
}

/* ── Data table (scrolls horizontally on small screens) ──────────────── */
export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (React.ReactNode)[][];
}) {
  return (
    <div className="csd-table-wrap">
      <table className="csd-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Pager ───────────────────────────────────────────────────────────── */
export function Pager({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  if (pageCount <= 1) return null;
  const nums: (number | '…')[] = [];
  for (let i = 1; i <= pageCount; i += 1) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  return (
    <div className="csd-pager">
      {nums.map((n, i) =>
        n === '…' ? (
          <span key={`e${i}`} className="csd-pager-ellipsis">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            className={`csd-pager-btn ${n === page ? 'is-active' : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ),
      )}
      {page < pageCount && (
        <button type="button" className="csd-pager-next" onClick={() => onChange(page + 1)}>
          Next <ChevronRight size={14} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

/* ── Auth gate hook ──────────────────────────────────────────────────── */
export function useDashboardAuth() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number | string; first_name: string; last_name: string } | null>(null);
  const [ready, setReady] = useState(false);

  React.useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!storedUser || !token) {
      router.push('/login');
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
      setReady(true);
    } catch {
      router.push('/login');
    }
  }, [router]);

  return { user, ready };
}
