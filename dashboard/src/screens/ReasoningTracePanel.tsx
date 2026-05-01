import { AnimatePresence, motion } from "framer-motion";
import { FadeIn } from "../components/FadeIn";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string | null;
};

export default function ReasoningTracePanel({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style>{`
            .material-symbols-outlined {
              font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            }
            .icon-fill {
              font-variation-settings: 'FILL' 1;
            }
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
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label text-label border border-error-container/50">Critical Risk</span>
                    <span className="text-on-surface-variant font-body-sm text-body-sm">Detected: Day 13, 09:42 IST</span>
                  </div>
                  <h2 className="font-h2 text-h2 text-on-background m-0">Pattern detected — multi-factor decline</h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close reasoning panel"
                  className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high transition-colors -mr-1.5 -mt-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-bright">
              <FadeIn delay={0}>
                <div className="px-4 py-4 border border-outline-variant/30 rounded-lg bg-surface-container-low/50">
                  <div className="flex items-center justify-between max-w-sm mx-auto relative h-[60px]">
                    <div className="absolute top-3 left-0 right-0 h-[2px] bg-primary-container/20 -z-0"></div>
                    <div className="absolute top-3 left-0 right-0 h-[2px] bg-primary-container -z-0"></div>
                    <div className="flex flex-col items-center gap-1.5 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-vital-sm text-[11px]">7</div>
                      <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-tighter">Data</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-vital-sm text-[11px]">4</div>
                      <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-tighter">Rules</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-vital-sm text-[11px]">
                        <span className="material-symbols-outlined text-[14px]">analytics</span>
                      </div>
                      <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-tighter">Pattern</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-vital-sm text-[11px]">
                        <span className="material-symbols-outlined text-[14px]">assignment</span>
                      </div>
                      <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-tighter">Rec</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <section className="space-y-4">
                  <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider">DATA POINTS REFERENCED</h3>
                  <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg overflow-hidden">
                    <ul className="divide-y divide-outline-variant/30">
                      <li className="p-3 flex items-start gap-3 hover:bg-surface-container-low transition-colors">
                        <span className="material-symbols-outlined text-error mt-0.5 text-[18px]">favorite</span>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-vital-sm text-vital-sm text-on-background">BP 152/94</span>
                            <span className="text-on-surface-variant font-body-sm text-body-sm">Day 12</span>
                          </div>
                          <div className="text-on-surface-variant font-body-sm text-body-sm mt-0.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">image</span> photo from Telegram, OCR confidence 98%
                          </div>
                        </div>
                      </li>
                      <li className="p-3 flex items-start gap-3 hover:bg-surface-container-low transition-colors">
                        <span className="material-symbols-outlined text-error mt-0.5 text-[18px]">favorite</span>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-vital-sm text-vital-sm text-on-background">BP 148/91</span>
                            <span className="text-on-surface-variant font-body-sm text-body-sm">Day 10</span>
                          </div>
                          <div className="text-on-surface-variant font-body-sm text-body-sm mt-0.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">image</span> photo
                          </div>
                        </div>
                      </li>
                      <li className="p-3 flex items-start gap-3 hover:bg-surface-container-low transition-colors">
                        <span className="material-symbols-outlined text-primary mt-0.5 text-[18px]">favorite</span>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-vital-sm text-vital-sm text-on-background">BP 144/90</span>
                            <span className="text-on-surface-variant font-body-sm text-body-sm">Day 8</span>
                          </div>
                          <div className="text-on-surface-variant font-body-sm text-body-sm mt-0.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">image</span> photo
                          </div>
                        </div>
                      </li>
                      <li className="p-3 flex items-start gap-3 hover:bg-surface-container-low transition-colors">
                        <span className="material-symbols-outlined text-error mt-0.5 text-[18px] icon-fill">pill</span>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-vital-sm text-vital-sm text-on-background">Amlodipine missed</span>
                            <span className="text-on-surface-variant font-body-sm text-body-sm">Day 8</span>
                          </div>
                          <div className="text-on-surface-variant font-body-sm text-body-sm mt-0.5">scheduled 7:00 IST</div>
                        </div>
                      </li>
                      <li className="p-3 flex items-start gap-3 hover:bg-surface-container-low transition-colors">
                        <span className="material-symbols-outlined text-error mt-0.5 text-[18px] icon-fill">pill</span>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-vital-sm text-vital-sm text-on-background">Amlodipine missed</span>
                            <span className="text-on-surface-variant font-body-sm text-body-sm">Day 6</span>
                          </div>
                          <div className="text-on-surface-variant font-body-sm text-body-sm mt-0.5">scheduled 7:00 IST</div>
                        </div>
                      </li>
                      <li className="p-3 flex items-start gap-3 hover:bg-surface-container-low transition-colors">
                        <span className="material-symbols-outlined text-tertiary mt-0.5 text-[18px]">water_drop</span>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-vital-sm text-vital-sm text-on-background">FBG 178</span>
                            <span className="text-on-surface-variant font-body-sm text-body-sm">Day 11</span>
                          </div>
                          <div className="text-on-surface-variant font-body-sm text-body-sm mt-0.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">image</span> photo
                          </div>
                        </div>
                      </li>
                      <li className="p-3 flex items-start gap-3 hover:bg-surface-container-low transition-colors">
                        <span className="material-symbols-outlined text-primary mt-0.5 text-[18px]">mic</span>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-body text-body text-on-background font-medium">Voice note: 'heavy-headed'</span>
                            <span className="text-on-surface-variant font-body-sm text-body-sm">Day 9</span>
                          </div>
                          <div className="text-on-surface-variant font-body-sm text-body-sm mt-1 italic border-l-2 border-outline-variant/50 pl-2 ml-1">
                            Original Hindi: 'सिर भारी लग रहा है' (transcribed &amp; translated)
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </section>
              </FadeIn>
              <FadeIn delay={0.2}>
                <section className="space-y-4">
                  <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider">RULES FIRED</h3>
                  <div className="flex flex-col gap-3">
                    <div className="bg-surface-container-lowest p-3 rounded-md border border-error-container/60 shadow-[0_1px_2px_rgba(28,25,23,0.02)]">
                      <div className="font-vital-sm text-vital-sm text-on-background mb-1">BP_THRESHOLD_BREACH</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">3+ readings ≥140/90 within 14 days</div>
                    </div>
                    <div className="bg-surface-container-lowest p-3 rounded-md border border-error-container/60 shadow-[0_1px_2px_rgba(28,25,23,0.02)]">
                      <div className="font-vital-sm text-vital-sm text-on-background mb-1">ADHERENCE_GAP_CRITICAL</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">2 missed doses of same medication within 3 days</div>
                    </div>
                    <div className="bg-surface-container-lowest p-3 rounded-md border border-outline-variant/40 shadow-[0_1px_2px_rgba(28,25,23,0.02)]">
                      <div className="font-vital-sm text-vital-sm text-on-background mb-1">GLUCOSE_EXCURSION</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">FBG ≥140 on 1+ readings (Asha's baseline 140)</div>
                    </div>
                    <div className="bg-surface-container-lowest p-3 rounded-md border border-error-container bg-error-container/10 shadow-[0_1px_2px_rgba(28,25,23,0.02)]">
                      <div className="font-vital-sm text-vital-sm text-on-error-container mb-1">MULTI_FACTOR_PATTERN</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">2+ rules fired within 72h window</div>
                    </div>
                  </div>
                </section>
              </FadeIn>
              <FadeIn delay={0.3}>
                <section className="space-y-3">
                  <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider">MEDICATION CONTEXT</h3>
                  <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/30 text-on-background font-body text-body leading-relaxed">
                    The consecutive missed doses of Amlodipine (CCB) on Day 6 and Day 8 correlate directly with the escalating hypertensive readings (144/90 → 152/94). Given Asha's baseline stability on this regimen, the interruption in continuous calcium channel blockade likely precipitated the current multi-factor decline and accompanying symptomatic presentation ('heavy-headed').
                  </div>
                </section>
              </FadeIn>
              <FadeIn delay={0.4}>
                <section className="space-y-3">
                  <div className="border-l-4 border-primary-container bg-surface-container-low p-4 rounded-r-lg">
                    <p className="font-body-sm text-body-sm text-on-background italic mb-2">
                      "In patients presenting with symptomatic hypertension coupled with concurrent glycemic excursions, immediate review of medication adherence is prioritized before dose titration."
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-label text-label text-on-surface-variant">RSSDI 2022 §4.3</span>
                      <a className="font-label text-label text-primary hover:text-primary-container inline-flex items-center gap-1 transition-colors" href="#">
                        View full guideline <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                </section>
              </FadeIn>
            </div>
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
