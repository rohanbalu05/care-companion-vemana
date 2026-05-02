import { motion } from "framer-motion";
import { useState, MouseEvent, useMemo } from "react";
import type { DashboardData } from "../lib/dashboardData";

type Severity = "watch" | "elevated" | "critical";

const severityColor: Record<Severity, string> = {
  watch:    "#CA8A04",
  elevated: "#EA580C",
  critical: "#DC2626",
};

const VIEW_W = 700;
const VIEW_H = 360;
const CHART_LEFT = 40;
const CHART_RIGHT = VIEW_W - 20;
const CHART_W = CHART_RIGHT - CHART_LEFT;

const MARKERS_TOP = 0,   MARKERS_BOTTOM = 60;
const BP_TOP      = 60,  BP_BOTTOM      = 180;
const GLU_TOP     = 180, GLU_BOTTOM     = 290;
const ADH_TOP     = 290, ADH_BOTTOM     = 330;

function istDayKey(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function istDayKeyForOffset(daysBack: number): string {
  const todayIst = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const [y, m, d] = todayIst.split('-').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d));
  ref.setUTCDate(ref.getUTCDate() - daysBack);
  return ref.toISOString().slice(0, 10);
}

function severityFromDb(s: string | null): Severity {
  if (!s) return 'watch';
  if (s === 'critical' || s === 'high') return 'critical';
  if (s === 'medium') return 'elevated';
  return 'watch';
}

type Props = {
  bp: DashboardData['vitals']['last_14_bp'];
  glucose: DashboardData['vitals']['last_14_glucose'];
  adherence: DashboardData['adherence_7d'];
  riskEvents: DashboardData['risk']['events'];
  recentEvents: DashboardData['recent_events'];
  onMarkerClick?: (eventId: string) => void;
};

export function RiskStoryTimeline({ bp, glucose, adherence, riskEvents, recentEvents, onMarkerClick }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const days = useMemo(() => {
    const arr: { key: string; date: Date; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const key = istDayKeyForOffset(i);
      const [y, m, d] = key.split('-').map(Number);
      arr.push({ key, date: new Date(Date.UTC(y, m - 1, d)), label: `D${14 - i}` });
    }
    return arr;
  }, []);

  const X_STEP = CHART_W / Math.max(1, days.length - 1);
  const xForIdx = (i: number) => CHART_LEFT + i * X_STEP;

  const bpByDay = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const r of bp || []) {
      const k = istDayKey(r.recorded_at);
      (map[k] ||= []).push(Number(r.systolic));
    }
    return map;
  }, [bp]);

  const gluByDay = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const r of glucose || []) {
      const k = istDayKey(r.recorded_at);
      (map[k] ||= []).push(Number(r.value));
    }
    return map;
  }, [glucose]);

  const adhByDay = useMemo(() => {
    const map: Record<string, 'taken' | 'missed' | 'pending'> = {};
    for (const d of adherence?.last_14_days || []) map[d.date] = d.status;
    return map;
  }, [adherence]);

  const bpSeries = days.map(d => {
    const arr = bpByDay[d.key];
    if (!arr || arr.length === 0) return null;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  });
  const gluSeries = days.map(d => {
    const arr = gluByDay[d.key];
    if (!arr || arr.length === 0) return null;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  });

  const bpVals = bpSeries.filter(v => v != null) as number[];
  const gluVals = gluSeries.filter(v => v != null) as number[];
  const BP_MIN = bpVals.length ? Math.min(120, ...bpVals) - 5 : 120;
  const BP_MAX = bpVals.length ? Math.max(150, ...bpVals) + 5 : 160;
  const GLU_MIN = gluVals.length ? Math.min(110, ...gluVals) - 5 : 110;
  const GLU_MAX = gluVals.length ? Math.max(160, ...gluVals) + 5 : 200;

  const yForBP  = (sys: number) => BP_TOP  + ((BP_MAX  - sys) / Math.max(1, BP_MAX  - BP_MIN))  * (BP_BOTTOM  - BP_TOP);
  const yForGlu = (g: number)   => GLU_TOP + ((GLU_MAX - g)   / Math.max(1, GLU_MAX - GLU_MIN)) * (GLU_BOTTOM - GLU_TOP);

  const BP_THRESH_Y  = yForBP(140);
  const GLU_THRESH_Y = yForGlu(140);

  function buildPath(values: (number | null)[], yFn: (v: number) => number): string {
    let path = '';
    let started = false;
    values.forEach((v, i) => {
      if (v == null) { started = false; return; }
      const x = xForIdx(i);
      const y = yFn(v);
      path += `${started ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)} `;
      started = true;
    });
    return path.trim();
  }

  const bpPath = buildPath(bpSeries, yForBP);
  const gluPath = buildPath(gluSeries, yForGlu);

  const adhPerDay = days.map(d => adhByDay[d.key] || 'pending');

  const riskMarkers = (riskEvents || []).map(ev => {
    const k = istDayKey(ev.detected_at);
    const idx = days.findIndex(d => d.key === k);
    return { id: ev.id, idx: idx >= 0 ? idx : days.length - 1, label: ev.event_type.replace(/_/g, ' '), severity: severityFromDb(ev.severity), large: ev.event_type === 'multi_factor_pattern' };
  }).filter(m => m.idx >= 0);

  const symptomMarkers = (recentEvents || [])
    .filter(e => e.kind === 'symptom')
    .map(e => {
      const k = istDayKey(e.recorded_at);
      const idx = days.findIndex(d => d.key === k);
      return { idx, label: e.label };
    })
    .filter(m => m.idx >= 0)
    .slice(0, 3);

  const hasAnyData = bpVals.length > 0 || gluVals.length > 0 || adhPerDay.some(s => s !== 'pending') || riskMarkers.length > 0;

  function onMove(e: MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xVB = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    if (xVB < CHART_LEFT - X_STEP / 2 || xVB > CHART_RIGHT + X_STEP / 2) {
      setHoverIdx(null);
      return;
    }
    const idx = Math.round((xVB - CHART_LEFT) / X_STEP);
    setHoverIdx(idx >= 0 && idx < days.length ? idx : null);
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_2px_4px_rgba(28,25,23,0.02)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-h2 text-h2 text-on-surface">Risk Story Timeline</h2>
        <span className="font-label text-label text-on-surface-variant">Last 14 days · live</span>
      </div>

      {!hasAnyData ? (
        <div className="py-12 text-center">
          <p className="text-sm text-on-surface-variant">No vitals or risk events in the last 14 days.</p>
          <p className="text-[12px] text-outline mt-1">Once the patient logs a reading on Telegram, it will appear here.</p>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="w-full h-auto"
            onMouseMove={onMove}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={MARKERS_BOTTOM} y2={MARKERS_BOTTOM} stroke="#E5E9E7" />
            <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={BP_BOTTOM}      y2={BP_BOTTOM}      stroke="#E5E9E7" />
            <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={GLU_BOTTOM}     y2={GLU_BOTTOM}     stroke="#E5E9E7" />
            <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={ADH_BOTTOM}     y2={ADH_BOTTOM}     stroke="#E5E9E7" />

            <rect x={CHART_LEFT} y={BP_TOP} width={CHART_W} height={BP_THRESH_Y - BP_TOP} fill="#FEF2F2" />
            <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={BP_THRESH_Y} y2={BP_THRESH_Y} stroke="#DC2626" strokeOpacity="0.4" strokeDasharray="3 3" strokeWidth="0.75" />
            <text x={CHART_LEFT - 6} y={BP_TOP + 14} textAnchor="end" fontSize="10" fill="#3e4947">BP</text>
            <text x={CHART_LEFT - 6} y={BP_THRESH_Y - 2} textAnchor="end" fontSize="8" fill="#DC2626">140</text>

            {bpPath && (
              <motion.path
                d={bpPath}
                fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1.0, ease: "easeInOut" }}
              />
            )}
            {bpSeries.map((v, i) => v != null ? (
              <circle key={`bp${i}`} cx={xForIdx(i)} cy={yForBP(v)} r="2.5" fill="#0F766E" />
            ) : null)}

            <rect x={CHART_LEFT} y={GLU_TOP} width={CHART_W} height={GLU_THRESH_Y - GLU_TOP} fill="#FEF2F2" />
            <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={GLU_THRESH_Y} y2={GLU_THRESH_Y} stroke="#DC2626" strokeOpacity="0.4" strokeDasharray="3 3" strokeWidth="0.75" />
            <text x={CHART_LEFT - 6} y={GLU_TOP + 14} textAnchor="end" fontSize="10" fill="#3e4947">FBG</text>
            <text x={CHART_LEFT - 6} y={GLU_THRESH_Y - 2} textAnchor="end" fontSize="8" fill="#DC2626">140</text>

            {gluPath && (
              <motion.path
                d={gluPath}
                fill="none" stroke="#7F4025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1.0, delay: 0.2, ease: "easeInOut" }}
              />
            )}
            {gluSeries.map((v, i) => v != null ? (
              <circle key={`fbg${i}`} cx={xForIdx(i)} cy={yForGlu(v)} r="2.5" fill="#7F4025" />
            ) : null)}

            <text x={CHART_LEFT - 6} y={ADH_TOP + 22} textAnchor="end" fontSize="10" fill="#3e4947">Meds</text>

            {Array.from({ length: 14 }, (_, i) => {
              const status = adhPerDay[i];
              const taken = status === 'taken';
              const missed = status === 'missed';
              const fill = taken ? '#16A34A' : missed ? '#DC2626' : '#D7DBD9';
              const op = taken ? 0.25 : missed ? 0.7 : 0.35;
              return (
                <motion.rect
                  key={`adh${i}`}
                  x={xForIdx(i) - X_STEP / 2 + 2}
                  y={ADH_TOP + 8}
                  width={Math.max(2, X_STEP - 4)}
                  height={20}
                  rx={3}
                  fill={fill}
                  fillOpacity={op}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.2, delay: 0.6 + i * 0.04 }}
                />
              );
            })}

            {symptomMarkers.map((m, i) => (
              <g key={`sym${i}`}>
                <text x={xForIdx(m.idx)} y={ADH_BOTTOM + 14} textAnchor="middle" fontSize="11" fill="#625E59">🎙</text>
              </g>
            ))}

            {days.map((d, i) => (
              <text key={`d${i}`} x={xForIdx(i)} y={VIEW_H - 4} textAnchor="middle" fontSize="9" fill="#6e7977">{d.label}</text>
            ))}

            {riskMarkers.map((m, i) => (
              <motion.circle
                key={`r${m.id}`}
                cx={xForIdx(m.idx)}
                cy={MARKERS_TOP + 30}
                r={m.large ? 10 : 7}
                fill={severityColor[m.severity]}
                stroke="#ffffff"
                strokeWidth="2"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  delay: 1.2 + i * 0.08,
                  type: "spring",
                  stiffness: 400,
                  damping: 12
                }}
                style={{ transformBox: "fill-box", transformOrigin: "center", cursor: onMarkerClick ? "pointer" : "default" }}
                onClick={() => onMarkerClick?.(m.id)}
              >
                <title>{`${m.label}${onMarkerClick ? " — click for reasoning" : ""}`}</title>
              </motion.circle>
            ))}

            {hoverIdx !== null && (
              <line
                x1={xForIdx(hoverIdx)} x2={xForIdx(hoverIdx)}
                y1={MARKERS_TOP} y2={ADH_BOTTOM + 8}
                stroke="#3e4947" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 2"
                pointerEvents="none"
              />
            )}
          </svg>

          {hoverIdx !== null && (
            <div
              className="absolute pointer-events-none bg-inverse-surface text-inverse-on-surface rounded-md px-3 py-2 text-[11px] shadow-lg whitespace-nowrap"
              style={{
                left: `${(xForIdx(hoverIdx) / VIEW_W) * 100}%`,
                top: 0,
                transform: "translate(-50%, -110%)"
              }}
            >
              <div className="font-semibold mb-0.5">{days[hoverIdx].date.toLocaleDateString(undefined, { timeZone: 'UTC', day: '2-digit', month: 'short' })}</div>
              <div className="font-mono">BP {bpSeries[hoverIdx] ?? '—'}</div>
              <div className="font-mono">FBG {gluSeries[hoverIdx] ?? '—'}</div>
              <div className="opacity-80 mt-1">
                Meds {(() => {
                  const status = adhPerDay[hoverIdx];
                  if (status === 'taken') return '✓';
                  if (status === 'missed') return '✗';
                  return '—';
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-on-surface-variant">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]"></span> BP (sys avg)</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7F4025]"></span> FBG</span>
        <span className="w-px h-3 bg-outline-variant" />
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#CA8A04]"></span> Watch</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]"></span> Elevated</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span> Critical</span>
      </div>

      {(() => {
        const latest = (riskEvents || [])[0];
        if (!latest) return null;
        return (
          <motion.div
            className="mt-6 border-t border-outline-variant pt-6"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 1.8, ease: "easeOut" }}
          >
            <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider mb-3">Pattern narrative</h3>
            {latest.narrative_text && latest.narrative_text.trim().length > 0 ? (
              <p className="font-body text-body text-on-surface leading-relaxed max-w-prose whitespace-pre-wrap">{latest.narrative_text}</p>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant italic">No narrative attached. Rule output is in the reasoning trace.</p>
            )}
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">
              Most recent event: <span className="font-mono text-[12px] bg-error-container/40 text-on-error-container px-1.5 py-0.5 rounded">{latest.event_type.replace(/_/g, ' ')}</span> · {latest.relative}
            </p>
            {latest.guideline_citation && (
              <div className="flex flex-wrap gap-2 mt-5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-fixed/40 text-on-primary-fixed-variant rounded-full text-[11px] font-label font-medium">
                  <span className="material-symbols-outlined text-[14px]">menu_book</span>
                  {latest.guideline_citation}
                </span>
              </div>
            )}
          </motion.div>
        );
      })()}
    </div>
  );
}

export default RiskStoryTimeline;
