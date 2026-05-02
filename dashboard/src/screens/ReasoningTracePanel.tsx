import { AnimatePresence, motion } from "framer-motion";
import { FadeIn } from "../components/FadeIn";
import type { DashboardData } from "../lib/dashboardData";

type RiskEvent = DashboardData['risk']['events'][number];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string | null;
  events?: RiskEvent[];
};

const SEVERITY_PILL: Record<string, string> = {
  critical: 'bg-error-container text-on-error-container border border-error-container/50',
  high: 'bg-error-container text-on-error-container border border-error-container/50',
  medium: 'bg-[#EA580C]/10 text-[#EA580C] border border-[#EA580C]/30',
  low: 'bg-[#CA8A04]/10 text-[#CA8A04] border border-[#CA8A04]/30',
  info: 'bg-surface-container text-on-surface-variant border border-outline-variant'
};

function severityLabel(s: string | null): string {
  if (s === 'critical' || s === 'high') return 'Critical risk';
  if (s === 'medium') return 'Elevated risk';
  if (s === 'low') return 'Watch';
  return 'Risk event';
}

function eventTitle(t: string): string {
  return (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function detectedAtLabel(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString()}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function pickIconFor(table: string | null | undefined): string {
  if (table === 'vitals') return 'favorite';
  if (table === 'adherence_events') return 'pill';
  if (table === 'symptoms') return 'mic';
  return 'fact_check';
}

export default function ReasoningTracePanel({ isOpen, onClose, eventId, events }: Props) {
  const list = events || [];
  const event = (eventId ? list.find(e => e.id === eventId) : null) || list[0] || null;

  const dataPoints: Array<{ table: string; id: string; summary?: string }> =
    Array.isArray(event?.data_point_refs?.data_points) ? event!.data_point_refs.data_points : [];
  const rulesFired: string[] =
    Array.isArray(event?.data_point_refs?.rules_fired) ? event!.data_point_refs.rules_fired : (event?.rule_fired ? [event.rule_fired] : []);
  const baseSeverity: string | undefined = event?.data_point_refs?.base_severity;
  const finalSeverity: string | undefined = event?.data_point_refs?.final_severity;
  const severityModifier: string | null | undefined = event?.data_point_refs?.severity_modifier;
  const llmTrace = event?.llm_reasoning_trace || null;
  const narrative = llmTrace?.narrative || event?.narrative_text || null;
  const interventionMessage = llmTrace?.intervention_message || null;
  const suggestedAction = llmTrace?.suggested_action || null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style>{`
            .material-symbols-outlined {
              font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            }
            .icon-fill { font-variation-settings: 'FILL' 1; }
          `}</style>
          <motion.div
            key="reasoning-backdrop"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            key="reasoning-panel"
            role="dialog"
            aria-label="Reasoning trace"
            className="fixed top-0 right-0 h-screen w-[480px] max-w-full bg-surface-container-lowest border-l border-outline-variant/30 shadow-[-4px_0_24px_rgba(0,0,0,0.08)] z-50 flex flex-col"
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex-none p-6 border-b border-outline-variant/30 bg-surface-container-lowest sticky top-0 z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label text-label ${SEVERITY_PILL[event?.severity || 'info']}`}>
                      {severityLabel(event?.severity || null)}
                    </span>
                    {event?.detected_at && (
                      <span className="text-on-surface-variant font-body-sm text-body-sm">{detectedAtLabel(event.detected_at)}</span>
                    )}
                  </div>
                  <h2 className="font-h2 text-h2 text-on-background m-0 truncate">
                    {event ? eventTitle(event.event_type) : 'No event selected'}
                  </h2>
                  {event && severityModifier === 'comorbidity_escalation' && (
                    <span className="text-[11px] text-on-surface-variant">
                      Severity escalated from <span className="font-medium">{baseSeverity}</span> to <span className="font-medium">{finalSeverity}</span> due to multi-condition burden.
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close reasoning panel"
                  className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high transition-colors -mr-1.5 -mt-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              {list.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {list.slice(0, 6).map(e => (
                    <button
                      key={e.id}
                      onClick={() => {/* parent can switch eventId via onMarkerClick instead */}}
                      className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full transition-colors ${
                        e.id === event?.id
                          ? 'bg-stone-900 text-white'
                          : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {eventTitle(e.event_type)} · {e.relative}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!event ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <p className="text-sm text-on-surface-variant">No risk events recorded yet for this patient. The reasoning trace will populate once the engine fires.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-bright">
                <FadeIn delay={0}>
                  <div className="px-4 py-4 border border-outline-variant/30 rounded-lg bg-surface-container-low/50">
                    <div className="flex items-center justify-between max-w-sm mx-auto relative h-[60px]">
                      <div className="absolute top-3 left-0 right-0 h-[2px] bg-primary-container/20 -z-0"></div>
                      <div className="absolute top-3 left-0 right-0 h-[2px] bg-primary-container -z-0"></div>
                      <PipelineStep n={dataPoints.length} label="Data points" />
                      <PipelineStep n={rulesFired.length} label="Rules" />
                      <PipelineStep icon="analytics" label="Pattern" />
                      <PipelineStep icon="assignment" label="Recommendation" />
                    </div>
                  </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                  <section className="space-y-3">
                    <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider">Data points referenced</h3>
                    {dataPoints.length === 0 ? (
                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-3">
                        <p className="text-body-sm font-body-sm text-on-surface-variant">No data points attached to this event.</p>
                      </div>
                    ) : (
                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg overflow-hidden">
                        <ul className="divide-y divide-outline-variant/30">
                          {dataPoints.map((dp, i) => (
                            <li key={`${dp.table}-${dp.id || i}`} className="p-3 flex items-start gap-3 hover:bg-surface-container-low transition-colors">
                              <span className="material-symbols-outlined text-on-surface-variant mt-0.5 text-[18px]">{pickIconFor(dp.table)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-body-sm text-body-sm text-on-background break-words">{dp.summary || `${dp.table || 'record'} ${dp.id ? `id ${String(dp.id).slice(0, 8)}…` : ''}`}</div>
                                <div className="text-[11px] text-outline mt-0.5">{dp.table || 'unknown source'}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                </FadeIn>

                <FadeIn delay={0.2}>
                  <section className="space-y-3">
                    <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider">Rules fired</h3>
                    <div className="flex flex-col gap-2">
                      {rulesFired.length === 0 ? (
                        <p className="text-body-sm font-body-sm text-on-surface-variant">No rules recorded.</p>
                      ) : rulesFired.map((rule, i) => (
                        <div key={i} className="bg-surface-container-lowest p-3 rounded-md border border-error-container/60 shadow-[0_1px_2px_rgba(28,25,23,0.02)]">
                          <div className="font-mono text-[12px] text-on-background uppercase tracking-wide break-all">{rule}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                </FadeIn>

                {narrative && (
                  <FadeIn delay={0.3}>
                    <section className="space-y-3">
                      <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider">Clinical narrative</h3>
                      <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/30 text-on-background font-body text-body leading-relaxed whitespace-pre-wrap">
                        {narrative}
                      </div>
                    </section>
                  </FadeIn>
                )}

                {interventionMessage && (
                  <FadeIn delay={0.35}>
                    <section className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider">Drafted Telegram message</h3>
                        {suggestedAction && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-container/15 text-primary-container border border-primary-container/30">{suggestedAction.replace(/_/g, ' ')}</span>}
                      </div>
                      <div className="bg-primary-fixed/30 p-4 rounded-lg border border-primary-container/30 text-on-background font-body text-body italic leading-relaxed whitespace-pre-wrap">
                        "{interventionMessage}"
                      </div>
                    </section>
                  </FadeIn>
                )}

                {event.guideline_citation && (
                  <FadeIn delay={0.4}>
                    <section className="space-y-3">
                      <div className="border-l-4 border-primary-container bg-surface-container-low p-4 rounded-r-lg">
                        <p className="font-label text-label text-on-surface-variant mb-1">Reference</p>
                        <p className="font-body-sm text-body-sm text-on-background">{event.guideline_citation}</p>
                      </div>
                    </section>
                  </FadeIn>
                )}
              </div>
            )}

            <div className="flex-none p-4 bg-surface-container border-t border-outline-variant/30">
              <p className="font-body-sm text-[11px] leading-[14px] text-on-surface-variant/80 text-center">
                Rules detected this event. The narrative was composed by Claude Sonnet 4. Clinical facts are not LLM-generated.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function PipelineStep({ n, label, icon }: { n?: number; label: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 relative z-10">
      <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-vital-sm text-[11px]">
        {icon ? <span className="material-symbols-outlined text-[14px]">{icon}</span> : (n ?? '—')}
      </div>
      <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-tighter">{label}</span>
    </div>
  );
}
