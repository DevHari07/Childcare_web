'use client';

import React, { useMemo, useRef, useState } from 'react';
import { money } from '@/lib/dashboardData';

type IconType = React.ComponentType<{ size?: number; strokeWidth?: number }>;
export type StatTone = 'accent' | 'success' | 'info' | 'neutral';

/* Design-system tokens used as chart roles (light-only, matches the app). */
const GRID = '#eef1f5';
const BASELINE = '#cbd5e1';
const SERIES = 'var(--primary-light)'; // #1d5fb8 — validated
const ACCENT = 'var(--accent)'; // #e05a1c — validated, emphasis only

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const s of [1, 2, 2.5, 5, 10]) if (s * mag >= v) return s * mag;
  return 10 * mag;
}

/* ── Card chrome ───────────────────────────────────────────────────────── */
export function ChartCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="csd-chart-card">
      <header className="csd-chart-head">
        <div>
          <h3 className="csd-chart-title">{title}</h3>
          {subtitle && <p className="csd-chart-sub">{subtitle}</p>}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

/* ── Stat tile ────────────────────────────────────────────────────────── */
export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  icon?: IconType;
  tone?: StatTone;
}) {
  return (
    <div className={`csd-stat csd-stat--${tone}`}>
      <div className="csd-stat-top">
        <span className="csd-stat-label">{label}</span>
        {Icon && (
          <span className="csd-stat-icon">
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="csd-stat-value">{value}</div>
      {sub && <div className="csd-stat-sub">{sub}</div>}
    </div>
  );
}

/* ── Area chart — single series, trend over time ───────────────────────── */
export function PaymentAreaChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 760;
  const H = 300;
  const m = { t: 18, r: 24, b: 36, l: 62 };
  const innerW = W - m.l - m.r;
  const innerH = H - m.t - m.b;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const { yMax, ptsX, ptsY, areaPath, linePath } = useMemo(() => {
    const max = niceMax(Math.max(...data.map((d) => d.value), 1));
    const px = data.map((_, i) => m.l + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW));
    const py = data.map((d) => m.t + innerH - (d.value / max) * innerH);
    const line = px.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${py[i].toFixed(1)}`).join(' ');
    const area = `${line} L${px[px.length - 1].toFixed(1)} ${(m.t + innerH).toFixed(1)} L${px[0].toFixed(1)} ${(m.t + innerH).toFixed(1)} Z`;
    return { yMax: max, ptsX: px, ptsY: py, areaPath: area, linePath: line };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));
  const lastIdx = data.length - 1;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((mx - m.l) / innerW) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const active = hover ?? lastIdx;

  return (
    <div className="csd-chart-plot" ref={wrapRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="csd-svg"
        role="img"
        aria-label={`Payments by month. Latest: ${money(data[lastIdx].value)} in ${data[lastIdx].label}.`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((tv, i) => {
          const y = m.t + innerH - (tv / yMax) * innerH;
          return (
            <g key={i}>
              <line x1={m.l} x2={W - m.r} y1={y} y2={y} stroke={i === 0 ? BASELINE : GRID} strokeWidth={1} />
              <text x={m.l - 10} y={y + 4} textAnchor="end" className="csd-axis-text">
                {tv.toLocaleString('en-US')}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => (
          <text key={i} x={ptsX[i]} y={H - 12} textAnchor="middle" className="csd-axis-text">
            {d.label}
          </text>
        ))}

        <path d={areaPath} fill={SERIES} opacity={0.1} />
        <path d={linePath} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* crosshair */}
        <line x1={ptsX[active]} x2={ptsX[active]} y1={m.t} y2={m.t + innerH} stroke={BASELINE} strokeWidth={1} />
        <circle cx={ptsX[active]} cy={ptsY[active]} r={4.5} fill={hover === null ? ACCENT : SERIES} stroke="#fff" strokeWidth={2} />

        {/* direct label on the last point */}
        {hover === null && (
          <text x={ptsX[lastIdx]} y={ptsY[lastIdx] - 12} textAnchor="middle" className="csd-point-label">
            {money(data[lastIdx].value)}
          </text>
        )}
      </svg>

      {hover !== null && (
        <div
          className="csd-tooltip"
          style={{ left: `${(ptsX[hover] / W) * 100}%`, top: `${(ptsY[hover] / H) * 100}%` }}
        >
          <div className="csd-tooltip-label">{data[hover].label}</div>
          <div className="csd-tooltip-value">
            <span className="csd-tooltip-dot" style={{ background: SERIES }} />
            {money(data[hover].value)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Horizontal bars — magnitude comparison, single hue ────────────────── */
export function BalanceBars({ data }: { data: { label: string; value: number }[] }) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="csd-bars">
      {data.map((d, i) => (
        <div
          key={d.label}
          className={`csd-bar-row ${hover === i ? 'is-hover' : ''}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <span className="csd-bar-label" title={d.label}>
            {d.label}
          </span>
          <span className="csd-bar-track">
            <span className="csd-bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: SERIES }} />
          </span>
          <span className="csd-bar-value">{money(d.value)}</span>
          {hover === i && (
            <div className="csd-tooltip csd-tooltip-bar">
              <div className="csd-tooltip-label">{d.label}</div>
              <div className="csd-tooltip-value">
                <span className="csd-tooltip-dot" style={{ background: SERIES }} />
                {money(d.value)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Meter — one ratio against a total ─────────────────────────────────── */
export function Meter({
  paid,
  total,
  label,
}: {
  paid: number;
  total: number;
  label?: string;
}) {
  const whole = paid + total;
  const pct = whole > 0 ? Math.round((paid / whole) * 100) : 0;
  return (
    <div className="csd-meter">
      {label && <div className="csd-meter-label">{label}</div>}
      <div className="csd-meter-track" role="img" aria-label={`${money(paid)} paid of ${money(whole)} (${pct}%)`}>
        <div className="csd-meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="csd-meter-legend">
        <span>
          <span className="csd-key csd-key-paid" /> Paid {money(paid)}
        </span>
        <span>
          <span className="csd-key csd-key-rem" /> Remaining {money(total)}
        </span>
      </div>
    </div>
  );
}

/* ── Mini meter (table cell) ──────────────────────────────────────────── */
export function MiniMeter({ paid, total }: { paid: number; total: number }) {
  const whole = paid + total || 1;
  const pct = Math.round((paid / whole) * 100);
  return (
    <span className="csd-minimeter" title={`${pct}% paid`}>
      <span className="csd-minimeter-fill" style={{ width: `${pct}%` }} />
    </span>
  );
}
