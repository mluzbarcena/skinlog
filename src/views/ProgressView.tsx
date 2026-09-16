/* =============================================================================
   ProgressView — 7/30-day stats and a tolerance trend chart (inline SVG).
   ============================================================================= */

import { todayStr } from "../domain/dates";
import { stats } from "../domain/logic";
import { useStore } from "../state/useStore";
import { useI18n } from "../i18n/useI18n";
import type { Stats } from "../domain/types";
import type { Dict } from "../i18n/es";

function StatCard({ k, v, sub }: { k: string; v: React.ReactNode; sub?: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">
        {v} {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

function TolChart({ series, t }: { series: Stats["tolSeries"]; t: Dict }) {
  const pts = series.map((p, i) => ({ i, v: p.value })).filter((p) => p.v != null) as { i: number; v: number }[];
  if (pts.length === 0) return <div className="chart-empty">{t.progress.chartEmpty}</div>;

  const W = 320,
    H = 132,
    padL = 22,
    padR = 8,
    padT = 10,
    padB = 18;
  const n = series.length;
  const x = (i: number) => padL + (i / Math.max(1, n - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / 3) * (H - padT - padB);
  const colors = ["--tol0", "--tol1", "--tol2", "--tol3"];

  const grid = [];
  for (let g = 0; g <= 3; g++) {
    const gy = y(g);
    grid.push(
      <line
        key={"g" + g}
        x1={padL}
        y1={gy}
        x2={W - padR}
        y2={gy}
        stroke="var(--border)"
        strokeWidth={1}
        strokeDasharray={g > 0 ? "2 3" : undefined}
      />,
    );
    grid.push(
      <text key={"t" + g} x={padL - 5} y={gy + 3} textAnchor="end" fontSize={9} fill="var(--muted)">
        {g}
      </text>,
    );
  }
  const line = pts.map((p, k) => (k ? "L" : "M") + x(p.i).toFixed(1) + " " + y(p.v).toFixed(1)).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.progress.chartTitle}>
      {grid}
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p) => (
        <circle key={p.i} cx={x(p.i).toFixed(1)} cy={y(p.v).toFixed(1)} r={3.1} fill={`var(${colors[p.v]})`} />
      ))}
    </svg>
  );
}

export function ProgressView() {
  const state = useStore();
  const { t } = useI18n();
  const today = todayStr();
  const s7 = stats(state, today, 7);
  const s30 = stats(state, today, 30);
  const avg30 = s30.tolAvg == null ? "—" : s30.tolAvg.toFixed(1);

  return (
    <section className="view" aria-label={t.nav.progress}>
      <div className="section-title">{t.progress.last7}</div>
      <div className="statgrid">
        <StatCard k={t.progress.morningsComplete} v={s7.amComplete} sub={t.progress.outOf(s7.totalDays)} />
        <StatCard k={t.progress.nightsComplete} v={s7.pmComplete} sub={t.progress.outOf(s7.totalDays)} />
        <StatCard k={t.progress.retinol} v={s7.retinol} sub={t.progress.applications} />
        <StatCard k={t.progress.sana} v={s7.sana} sub={t.progress.applications} />
        <StatCard k={t.progress.recovery} v={s7.recovery} sub={t.progress.nights} />
        <StatCard k={t.progress.irritationDays} v={s7.irritation} sub={t.progress.modOrMore} />
      </div>

      <div className="section-title">{t.progress.last30}</div>
      <div className="statgrid">
        <StatCard k={t.progress.morningsComplete} v={s30.amPct + "%"} />
        <StatCard k={t.progress.nightsComplete} v={s30.pmPct + "%"} />
        <StatCard k={t.progress.retinol} v={s30.retinol} sub={t.progress.applications} />
        <StatCard k={t.progress.sana} v={s30.sana} sub={t.progress.applications} />
        <StatCard k={t.progress.recovery} v={s30.recovery} sub={t.progress.nights} />
        <StatCard k={t.progress.avgTolerance} v={avg30} sub={t.progress.outOf3} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>{t.progress.chartTitle}</h2>
        <div className="chart-wrap">
          <TolChart series={s30.tolSeries} t={t} />
        </div>
        <div className="cal-legend" style={{ marginTop: 10 }}>
          <span>
            <i className="swatch" style={{ background: "var(--tol0)" }} /> {t.progress.legend0}
          </span>
          <span>
            <i className="swatch" style={{ background: "var(--tol2)" }} /> {t.progress.legend2}
          </span>
          <span>
            <i className="swatch" style={{ background: "var(--tol3)" }} /> {t.progress.legend3}
          </span>
        </div>
      </div>
      <p className="disclaimer">{t.progress.disclaimer}</p>
    </section>
  );
}
