import { FadeIn } from "../components/FadeIn";
import { useDashboard } from "../lib/dashboardData";

export default function GuardianDashboard() {
  const { data } = useDashboard();
  const patient = data?.patient;
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
          <nav className="hidden md:flex items-center gap-6" aria-label="Top tabs">
            <span aria-disabled="true" className="text-stone-300 dark:text-stone-600 font-label text-label px-3 py-2 rounded-lg opacity-60 cursor-default">Home</span>
            <span aria-current="page" className="text-teal-700 dark:text-teal-400 font-semibold font-label text-label bg-stone-50 dark:bg-stone-800 px-3 py-2 rounded-lg">Health</span>
            <span aria-disabled="true" className="text-stone-300 dark:text-stone-600 font-label text-label px-3 py-2 rounded-lg opacity-60 cursor-default">Awards</span>
            <span aria-disabled="true" className="text-stone-300 dark:text-stone-600 font-label text-label px-3 py-2 rounded-lg opacity-60 cursor-default">Profile</span>
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
            <span className="material-symbols-outlined text-primary mt-0.5" data-icon="chat_bubble">chat_bubble</span>
            <div>
              <h3 className="font-label text-label text-on-surface font-semibold mb-1">Doctor's Note</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Dr. Mehta sent your mother a message about her BP medication. She read it 12 hours ago.</p>
            </div>
          </div>
          </FadeIn>
          <FadeIn delay={0.3}>
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-card_padding">
            <h2 className="font-h2 text-h2 text-on-surface mb-6">Recent Events</h2>
            <div className="relative pl-4 space-y-6">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-surface-variant -translate-x-1/2"></div>
              <div className="relative">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary -translate-x-[21px] ring-4 ring-surface-container-lowest"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                  <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider w-24 shrink-0">Today</h3>
                  <div className="bg-surface-container-low rounded-lg p-3 flex-1 flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5" data-icon="mic">mic</span>
                    <p className="font-body text-body text-on-surface">Sent voice note in Hindi <span className="text-secondary">(mood: low energy)</span></p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-error -translate-x-[23px] ring-2 ring-error-container"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                  <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider w-24 shrink-0">Yesterday</h3>
                  <div className="flex-1 flex items-center gap-3 py-2">
                    <span className="material-symbols-outlined text-error text-[20px]" data-icon="medication">medication</span>
                    <p className="font-body text-body text-on-surface font-medium">Skipped morning blood pressure medication</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-tertiary-container -translate-x-[23px] ring-2 ring-tertiary-fixed"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                  <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider w-24 shrink-0">Yesterday</h3>
                  <div className="flex-1 flex items-center gap-3 py-2">
                    <span className="material-symbols-outlined text-tertiary-container text-[20px]" data-icon="vital_signs">vital_signs</span>
                    <p className="font-body text-body text-on-surface font-medium">BP reading 152/94 (above usual)</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-surface-variant -translate-x-[21px]"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                  <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider w-24 shrink-0">2 days ago</h3>
                  <div className="bg-surface-container-low rounded-lg p-3 flex-1 flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5" data-icon="record_voice_over">record_voice_over</span>
                    <p className="font-body text-body text-on-surface">Said 'feeling heavy-headed' in voice check-in</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-error -translate-x-[23px] ring-2 ring-error-container"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                  <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider w-24 shrink-0">3 days ago</h3>
                  <div className="flex-1 flex items-center gap-3 py-2">
                    <span className="material-symbols-outlined text-error text-[20px]" data-icon="medication">medication</span>
                    <p className="font-body text-body text-on-surface font-medium">Skipped morning medication</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-surface-variant -translate-x-[21px]"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                  <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider w-24 shrink-0">4 days ago</h3>
                  <div className="flex-1 flex items-center gap-3 py-2">
                    <span className="material-symbols-outlined text-outline text-[20px]" data-icon="check_circle">check_circle</span>
                    <p className="font-body text-body text-on-surface-variant">All medications taken, BP normal</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-surface-variant -translate-x-[21px]"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                  <h3 className="font-label text-label text-on-surface-variant uppercase tracking-wider w-24 shrink-0">5 days ago</h3>
                  <div className="flex-1 flex items-center gap-3 py-2">
                    <span className="material-symbols-outlined text-outline text-[20px]" data-icon="check_circle">check_circle</span>
                    <p className="font-body text-body text-on-surface-variant">All medications taken, BP normal</p>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="flex flex-col gap-3">
              <div className="bg-surface p-4 rounded-lg border border-surface-variant flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-body text-body text-on-surface font-semibold">Amlodipine</h3>
                    <p className="font-label text-label text-on-surface-variant">Blood Pressure</p>
                  </div>
                  <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant font-label text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Below Usual</span>
                </div>
                <div className="flex items-end gap-2 mt-2">
                  <span className="font-vital-lg text-vital-lg text-on-surface">67%</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant pb-0.5">adherence</span>
                </div>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-surface-variant flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-body text-body text-on-surface font-semibold">Metformin</h3>
                    <p className="font-label text-label text-on-surface-variant">Diabetes</p>
                  </div>
                  <span className="bg-surface-container-high text-on-surface font-label text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Okay</span>
                </div>
                <div className="flex items-end gap-2 mt-2">
                  <span className="font-vital-lg text-vital-lg text-on-surface">86%</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant pb-0.5">adherence</span>
                </div>
              </div>
            </div>
          </section>
          </FadeIn>
          <FadeIn delay={0.5}>
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-card_padding">
            <h2 className="font-h2 text-h2 text-on-surface mb-1">Check-in Consistency</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Last 7 days</p>
            <div className="flex justify-between items-center px-2">
              <div className="flex flex-col items-center gap-1">
                <span className="font-label text-[10px] text-on-surface-variant">Mon</span>
                <div className="w-6 h-6 rounded-full bg-primary-fixed/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-primary" data-icon="check">check</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-label text-[10px] text-on-surface-variant">Tue</span>
                <div className="w-6 h-6 rounded-full bg-primary-fixed/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-primary" data-icon="check">check</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-label text-[10px] text-on-surface-variant">Wed</span>
                <div className="w-6 h-6 rounded-full bg-primary-fixed/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-primary" data-icon="check">check</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-label text-[10px] text-on-surface-variant">Thu</span>
                <div className="w-6 h-6 rounded-full bg-primary-fixed/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-primary" data-icon="check">check</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-label text-[10px] text-on-surface-variant">Fri</span>
                <div className="w-6 h-6 rounded-full bg-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-on-error-container" data-icon="close">close</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-label text-[10px] text-on-surface-variant">Sat</span>
                <div className="w-6 h-6 rounded-full bg-primary-fixed/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-primary" data-icon="check">check</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-label text-[10px] text-on-surface-variant">Sun</span>
                <div className="w-6 h-6 rounded-full bg-primary-fixed/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-primary" data-icon="check">check</span>
                </div>
              </div>
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
      </main>
      <nav className="md:hidden bg-white/90 dark:bg-stone-900/90 backdrop-blur-md fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 border-t border-stone-200 dark:border-stone-800 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-50" aria-label="Bottom tabs">
        <div className="flex justify-around items-center h-16 w-full px-2 pb-safe">
          <span aria-disabled="true" className="flex flex-col items-center justify-center text-stone-300 dark:text-stone-600 w-16 opacity-60 cursor-default">
            <span className="material-symbols-outlined mb-1" data-icon="home">home</span>
            <span className="font-sans text-[11px] font-medium">Home</span>
          </span>
          <span aria-current="page" className="flex flex-col items-center justify-center text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl px-3 py-1 w-16">
            <span className="material-symbols-outlined mb-1" data-icon="vital_signs" data-weight="fill">vital_signs</span>
            <span className="font-sans text-[11px] font-medium text-teal-700 dark:text-teal-400">Health</span>
          </span>
          <span aria-disabled="true" className="flex flex-col items-center justify-center text-stone-300 dark:text-stone-600 w-16 opacity-60 cursor-default">
            <span className="material-symbols-outlined mb-1" data-icon="emoji_events">emoji_events</span>
            <span className="font-sans text-[11px] font-medium">Awards</span>
          </span>
          <span aria-disabled="true" className="flex flex-col items-center justify-center text-stone-300 dark:text-stone-600 w-16 opacity-60 cursor-default">
            <span className="material-symbols-outlined mb-1" data-icon="person">person</span>
            <span className="font-sans text-[11px] font-medium">Profile</span>
          </span>
        </div>
      </nav>
    </div>
  );
}
