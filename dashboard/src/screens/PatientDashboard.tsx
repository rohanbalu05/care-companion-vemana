import { FadeIn } from "../components/FadeIn";
import { useDashboard } from "../lib/dashboardData";
import { DashboardLoading, DashboardError } from "../components/DashboardStateGate";

const WELLNESS_CIRC = 282.7;
function pct100(v: number | undefined | null, max: number): number {
  if (v == null) return 0;
  return Math.max(0, Math.min(100, Math.round((v / max) * 100)));
}

function miniPath(values: number[], height: number): string | null {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const w = 100, pad = 2;
  const stepX = (w - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + ((max - v) / range) * (height - pad * 2);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function PatientDashboard() {
  const { data, loading, error, refresh } = useDashboard();
  if (loading && !data) return <DashboardLoading label="Loading your dashboard…" />;
  if (error && !data) return <DashboardError error={error} onRetry={refresh} kind="patient" />;
  const firstName = data?.patient.first_name || 'Patient';
  const score = data?.wellness.score ?? null;
  const subs = data?.wellness.subscores;
  const adhPct = pct100(subs?.adherence, 35);
  const vitalsPct = pct100(subs?.vitals, 35);
  const engPct = pct100(subs?.engagement, 20);
  const sympPct = pct100(subs?.symptom, 10);
  const dashOffset = score != null ? Math.max(0, WELLNESS_CIRC * (1 - score / 100)) : WELLNESS_CIRC;
  const target = data?.wellness.voucher_target || 90;
  const ptsAway = score != null ? Math.max(0, target - score) : null;
  const voucherPct = score != null ? Math.min(100, Math.round((score / target) * 100)) : 0;
  const bp = data?.vitals.latest_bp;
  const fbg = data?.vitals.latest_fbg;
  const adh7 = data?.adherence_7d;
  const last14 = data?.adherence_7d.last_14_status || [];
  const last14Bp = data?.vitals.last_14_bp || [];
  const last14Glu = data?.vitals.last_14_glucose || [];
  const checkInDays = data?.check_in.last_7_days || [];
  const streak = data?.check_in.streak ?? 0;
  const latestSentMessage = data?.interventions.find(i => i.status === 'sent' && i.sent_message_text) || null;
  const bpPath = miniPath(last14Bp.map(p => p.systolic), 24);
  const gluPath = miniPath(last14Glu.map(p => p.value), 24);
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return (
    <div className="bg-background min-h-screen flex items-center justify-center font-body text-on-background py-8">
      <style>{`
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
        }
        .hindi {
          font-family: 'Noto Sans Devanagari', sans-serif;
        }
      `}</style>
      <div className="w-full max-w-[380px] bg-surface-container-lowest min-h-[800px] shadow-xl relative overflow-hidden flex flex-col mx-auto">
        <header className="bg-white dark:bg-stone-900 font-sans antialiased text-stone-900 dark:text-stone-100 docked full-width top-0 sticky border-b border-stone-200 dark:border-stone-800 flat no shadows flex justify-between items-center w-full h-16 px-4 max-w-md mx-auto z-10">
          <div className="text-lg font-bold tracking-tight text-teal-700 dark:text-teal-400">Care Companion</div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-stone-600">EN | हि | ಕನ್ನಡ</span>
            <div className="flex gap-2 text-teal-700 dark:text-teal-400">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>language</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-24 px-4 space-y-6 pt-4 bg-surface">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface">Hello, {firstName || '…'}</h1>
            <p className="font-body text-body text-on-surface-variant hindi mt-1">नमस्ते, {firstName || '…'}</p>
          </div>
          <FadeIn delay={0}>
          <section className="bg-surface-container-lowest rounded-xl p-card_padding border border-surface-variant shadow-sm flex flex-col items-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="45" stroke="#e0e3e1" strokeWidth="8"></circle>
                <circle cx="50" cy="50" fill="none" r="45" stroke="#0f766e" strokeDasharray={WELLNESS_CIRC} strokeDashoffset={dashOffset} strokeWidth="8"></circle>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-vital-lg text-vital-lg text-primary text-3xl">{score ?? '—'}</span>
                <span className="font-body-sm text-body-sm text-outline">/ 100</span>
              </div>
            </div>
            <div className="text-center mt-4 space-y-1">
              <h2 className="font-h2 text-h2 text-on-surface">Wellness Score</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">last 14 days</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant hindi">वेलनेस स्कोर - पिछले 14 दिन</p>
            </div>
            <button className="mt-3 font-label text-label text-primary hover:underline flex items-center gap-1">
              How is this calculated?
              <span className="material-symbols-outlined text-[16px]">help</span>
            </button>
            <div className="w-full mt-6 space-y-3">
              {!subs ? (
                <div className="bg-surface-container-low/60 border border-outline-variant rounded-md px-3 py-3 text-center">
                  <p className="font-body-sm text-body-sm text-on-surface">Building your wellness picture</p>
                  <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">Your first few daily check-ins establish your baseline.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between font-label text-label text-on-surface-variant">
                      <span>Adherence</span>
                      <span className="font-vital-sm text-vital-sm">{adhPct}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-tertiary-container rounded-full" style={{ width: `${adhPct}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-label text-label text-on-surface-variant">
                      <span>Vitals in range</span>
                      <span className="font-vital-sm text-vital-sm">{vitalsPct}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-tertiary-container rounded-full" style={{ width: `${vitalsPct}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-label text-label text-on-surface-variant">
                      <span>Engagement</span>
                      <span className="font-vital-sm text-vital-sm">{engPct}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${engPct}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-label text-label text-on-surface-variant">
                      <span>Symptom load</span>
                      <span className="font-vital-sm text-vital-sm">{sympPct}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-primary-container rounded-full" style={{ width: `${sympPct}%` }}></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
          </FadeIn>
          <FadeIn delay={0.1}>
          <section className="bg-surface-container-lowest border border-[#E7E5E4] rounded-xl p-4 space-y-4 shadow-sm">
            <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider">Your last 14 days</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between h-[40px]">
                <span className="font-body text-body text-on-surface">Blood Pressure</span>
                <div className="w-32 h-6 relative">
                  {bpPath ? (
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 24">
                      <rect fill="#006a63" fillOpacity="0.05" height="12" width="100" x="0" y="6"></rect>
                      <path d={bpPath} fill="none" stroke="#006a63" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                    </svg>
                  ) : (
                    <span className="text-[11px] text-outline">Log a reading on Telegram</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between h-[40px]">
                <span className="font-body text-body text-on-surface">Blood Sugar</span>
                <div className="w-32 h-6 relative">
                  {gluPath ? (
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 24">
                      <rect fill="#7f4025" fillOpacity="0.05" height="8" width="100" x="0" y="8"></rect>
                      <path d={gluPath} fill="none" stroke="#7f4025" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                    </svg>
                  ) : (
                    <span className="text-[11px] text-outline">Send a glucometer photo</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between h-[40px]">
                <span className="font-body text-body text-on-surface">Medications taken</span>
                <div className="flex gap-1">
                  {(last14.length > 0 ? last14 : Array(14).fill('pending')).slice(-14).map((status, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        status === 'taken' || status === 'late' ? 'bg-[#16A34A]'
                          : status === 'missed' ? 'bg-[#DC2626]'
                          : 'bg-[#D7DBD9]'
                      }`}
                      title={`Day ${i + 1}: ${status}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
          </FadeIn>
          <FadeIn delay={0.2}>
          <section className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-4 flex gap-4 items-start">
            <div className="bg-primary-container text-on-primary-container p-2 rounded-lg shrink-0">
              <span className="material-symbols-outlined">redeem</span>
            </div>
            <div className="space-y-2">
              <p className="font-body-sm text-body-sm text-on-surface">Reach <span className="font-vital-sm text-vital-sm text-primary-container">{target}</span> and hold it for 14 days to unlock: <strong>Next month's clinic subscription waived.</strong></p>
              <p className="font-label text-label text-primary-container">{ptsAway != null ? `You're ${ptsAway} points away.` : 'Keep going!'}</p>
              <div className="w-full h-1 bg-primary-container/20 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary-container rounded-full" style={{ width: `${voucherPct}%` }}></div>
              </div>
            </div>
          </section>
          </FadeIn>
          <FadeIn delay={0.3}>
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 flex justify-between items-center">
            <div>
              <div className="font-label text-label text-on-surface flex items-center gap-1">
                {streak === 0 ? 'Start your streak today' : `${streak}-day check-in streak`} <span className="material-symbols-outlined text-[16px] text-primary">eco</span>
              </div>
              <div className="font-label text-label text-on-surface-variant hindi mt-0.5">
                {streak === 0 ? 'आज से चेक-इन शुरू करें' : `${streak}-दिन का चेक-इन स्ट्रीक`}
              </div>
            </div>
            <div className="flex gap-1">
              {checkInDays.map((d, i) => {
                const isToday = i === checkInDays.length - 1;
                return (
                  <div
                    key={d.date}
                    title={`${dayLabels[new Date(d.date).getDay() === 0 ? 6 : new Date(d.date).getDay() - 1]} · ${d.logged ? 'logged' : 'no log'}`}
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      d.logged
                        ? (isToday ? 'bg-primary-container text-on-primary-container shadow-sm' : 'bg-primary-container/20 text-primary-container')
                        : 'bg-error-container/40 text-on-error-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{d.logged ? 'check' : 'close'}</span>
                  </div>
                );
              })}
            </div>
          </section>
          </FadeIn>
          <FadeIn delay={0.4}>
          <section>
            <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider mb-3">Recent Status</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-surface-container-lowest border border-surface-variant rounded-lg p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-outline">
                    <span className="material-symbols-outlined">favorite</span>
                  </div>
                  <div>
                    <div className="font-label text-label text-on-surface-variant">Blood Pressure</div>
                    <div className="font-body-sm text-body-sm text-outline text-[11px]">{bp?.relative || 'No reading yet'}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <span className={`font-vital-lg text-vital-lg ${bp?.out_of_range ? 'text-error' : 'text-on-surface'}`}>{bp ? `${bp.systolic}/${bp.diastolic}` : '—'}</span>
                    <span className="material-symbols-outlined text-[16px] text-tertiary">{bp?.out_of_range ? 'trending_up' : 'trending_flat'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-tertiary-fixed-dim/20 border border-tertiary-fixed-dim/30 rounded-lg p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-outline">
                    <span className="material-symbols-outlined">water_drop</span>
                  </div>
                  <div>
                    <div className="font-label text-label text-on-surface-variant">Fasting glucose</div>
                    <div className="font-body-sm text-body-sm text-outline text-[11px]">{fbg?.relative || 'No reading yet'}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-vital-lg text-vital-lg text-on-surface">{fbg ? fbg.value : '—'} <span className="text-sm font-body text-outline">{fbg?.unit || 'mg/dL'}</span></span>
                  {fbg?.out_of_range && <span className="bg-tertiary text-on-tertiary text-[10px] px-2 py-0.5 rounded-full font-label mt-1">above usual</span>}
                </div>
              </div>
              <div className="bg-error-container/40 border border-error-container rounded-lg p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-outline">
                    <span className="material-symbols-outlined">medication</span>
                  </div>
                  <div>
                    <div className="font-label text-label text-on-surface-variant">Adherence</div>
                    <div className="font-body-sm text-body-sm text-outline text-[11px]">Last 7 days</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-vital-lg text-vital-lg ${(adh7?.pct ?? 100) < 80 ? 'text-error' : 'text-on-surface'}`}>{adh7?.pct != null ? `${adh7.pct}%` : '—'}</span>
                  {(adh7?.pct ?? 100) < 80 && <span className="bg-error text-on-error text-[10px] px-2 py-0.5 rounded-full font-label mt-1">needs attention</span>}
                </div>
              </div>
            </div>
          </section>
          </FadeIn>
          <FadeIn delay={0.5}>
          <section className="bg-secondary-container/50 border border-secondary-container rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-on-surface">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">chat</span>
                <span className="font-label text-label">Message from your clinic</span>
              </div>
              {latestSentMessage && (
                <span className="text-[11px] text-outline">
                  {new Date(latestSentMessage.sent_at || latestSentMessage.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            {latestSentMessage ? (
              <p className="font-body-sm text-body-sm text-on-surface bg-surface-container-lowest border border-outline-variant/60 rounded-md p-3 italic leading-relaxed">
                "{latestSentMessage.sent_message_text}"
              </p>
            ) : (
              <>
                <p className="font-body-sm text-body-sm text-on-surface-variant">No new messages from your clinic right now. We'll let you know on Telegram if anything changes.</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant hindi">अभी आपके क्लिनिक से कोई नया संदेश नहीं है। कुछ बदलाव होने पर हम आपको टेलीग्राम पर बताएँगे।</p>
              </>
            )}
            <a
              href="https://t.me/Care_companion_Saathi_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 bg-primary text-on-primary font-label text-label py-2 px-4 rounded-lg w-full flex justify-center items-center gap-2 hover:bg-primary-container transition-colors"
            >
              Open Telegram
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </a>
          </section>
          </FadeIn>
        </main>
        <nav role="navigation" aria-label="Bottom tabs" className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md font-sans text-[11px] font-medium text-teal-700 dark:text-teal-400 fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 border-t border-stone-200 dark:border-stone-800 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] flex justify-around items-center h-16 z-50 px-2 pb-safe">
          <span aria-current="page" className="flex flex-col items-center justify-center text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl px-3 py-1">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            <span className="mt-1">Home</span>
          </span>
          <span aria-disabled="true" className="flex flex-col items-center justify-center text-stone-300 dark:text-stone-600 cursor-default opacity-60">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>vital_signs</span>
            <span className="mt-1">Health</span>
          </span>
          <span aria-disabled="true" className="flex flex-col items-center justify-center text-stone-300 dark:text-stone-600 cursor-default opacity-60">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>emoji_events</span>
            <span className="mt-1">Awards</span>
          </span>
          <span aria-disabled="true" className="flex flex-col items-center justify-center text-stone-300 dark:text-stone-600 cursor-default opacity-60">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
            <span className="mt-1">Profile</span>
          </span>
        </nav>
      </div>
    </div>
  );
}
