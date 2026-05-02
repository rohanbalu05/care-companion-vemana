import { useState } from "react";
import { FadeIn } from "../components/FadeIn";
import { useDashboard } from "../lib/dashboardData";
import { DashboardLoading, DashboardError } from "../components/DashboardStateGate";

type GuardianTab = 'home' | 'health' | 'awards' | 'profile';

export default function GuardianDashboard() {
  const { data, loading, error, refresh } = useDashboard();
  const [activeTab, setActiveTab] = useState<GuardianTab>('home');
  if (loading && !data) return <DashboardLoading label="Loading family view…" />;
  if (error && !data) return <DashboardError error={error} onRetry={refresh} kind="guardian" />;
  const patient = data?.patient;
  const recentEvents = data?.recent_events || [];
  const medsAdherence = data?.medications_adherence || [];
  const checkInDays = data?.check_in.last_7_days || [];
  const latestSentMessage = data?.interventions.find(i => i.status === 'sent' && i.sent_message_text) || null;
  const guardian = data?.guardian;
  const risk = data?.risk;
  const adh7 = data?.adherence_7d;
  const bp = data?.vitals.latest_bp;
  const ashaFirst = patient?.first_name || 'Asha';
  const guardianFirst = guardian?.name?.split(/\s+/)[0] || '';
  const relationLabel = guardian?.relationship === 'son' ? 'Mom'
    : guardian?.relationship === 'daughter' ? 'Mom'
    : guardian?.relationship === 'spouse' ? (patient?.sex === 'female' ? 'Wife' : 'Husband')
    : guardian?.relationship?.charAt(0).toUpperCase() + (guardian?.relationship?.slice(1) || '') || 'Family';
  const headerName = `${relationLabel} — ${patient?.full_name || ''}`;
  const lastSynced = patient?.last_contact?.label?.split(' via ')[0] || '—';
  const alertActive = risk?.level === 'critical' || risk?.level === 'elevated' || (adh7?.pct != null && adh7.pct < 80);
  const alertText = alertActive
    ? `BP elevated${bp ? ` (${bp.systolic}/${bp.diastolic})` : ''}${adh7?.missed ? `, missed ${adh7.missed} medication dose${adh7.missed === 1 ? '' : 's'} this week` : ''}`
    : `${ashaFirst} is doing well — vitals and adherence on track`;
  return (
    <div className="bg-background text-on-background font-body min-h-screen">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined[data-weight="fill"] {
          font-variation-settings: 'FILL' 1;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(0.9); }
        }
      `}</style>
      <header className="bg-white dark:bg-stone-900 docked full-width top-0 sticky border-b border-stone-200 dark:border-stone-800 z-50">
        <div className="flex justify-between items-center w-full h-16 px-4 max-w-md mx-auto md:max-w-7xl">
          <div className="text-lg font-bold tracking-tight text-teal-700 dark:text-teal-400">Care Companion</div>
          <nav className="hidden md:flex items-center gap-2" aria-label="Top tabs">
            {(['home','health','awards','profile'] as const).map(tab => {
              const labels: Record<GuardianTab, string> = { home: 'Home', health: 'Health', awards: 'Awards', profile: 'Profile' };
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  aria-current={active ? 'page' : undefined}
                  className={`font-label text-label px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'text-teal-700 dark:text-teal-400 font-semibold bg-stone-50 dark:bg-stone-800'
                      : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-teal-700 dark:text-teal-400 font-label text-label hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors p-2 rounded-full">English</button>
            <div className="flex gap-2">
              <button className="text-teal-700 dark:text-teal-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors p-2 rounded-full">
                <span className="material-symbols-outlined" data-icon="language">language</span>
              </button>
              <button className="text-teal-700 dark:text-teal-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors p-2 rounded-full relative">
                <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 md:px-container_margin py-8 mb-24 md:mb-8 grid grid-cols-1 lg:grid-cols-12 gap-gap">
        {activeTab === 'home' && (<>
        <div className="lg:col-span-8 flex flex-col gap-gap">
          <FadeIn delay={0}>
          <div className="bg-surface-container-low border border-surface-variant rounded-xl p-4 mb-gap flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center border border-outline-variant">
                  <span className="font-label text-on-secondary-container text-[11px] font-bold">RS</span>
                </div>
                <span className="font-label text-label text-on-surface-variant hidden sm:block">Rohan</span>
              </div>
              <div className="flex-1 flex items-center relative">
                <div className="h-[1px] w-full bg-outline-variant"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-surface-container-low px-2">
                    <span className="material-symbols-outlined text-[16px] text-primary animate-pulse" data-icon="pulse" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>pulse</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label text-label text-on-surface-variant hidden sm:block">{ashaFirst}</span>
                <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center border-2 border-[#FFE082] shadow-[0_0_0_1px_#F57F17]">
                  <span className="font-label text-on-tertiary-fixed text-[11px] font-bold">{(ashaFirst[0] || 'A').toUpperCase()}{(patient?.full_name?.split(/\s+/)[1]?.[0] || 'S').toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                Last contact: {lastSynced}
              </p>
              <p className="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                {guardianFirst ? `Watching over ${ashaFirst} as ${guardianFirst}` : `Watching over ${ashaFirst}`}
              </p>
            </div>
          </div>
          </FadeIn>
          <FadeIn delay={0.1}>
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-card_padding shadow-[0_2px_4px_rgba(28,25,23,0.04)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img alt="Asha Sharma" className="w-16 h-16 rounded-full object-cover ring-2 ring-offset-2 ring-tertiary-container" data-alt="A portrait photograph of an elderly Indian woman with a warm, gentle smile, wearing a traditional sari. The lighting is soft and natural, suggesting a peaceful daytime setting. The color palette emphasizes warm earth tones and subtle teal accents, aligning with a professional, clinical yet human-centric aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9vVcYSFloNUQi4G_pKZY4TI4R77ZVGjrRz8Gw9buYMb3-BDpeVapvIec_poR2eM8Z5niJNe24x9XtkHmnm7fYas6MriuPNGwtfjrfHc2WZlOvLPFOFEfzLXvSTr4AW3JOVFl7c2aKv1PLTZJaX7u7QlDfpbe1AjREGXCmzVuqKNhOJTSXlmiznI7fvQ92r530E98W4kA5_ZgRk-RXYK7T5JySqWWmBeDSJuITjYGTs_7jVNK1cUZtWVe7QKwViCPgX4FU40sUlftg" />
              </div>
              <div>
                <h1 className="font-h1 text-h1 text-on-surface">{headerName}</h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Last synced: {lastSynced}</p>
              </div>
            </div>
            {alertActive ? (
              <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-lg p-4 max-w-[280px]">
                <div className="flex items-center gap-2 text-[#F57F17] mb-1">
                  <span className="material-symbols-outlined" data-icon="warning" data-weight="fill">warning</span>
                  <span className="font-label text-label font-bold uppercase tracking-wider">Needs a check-in</span>
                </div>
                <p className="font-body-sm text-body-sm text-[#F57F17] font-medium leading-tight">{alertText}</p>
              </div>
            ) : (
              <div className="bg-primary-container/30 border border-primary-container rounded-lg p-4 max-w-[280px]">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <span className="material-symbols-outlined" data-icon="check_circle" data-weight="fill">check_circle</span>
                  <span className="font-label text-label font-bold uppercase tracking-wider">All good</span>
                </div>
                <p className="font-body-sm text-body-sm text-primary font-medium leading-tight">{alertText}</p>
              </div>
            )}
          </section>
          </FadeIn>
          <FadeIn delay={0.2}>
          <div className="bg-primary-fixed/30 border border-primary-fixed-dim rounded-lg p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary mt-0.5">chat_bubble</span>
            <div className="flex-1">
              <h3 className="font-label text-label text-on-surface font-semibold mb-1">Latest message from clinic</h3>
              {latestSentMessage ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant italic">"{(latestSentMessage.sent_message_text || '').slice(0, 160)}{(latestSentMessage.sent_message_text || '').length > 160 ? '…' : ''}"</p>
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant">No new messages from the clinic right now. {ashaFirst} will hear on Telegram if anything changes.</p>
              )}
            </div>
          </div>
          </FadeIn>
          <FadeIn delay={0.3}>
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-card_padding">
            <h2 className="font-h2 text-h2 text-on-surface mb-6">Recent events</h2>
            {recentEvents.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">No recent activity. Once {ashaFirst} starts logging, events will appear here.</p>
            ) : (
              <div className="relative pl-4 space-y-5">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-surface-variant -translate-x-1/2"></div>
                {recentEvents.map(ev => {
                  const dotColor = ev.severity === 'alert' ? 'bg-error'
                    : ev.severity === 'warn' ? 'bg-tertiary-container'
                    : 'bg-primary';
                  const ringClass = ev.severity === 'alert' ? 'ring-2 ring-error-container'
                    : ev.severity === 'warn' ? 'ring-2 ring-tertiary-fixed'
                    : 'ring-4 ring-surface-container-lowest';
                  const icon = ev.kind === 'vital_bp' ? 'vital_signs'
                    : ev.kind === 'vital_glucose' ? 'water_drop'
                    : ev.kind === 'adherence_missed' ? 'medication'
                    : ev.kind === 'symptom' ? 'mic'
                    : ev.kind === 'intervention_sent' ? 'mark_chat_read'
                    : 'event';
                  const iconColor = ev.severity === 'alert' ? 'text-error'
                    : ev.severity === 'warn' ? 'text-tertiary-container'
                    : 'text-secondary';
                  return (
                    <div className="relative" key={ev.recorded_at + ev.label}>
                      <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full ${dotColor} -translate-x-[23px] ${ringClass}`}></div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                        <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider w-24 shrink-0">{ev.relative}</h3>
                        <div className="flex-1 flex items-start gap-3 py-1">
                          <span className={`material-symbols-outlined text-[20px] mt-0.5 ${iconColor}`}>{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-body text-on-surface">{ev.label}</p>
                            {ev.detail && <p className="font-body-sm text-[11px] text-outline mt-0.5">{ev.detail}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          </FadeIn>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-gap">
          <FadeIn delay={0.4}>
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-card_padding">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-h2 text-h2 text-on-surface">Medication</h2>
              <span className="font-label text-label text-on-surface-variant">30 days</span>
            </div>
            {medsAdherence.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">No active prescriptions yet. They'll appear here once added.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {medsAdherence.map(m => {
                  const pct = m.adherence_pct_30d;
                  const noData = pct == null;
                  const lowAdherence = pct != null && pct < 80;
                  const badgeClass = noData
                    ? 'bg-surface-container-high text-on-surface-variant'
                    : lowAdherence
                      ? 'bg-error-container text-on-error-container'
                      : 'bg-surface-container-high text-on-surface';
                  const badgeText = noData ? 'No data' : lowAdherence ? 'Below usual' : 'Okay';
                  return (
                    <div key={m.drug_name} className="bg-surface p-4 rounded-lg border border-surface-variant flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-body text-body text-on-surface font-semibold">{m.drug_name}</h3>
                          <p className="font-label text-label text-on-surface-variant">
                            {m.purpose || (m.dose ? `${m.dose}` : 'Prescribed medication')}{m.frequency ? ` · ${m.frequency}` : ''}
                          </p>
                        </div>
                        <span className={`font-label text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeClass}`}>{badgeText}</span>
                      </div>
                      <div className="flex items-end gap-2 mt-2">
                        <span className={`font-vital-lg text-vital-lg ${lowAdherence ? 'text-error' : 'text-on-surface'}`}>
                          {noData ? '—' : `${pct}%`}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant pb-0.5">
                          {noData ? 'no doses logged yet' : 'adherence'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          </FadeIn>
          <FadeIn delay={0.5}>
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-card_padding">
            <h2 className="font-h2 text-h2 text-on-surface mb-1">Check-in consistency</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Last 7 days</p>
            <div className="flex justify-between items-center px-2">
              {checkInDays.map(d => {
                const wd = new Date(d.date).getDay();
                const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1">
                    <span className="font-label text-[10px] text-on-surface-variant">{labels[wd]}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      d.logged ? 'bg-primary-fixed/30 text-primary' : 'bg-error-container/40 text-on-error-container'
                    }`} title={`${d.date} · ${d.logged ? 'logged' : 'no log'}`}>
                      <span className="material-symbols-outlined text-[14px]">{d.logged ? 'check' : 'close'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          </FadeIn>
          <FadeIn delay={0.5}>
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary" data-icon="notifications_active">notifications_active</span>
                <div>
                  <h3 className="font-label text-label text-on-surface font-semibold">Telegram Alerts</h3>
                  <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 max-w-[200px]">Receive instant alerts for missed check-ins or critical readings.</p>
                </div>
              </div>
              <div role="img" aria-label="Telegram alerts on" className="w-10 h-6 bg-primary rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </section>
          </FadeIn>
        </div>
        </>)}

        {activeTab === 'health' && (
          <div className="lg:col-span-12">
            <FadeIn delay={0}>
              <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-card_padding flex flex-col gap-4">
                <h2 className="font-h2 text-h2 text-on-surface">{ashaFirst}'s health, in detail</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ReadingTile label="Blood pressure" value={bp ? `${bp.systolic}/${bp.diastolic}` : '—'} unit="mmHg" sub={bp?.relative || 'no reading yet'} warn={Boolean(bp?.out_of_range)} />
                  <ReadingTile label={data?.vitals.latest_glucose_any ? `Blood sugar · ${data.vitals.latest_glucose_any.kind === 'fasting' ? 'fasting' : data.vitals.latest_glucose_any.kind === 'post_meal' ? 'post-meal' : 'random'}` : 'Blood sugar'} value={data?.vitals.latest_glucose_any ? String(data.vitals.latest_glucose_any.value) : '—'} unit="mg/dL" sub={data?.vitals.latest_glucose_any?.relative || 'no reading yet'} warn={Boolean(data?.vitals.latest_glucose_any?.out_of_range)} />
                  <ReadingTile label="7-day adherence" value={adh7?.pct != null ? `${adh7.pct}%` : '—'} unit="" sub={adh7?.pct != null ? `${adh7.taken}/${adh7.total} doses` : 'no doses logged'} warn={(adh7?.pct ?? 100) < 80} />
                </div>
                <div className="border-t border-outline-variant/60 pt-4">
                  <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider mb-3">Medications · 30-day adherence</h3>
                  {medsAdherence.length === 0 ? (
                    <p className="font-body-sm text-body-sm text-on-surface-variant">No active prescriptions yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {medsAdherence.map(m => (
                        <div key={m.drug_name} className="bg-surface p-3 rounded-md border border-surface-variant flex items-center justify-between">
                          <div>
                            <div className="font-body text-body text-on-surface font-semibold">{m.drug_name}</div>
                            <div className="font-label text-[11px] text-on-surface-variant mt-0.5">{m.purpose || (m.dose ? m.dose : 'Prescribed')}{m.frequency ? ` · ${m.frequency}` : ''}</div>
                          </div>
                          <span className={`font-vital-lg text-vital-lg ${m.adherence_pct_30d != null && m.adherence_pct_30d < 80 ? 'text-error' : 'text-on-surface'}`}>{m.adherence_pct_30d != null ? `${m.adherence_pct_30d}%` : '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </FadeIn>
          </div>
        )}

        {activeTab === 'awards' && (
          <div className="lg:col-span-12">
            <FadeIn delay={0}>
              <section className="flex flex-col gap-4">
                <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-container text-on-primary-container p-2.5 rounded-lg shrink-0">
                      <span className="material-symbols-outlined">redeem</span>
                    </div>
                    <h2 className="font-h2 text-h2 text-on-surface">{ashaFirst}'s subscription voucher</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    When {ashaFirst}'s wellness score holds at <span className="font-vital-sm text-vital-sm text-primary-container">{data?.wellness.voucher_target ?? 90}</span> for 14 consecutive days, next month's clinic subscription is waived.
                  </p>
                  <div className="flex justify-between items-end mt-1">
                    <div>
                      <span className="font-vital-lg text-vital-lg text-primary-container">{data?.wellness.score ?? '—'}</span>
                      <span className="font-label text-label text-on-surface-variant"> / {data?.wellness.voucher_target ?? 90}</span>
                    </div>
                    <p className="font-label text-label text-primary-container">{data?.wellness.score != null ? `${Math.max(0, (data?.wellness.voucher_target ?? 90) - data.wellness.score)} points to go` : 'Logging starts the score'}</p>
                  </div>
                  <div className="w-full h-1.5 bg-primary-container/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container rounded-full" style={{ width: `${Math.min(100, Math.round(((data?.wellness.score ?? 0) / (data?.wellness.voucher_target ?? 90)) * 100))}%` }}></div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-variant shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[28px] text-primary">eco</span>
                    <div>
                      <div className="font-body text-body text-on-surface font-semibold">{(data?.check_in.streak ?? 0) === 0 ? `${ashaFirst} hasn't started a streak yet` : `${data?.check_in.streak}-day check-in streak`}</div>
                      <div className="font-label text-[11px] text-on-surface-variant mt-0.5">Counts every day {ashaFirst} logs on Telegram</div>
                    </div>
                  </div>
                </div>
              </section>
            </FadeIn>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="lg:col-span-12">
            <FadeIn delay={0}>
              <section className="flex flex-col gap-3">
                <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-variant shadow-sm flex flex-col gap-2">
                  <h2 className="font-h2 text-h2 text-on-surface">{patient?.full_name || ashaFirst}</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {patient?.age != null ? `${patient.age} years old` : 'Age not recorded'}{patient?.sex ? ` · ${patient.sex}` : ''}
                  </p>
                  {patient?.diagnoses && patient.diagnoses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {patient.diagnoses.map(d => (
                        <span key={d.condition} className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-container/15 text-primary-container border border-primary-container/30">{d.short}</span>
                      ))}
                    </div>
                  )}
                </div>
                <ProfileTile icon="person" label="Care team" value={patient?.clinician_name || 'Dr. Priya Mehta'} sub={patient?.clinic_name || ''} />
                <ProfileTile icon="language" label={`${ashaFirst}'s preferred language`} value={patient?.preferred_language_label || 'English'} sub="The bot replies in this language" />
                <ProfileTile icon="supervisor_account" label="Your role" value={guardian?.relationship ? guardian.relationship.charAt(0).toUpperCase() + guardian.relationship.slice(1) : 'Family'} sub={guardian?.name || ''} />
                <ProfileTile icon="schedule" label="Last contact" value={patient?.last_contact?.label || '—'} sub="" />
              </section>
            </FadeIn>
          </div>
        )}
      </main>
      <nav className="md:hidden bg-white/90 dark:bg-stone-900/90 backdrop-blur-md fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 border-t border-stone-200 dark:border-stone-800 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-50" aria-label="Bottom tabs">
        <div className="flex justify-around items-center h-16 w-full px-2 pb-safe">
          {(['home','health','awards','profile'] as const).map(tab => {
            const icons: Record<GuardianTab, string> = { home: 'home', health: 'vital_signs', awards: 'emoji_events', profile: 'person' };
            const labels: Record<GuardianTab, string> = { home: 'Home', health: 'Health', awards: 'Awards', profile: 'Profile' };
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center w-16 rounded-xl px-3 py-1 transition-colors ${
                  active
                    ? 'text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-900/20'
                    : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
                }`}
              >
                <span className="material-symbols-outlined mb-1" data-weight={active ? 'fill' : undefined}>{icons[tab]}</span>
                <span className="font-sans text-[11px] font-medium">{labels[tab]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ReadingTile({ label, value, unit, sub, warn }: { label: string; value: string; unit: string; sub: string; warn: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${warn ? 'bg-error-container/40 border-error-container' : 'bg-surface-container-low/60 border-outline-variant/60'}`}>
      <div className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`font-vital-lg text-vital-lg ${warn ? 'text-error' : 'text-on-surface'}`}>{value}</span>
        {unit && <span className="text-sm font-body text-outline">{unit}</span>}
      </div>
      <div className="font-label text-[11px] text-outline mt-1">{sub}</div>
    </div>
  );
}

function ProfileTile({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/60 flex items-start gap-3">
      <span className="material-symbols-outlined text-on-surface-variant mt-0.5 text-[20px]">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">{label}</div>
        <div className="font-body text-body text-on-surface mt-0.5 truncate">{value}</div>
        {sub && <div className="font-label text-[11px] text-outline mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
