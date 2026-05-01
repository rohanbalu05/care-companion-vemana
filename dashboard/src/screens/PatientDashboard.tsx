import { FadeIn } from "../components/FadeIn";

export default function PatientDashboard() {
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
            <h1 className="font-h1 text-h1 text-on-surface">Hello, Asha</h1>
            <p className="font-body text-body text-on-surface-variant hindi mt-1">नमस्ते, आशा</p>
          </div>
          <FadeIn delay={0}>
          <section className="bg-surface-container-lowest rounded-xl p-card_padding border border-surface-variant shadow-sm flex flex-col items-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="45" stroke="#e0e3e1" strokeWidth="8"></circle>
                <circle cx="50" cy="50" fill="none" r="45" stroke="#0f766e" strokeDasharray="282.7" strokeDashoffset="67.8" strokeWidth="8"></circle>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-vital-lg text-vital-lg text-primary text-3xl">76</span>
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
              <div className="space-y-1">
                <div className="flex justify-between font-label text-label text-on-surface-variant">
                  <span>Adherence</span>
                  <span className="font-vital-sm text-vital-sm">71/100</span>
                </div>
                <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary-container w-[71%] rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-label text-label text-on-surface-variant">
                  <span>Vitals in range</span>
                  <span className="font-vital-sm text-vital-sm">68/100</span>
                </div>
                <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary-container w-[68%] rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-label text-label text-on-surface-variant">
                  <span>Engagement</span>
                  <span className="font-vital-sm text-vital-sm">90/100</span>
                </div>
                <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[90%] rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-label text-label text-on-surface-variant">
                  <span>Symptom load</span>
                  <span className="font-vital-sm text-vital-sm">75/100</span>
                </div>
                <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container w-[75%] rounded-full"></div>
                </div>
              </div>
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
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 24">
                    <rect fill="#006a63" fillOpacity="0.05" height="12" width="100" x="0" y="6"></rect>
                    <path d="M0,18 L10,16 L20,19 L30,14 L40,15 L50,12 L60,13 L70,10 L80,11 L90,8 L100,9" fill="none" stroke="#006a63" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between h-[40px]">
                <span className="font-body text-body text-on-surface">Blood Sugar</span>
                <div className="w-32 h-6 relative">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 24">
                    <rect fill="#7f4025" fillOpacity="0.05" height="8" width="100" x="0" y="8"></rect>
                    <path d="M0,12 L10,14 L20,10 L30,11 L40,16 L50,14 L60,12 L70,13 L80,10 L90,9 L100,11" fill="none" stroke="#7f4025" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between h-[40px]">
                <span className="font-body text-body text-on-surface">Medications taken</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D7DBD9]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D7DBD9]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
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
              <p className="font-body-sm text-body-sm text-on-surface">Reach <span className="font-vital-sm text-vital-sm text-primary-container">90</span> and hold it for 14 days to unlock: <strong>Next month's clinic subscription waived.</strong></p>
              <p className="font-label text-label text-primary-container">You're 14 points away.</p>
              <div className="w-full h-1 bg-primary-container/20 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary-container w-[84%] rounded-full"></div>
              </div>
            </div>
          </section>
          </FadeIn>
          <FadeIn delay={0.3}>
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 flex justify-between items-center">
            <div>
              <div className="font-label text-label text-on-surface flex items-center gap-1">
                11-day check-in streak <span className="material-symbols-outlined text-[16px] text-primary">eco</span>
              </div>
              <div className="font-label text-label text-on-surface-variant hindi mt-0.5">11-दिन का चेक-इन स्ट्रीक</div>
            </div>
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span></div>
              <div className="w-6 h-6 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span></div>
              <div className="w-6 h-6 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span></div>
              <div className="w-6 h-6 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span></div>
              <div className="w-6 h-6 rounded-full bg-error-container flex items-center justify-center text-on-error-container"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>close</span></div>
              <div className="w-6 h-6 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span></div>
              <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span></div>
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
                    <div className="font-body-sm text-body-sm text-outline text-[11px]">Day 12</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <span className="font-vital-lg text-vital-lg text-on-surface">148/92</span>
                    <span className="material-symbols-outlined text-[16px] text-tertiary">trending_up</span>
                  </div>
                </div>
              </div>
              <div className="bg-tertiary-fixed-dim/20 border border-tertiary-fixed-dim/30 rounded-lg p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-outline">
                    <span className="material-symbols-outlined">water_drop</span>
                  </div>
                  <div>
                    <div className="font-label text-label text-on-surface-variant">FBG</div>
                    <div className="font-body-sm text-body-sm text-outline text-[11px]">Day 11</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-vital-lg text-vital-lg text-on-surface">178 <span className="text-sm font-body text-outline">mg/dL</span></span>
                  <span className="bg-tertiary text-on-tertiary text-[10px] px-2 py-0.5 rounded-full font-label mt-1">above usual</span>
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
                  <span className="font-vital-lg text-vital-lg text-error">71%</span>
                  <span className="bg-error text-on-error text-[10px] px-2 py-0.5 rounded-full font-label mt-1">needs attention</span>
                </div>
              </div>
            </div>
          </section>
          </FadeIn>
          <FadeIn delay={0.5}>
          <section className="bg-secondary-container/50 border border-secondary-container rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary">chat</span>
              <span className="font-label text-label">Message from Clinic</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Dr. Mehta sent you a message via Telegram — check your Telegram app to read it.</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant hindi">डॉ. मेहता ने आपको टेलीग्राम के माध्यम से एक संदेश भेजा है - इसे पढ़ने के लिए अपना टेलीग्राम ऐप देखें।</p>
            <button className="mt-2 bg-primary text-on-primary font-label text-label py-2 px-4 rounded-lg w-full flex justify-center items-center gap-2 hover:bg-primary-container transition-colors">
              Open Telegram
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </button>
          </section>
          </FadeIn>
        </main>
        <nav className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md font-sans text-[11px] font-medium text-teal-700 dark:text-teal-400 fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 border-t border-stone-200 dark:border-stone-800 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] flex justify-around items-center h-16 z-50 px-2 pb-safe">
          <button className="flex flex-col items-center justify-center text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl px-3 py-1 scale-95 transition-transform duration-100">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            <span className="mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-600 hover:text-teal-600 dark:hover:text-teal-300">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>vital_signs</span>
            <span className="mt-1">Health</span>
          </button>
          <button className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-600 hover:text-teal-600 dark:hover:text-teal-300">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>emoji_events</span>
            <span className="mt-1">Awards</span>
          </button>
          <button className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-600 hover:text-teal-600 dark:hover:text-teal-300">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
            <span className="mt-1">Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
