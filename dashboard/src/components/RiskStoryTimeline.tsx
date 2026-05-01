import { motion } from "framer-motion";
import { useState, MouseEvent } from "react";

const bpData = [
  { sys: 138, dia: 86 }, { sys: 139, dia: 87 }, { sys: 141, dia: 88 }, { sys: 142, dia: 89 },
  { sys: 140, dia: 88 }, { sys: 143, dia: 90 }, { sys: 144, dia: 90 }, { sys: 146, dia: 91 },
  { sys: 145, dia: 92 }, { sys: 148, dia: 91 }, { sys: 149, dia: 93 }, { sys: 152, dia: 94 },
  { sys: 150, dia: 93 }, { sys: 148, dia: 92 },
];

const fbgData = [138, 140, 139, 142, 141, 145, 143, 146, 148, 150, 178, 165, 158, 156];

const amlodipine = [true, true, true, true, true, false, true, false, true, true, true, true, true, true];
const metformin  = [true, true, true, false, true, true, true, true, true, true, true, false, true, true];

type Severity = "watch" | "elevated" | "critical";
type RiskMarker = { day: number; label: string; severity: Severity; large?: boolean };

const riskMarkers: RiskMarker[] = [
  { day: 3,  label: "BP creeping up",                severity: "watch"    },
  { day: 6,  label: "Missed amlodipine",             severity: "elevated" },
  { day: 8,  label: "Missed amlodipine again",       severity: "elevated" },
  { day: 9,  label: "Heavy-headed voice note",       severity: "elevated" },
  { day: 11, label: "FBG spike 178",                 severity: "critical" },
  { day: 12, label: "BP 152/94 sustained",           severity: "critical" },
  { day: 13, label: "Multi-factor pattern detected", severity: "critical", large: true },
];

const severityColor: Record<Severity, string> = {
  watch:    "#CA8A04",
  elevated: "#EA580C",
  critical: "#DC2626",
};

const VIEW_W = 700;
const VIEW_H = 430;
const CHART_LEFT  = 40;
const CHART_RIGHT = VIEW_W - 20;
const CHART_W = CHART_RIGHT - CHART_LEFT;
const X_STEP = CHART_W / 13;

const MARKERS_TOP = 0,   MARKERS_BOTTOM = 60;
const BP_TOP      = 60,  BP_BOTTOM      = 200;
const GLU_TOP     = 200, GLU_BOTTOM     = 340;
const ADH_TOP     = 340, ADH_BOTTOM     = 390;
const SYM_TOP     = 390, SYM_BOTTOM     = 430;

const BP_MIN = 130, BP_MAX = 160;
const GLU_MIN = 130, GLU_MAX = 180;

const xForDay = (d: number) => CHART_LEFT + (d - 1) * X_STEP;
const yForBP  = (sys: number) => BP_TOP  + ((BP_MAX  - sys) / (BP_MAX  - BP_MIN))  * (BP_BOTTOM  - BP_TOP);
const yForGlu = (g: number)   => GLU_TOP + ((GLU_MAX - g)   / (GLU_MAX - GLU_MIN)) * (GLU_BOTTOM - GLU_TOP);

const BP_THRESH_Y  = yForBP(140);
const GLU_THRESH_Y = yForGlu(140);

const bpPath  = bpData .map((p, i) => `${i === 0 ? "M" : "L"} ${xForDay(i + 1)} ${yForBP(p.sys)}`).join(" ");
const gluPath = fbgData.map((g, i) => `${i === 0 ? "M" : "L"} ${xForDay(i + 1)} ${yForGlu(g)}`).join(" ");

export function RiskStoryTimeline() {
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  function onMove(e: MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xVB = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    if (xVB < CHART_LEFT - X_STEP / 2 || xVB > CHART_RIGHT + X_STEP / 2) {
      setHoverDay(null);
      return;
    }
    const day = Math.round((xVB - CHART_LEFT) / X_STEP) + 1;
    setHoverDay(day >= 1 && day <= 14 ? day : null);
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_2px_4px_rgba(28,25,23,0.02)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-h2 text-h2 text-on-surface">Risk Story Timeline</h2>
        <span className="font-label text-label text-on-surface-variant">Last 14 days</span>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto"
          onMouseMove={onMove}
          onMouseLeave={() => setHoverDay(null)}
        >
          <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={MARKERS_BOTTOM} y2={MARKERS_BOTTOM} stroke="#E5E9E7" />
          <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={BP_BOTTOM}      y2={BP_BOTTOM}      stroke="#E5E9E7" />
          <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={GLU_BOTTOM}     y2={GLU_BOTTOM}     stroke="#E5E9E7" />
          <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={ADH_BOTTOM}     y2={ADH_BOTTOM}     stroke="#E5E9E7" />

          <rect x={CHART_LEFT} y={BP_TOP} width={CHART_W} height={BP_THRESH_Y - BP_TOP} fill="#FEF2F2" />
          <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={BP_THRESH_Y} y2={BP_THRESH_Y} stroke="#DC2626" strokeOpacity="0.4" strokeDasharray="3 3" strokeWidth="0.75" />
          <text x={CHART_LEFT - 6} y={BP_TOP + 14} textAnchor="end" fontSize="10" fill="#3e4947">BP</text>
          <text x={CHART_LEFT - 6} y={BP_THRESH_Y - 2} textAnchor="end" fontSize="8" fill="#DC2626">140</text>

          <motion.path
            d={bpPath}
            fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
          {bpData.map((p, i) => (
            <circle key={`bp${i}`} cx={xForDay(i + 1)} cy={yForBP(p.sys)} r="2.5" fill="#0F766E" />
          ))}

          <rect x={CHART_LEFT} y={GLU_TOP} width={CHART_W} height={GLU_THRESH_Y - GLU_TOP} fill="#FEF2F2" />
          <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={GLU_THRESH_Y} y2={GLU_THRESH_Y} stroke="#DC2626" strokeOpacity="0.4" strokeDasharray="3 3" strokeWidth="0.75" />
          <text x={CHART_LEFT - 6} y={GLU_TOP + 14} textAnchor="end" fontSize="10" fill="#3e4947">FBG</text>
          <text x={CHART_LEFT - 6} y={GLU_THRESH_Y - 2} textAnchor="end" fontSize="8" fill="#DC2626">140</text>

          <motion.path
            d={gluPath}
            fill="none" stroke="#7F4025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
          />
          {fbgData.map((g, i) => (
            <circle key={`fbg${i}`} cx={xForDay(i + 1)} cy={yForGlu(g)} r="2.5" fill="#7F4025" />
          ))}

          <text x={CHART_LEFT - 6} y={ADH_TOP + 14} textAnchor="end" fontSize="9" fill="#3e4947">Aml</text>
          <text x={CHART_LEFT - 6} y={ADH_TOP + 35} textAnchor="end" fontSize="9" fill="#3e4947">Met</text>

          {amlodipine.map((taken, i) => (
            <motion.rect
              key={`a${i}`}
              x={xForDay(i + 1) - X_STEP / 2 + 2}
              y={ADH_TOP + 4}
              width={X_STEP - 4}
              height={18}
              rx={3}
              fill={taken ? "#16A34A" : "#DC2626"}
              fillOpacity={taken ? 0.25 : 0.7}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.2, delay: 1.0 + i * 0.08 }}
            />
          ))}
          {metformin.map((taken, i) => (
            <motion.rect
              key={`m${i}`}
              x={xForDay(i + 1) - X_STEP / 2 + 2}
              y={ADH_TOP + 26}
              width={X_STEP - 4}
              height={18}
              rx={3}
              fill={taken ? "#16A34A" : "#DC2626"}
              fillOpacity={taken ? 0.25 : 0.7}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.2, delay: 1.0 + i * 0.08 }}
            />
          ))}

          <text x={xForDay(9)} y={SYM_TOP + 18} textAnchor="middle" fontSize="14" fill="#625E59">🎙</text>
          <text x={xForDay(9)} y={SYM_TOP + 32} textAnchor="middle" fontSize="9" fill="#3e4947">heavy-headed</text>

          {Array.from({ length: 14 }, (_, i) => i + 1).map((d) => (
            <text key={`d${d}`} x={xForDay(d)} y={VIEW_H - 2} textAnchor="middle" fontSize="9" fill="#6e7977">D{d}</text>
          ))}

          {riskMarkers.map((m, i) => (
            <motion.circle
              key={`r${i}`}
              cx={xForDay(m.day)}
              cy={MARKERS_TOP + 30}
              r={m.large ? 10.5 : 7}
              fill={severityColor[m.severity]}
              stroke="#ffffff"
              strokeWidth="2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: 1.5 + i * 0.1,
                type: "spring",
                stiffness: 400,
                damping: 12,
              }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
              <title>{`Day ${m.day}: ${m.label}`}</title>
            </motion.circle>
          ))}

          <motion.circle
            cx={xForDay(13)}
            cy={MARKERS_TOP + 30}
            r={10.5}
            fill="none"
            stroke="#DC2626"
            strokeWidth="2"
            initial={{ scale: 1, opacity: 0 }}
            whileInView={{
              scale: [1, 1.8, 1.8],
              opacity: [0.7, 0, 0],
            }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              delay: 2.7,
              duration: 1.6,
              times: [0, 0.7, 1],
              repeat: Infinity,
              ease: "easeOut",
            }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />

          {hoverDay !== null && (
            <line
              x1={xForDay(hoverDay)} x2={xForDay(hoverDay)}
              y1={MARKERS_TOP} y2={SYM_BOTTOM}
              stroke="#3e4947" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 2"
              pointerEvents="none"
            />
          )}
        </svg>

        {hoverDay !== null && (
          <div
            className="absolute pointer-events-none bg-inverse-surface text-inverse-on-surface rounded-md px-3 py-2 text-[11px] shadow-lg whitespace-nowrap"
            style={{
              left: `${(xForDay(hoverDay) / VIEW_W) * 100}%`,
              top: 0,
              transform: "translate(-50%, -110%)",
            }}
          >
            <div className="font-semibold mb-0.5">Day {hoverDay}</div>
            <div className="font-mono">BP {bpData[hoverDay - 1].sys}/{bpData[hoverDay - 1].dia}</div>
            <div className="font-mono">FBG {fbgData[hoverDay - 1]}</div>
            <div className="opacity-80 mt-1">
              Aml {amlodipine[hoverDay - 1] ? "✓" : "✗"} · Met {metformin[hoverDay - 1] ? "✓" : "✗"}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-on-surface-variant">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]"></span> BP (sys)</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7F4025]"></span> FBG</span>
        <span className="w-px h-3 bg-outline-variant" />
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#CA8A04]"></span> Watch</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]"></span> Elevated</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span> Critical</span>
      </div>

      <motion.div
        className="mt-6 border-t border-outline-variant pt-6"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: 2.5, ease: "easeOut" }}
      >
        <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider mb-3">Pattern narrative</h3>
        <div className="space-y-3 max-w-prose">
          <p className="font-body text-body text-on-surface leading-relaxed">
            Mrs. Sharma's blood pressure has trended upward from a baseline of 138/86 to a peak of 152/94 over 14 days. Two consecutive missed Amlodipine doses on Days 6 and 8 align directly with the steepest portion of the climb — calcium channel blockade discontinuation correlates tightly with the ~10 mmHg systolic rise that follows.
          </p>
          <p className="font-body text-body text-on-surface leading-relaxed">
            A glucose excursion to 178 mg/dL on Day 11, coupled with a "heavy-headed" voice note on Day 9 in Hindi, confirms a multi-factor decline rather than an isolated reading. The pattern triggered <span className="font-mono text-[12px] bg-error-container/40 text-on-error-container px-1.5 py-0.5 rounded">MULTI_FACTOR_PATTERN</span> on Day 13.
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Recommend immediate Telegram check-in to confirm Amlodipine adherence before considering dose titration. Glucose elevation should resolve once BP control is restored.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-fixed/40 text-on-primary-fixed-variant rounded-full text-[11px] font-label font-medium">
            <span className="material-symbols-outlined text-[14px]">menu_book</span>
            RSSDI 2022 §4.3
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-fixed/40 text-on-primary-fixed-variant rounded-full text-[11px] font-label font-medium">
            <span className="material-symbols-outlined text-[14px]">menu_book</span>
            ICMR HTN 2021
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export default RiskStoryTimeline;
