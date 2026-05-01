import { FadeIn } from "../components/FadeIn";

export default function ClinicianRoster() {
  return (
    <div className="bg-[#FAFAF9] text-on-background font-body text-body antialiased selection:bg-primary selection:text-on-primary min-h-screen">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>
      <nav className="bg-white dark:bg-stone-950 text-teal-700 dark:text-teal-500 font-inter text-sm antialiased fixed left-0 top-0 h-full w-[240px] border-r border-stone-200 dark:border-stone-800 flex flex-col z-40 hidden md:flex">
        <div className="px-6 py-6 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold overflow-hidden shrink-0">
            <img alt="Clinic Logo" className="w-full h-full object-cover" data-alt="A macro shot of a sleek, modern medical caduceus logo rendered in polished silver and deep teal. It is set against a clean white background with soft, diffused studio lighting. The aesthetic is highly professional, conveying trust and clinical precision in a high-end corporate style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLn40sX71sF83ZxmS-haIQ7VFQPfaL4Eo8-Px8xSGcfTTzdFdS30GvCXMba44Q4KGAVeN5qRFe6Y1kdRzUzjlmEMxkA3qMI41doFm8am5S5jOckNlb_Uvy5UvVThh8jlv5_e3ULhbodmRhjBwkfEb3YicGMLi4O8B4amO9PM57aWrHM3XHESKIAvf4jfd5qfWyd_-MKP3yaQDjOWAQQVL7TFCjwMZ7N-m_LfpB6EqHX5DOQMX6S-QUnzFRCaG9MEoYiXXY9B1W8xmM" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-teal-700 dark:text-teal-500 leading-tight">Chronic Care</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Clinical Portal</p>
          </div>
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            <li>
              <a className="flex items-center gap-3 px-3 py-2 rounded-md bg-stone-50 text-teal-700 dark:text-teal-400 font-semibold border-r-2 border-teal-700 dark:border-teal-400 transition-colors" href="#">
                <span className="material-symbols-outlined text-lg">group</span>
                Patients
              </a>
            </li>
            <li>
              <a className="flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors cursor-pointer active:opacity-80" href="#">
                <span className="material-symbols-outlined text-lg">healing</span>
                Interventions
                <span className="ml-auto bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
              </a>
            </li>
            <li>
              <a className="flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors cursor-pointer active:opacity-80" href="#">
                <span className="material-symbols-outlined text-lg">person_add</span>
                Onboarding
              </a>
            </li>
            <li>
              <a className="flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors cursor-pointer active:opacity-80" href="#">
                <span className="material-symbols-outlined text-lg">settings</span>
                Settings
              </a>
            </li>
          </ul>
        </div>
        <div className="p-4 border-t border-stone-200 dark:border-stone-800">
          <a className="flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors cursor-pointer active:opacity-80" href="#">
            <span className="material-symbols-outlined text-lg">account_circle</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Profile</span>
              <span className="text-[10px] text-stone-500 truncate w-32">Dr. Priya Mehta, MBBS MD</span>
            </div>
          </a>
        </div>
      </nav>
      <div className="md:ml-[240px] flex flex-col min-h-screen">
        <header className="bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md text-teal-700 dark:text-teal-500 font-inter text-sm fixed top-0 right-0 left-0 md:left-[240px] h-16 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-6 z-30 transition-all duration-200">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-base font-medium text-stone-900 dark:text-stone-100 hidden sm:block">Patient Roster</h1>
            <div className="relative w-full max-w-md hidden md:block ml-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px]">search</span>
              <input className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" placeholder="Search patients..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-md transition-all duration-200 relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-md transition-all duration-200">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-md transition-all duration-200">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </header>
        <main className="flex-1 mt-16 p-6">
          <FadeIn delay={0}>
            <div className="bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] px-4 py-2 rounded-md mb-6 flex items-center justify-between text-sm font-medium cursor-pointer hover:bg-[#0F766E]/15 transition-colors">
              <span>3 interventions awaiting your approval →</span>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-9">
              <FadeIn delay={0.1}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
                    <p className="font-vital-lg text-[24px] text-stone-900">47</p>
                    <p className="font-label text-stone-500 uppercase tracking-wider mt-1">Active Patients</p>
                    <p className="text-[11px] text-stone-400 mt-1">+2 this week</p>
                  </div>
                  <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
                    <p className="font-vital-lg text-[24px] text-[#DC2626]">6</p>
                    <p className="font-label text-stone-500 uppercase tracking-wider mt-1">High Risk</p>
                    <p className="text-[11px] text-stone-400 mt-1">↑ 1 since yesterday</p>
                  </div>
                  <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
                    <p className="font-vital-lg text-[24px] text-[#EA580C]">12</p>
                    <p className="font-label text-stone-500 uppercase tracking-wider mt-1">Awaiting Review</p>
                    <p className="text-[11px] text-stone-400 mt-1">Pending vitals confirmation</p>
                  </div>
                  <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm hover:bg-stone-50 transition-colors cursor-pointer group">
                    <p className="font-vital-lg text-[24px] text-[#0F766E]">3</p>
                    <p className="font-label text-stone-500 uppercase tracking-wider mt-1 group-hover:text-[#0F766E] transition-colors">Interventions Pending</p>
                    <p className="text-[11px] text-stone-400 mt-1">Approve to send</p>
                  </div>
                </div>
              </FadeIn>
            </div>
            <div className="lg:col-span-3">
              <FadeIn delay={0.2}>
                <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm flex flex-col justify-between h-full">
                  <p className="font-label text-stone-500 uppercase tracking-wider mb-2 text-[10px]">Clinic activity, last 14 days</p>
                  <div className="flex items-end gap-1.5 h-[40px]">
                    <div className="flex-1 bg-[#0F766E]/20 h-[40%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/40 h-[60%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/10 h-[30%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/80 h-[90%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/60 h-[75%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/30 h-[50%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/100 h-[100%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/20 h-[45%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/50 h-[65%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/70 h-[80%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/10 h-[20%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/40 h-[55%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/90 h-[95%] rounded-sm"></div>
                    <div className="flex-1 bg-[#0F766E]/30 h-[40%] rounded-sm"></div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1 bg-stone-200 text-stone-800 rounded-full text-xs font-medium hover:bg-stone-300 transition-colors">All</button>
              <button className="px-3 py-1 bg-white border border-stone-200 text-stone-600 rounded-full text-xs font-medium hover:bg-stone-50 transition-colors">Critical</button>
              <button className="px-3 py-1 bg-white border border-stone-200 text-stone-600 rounded-full text-xs font-medium hover:bg-stone-50 transition-colors">Elevated</button>
              <button className="px-3 py-1 bg-white border border-stone-200 text-stone-600 rounded-full text-xs font-medium hover:bg-stone-50 transition-colors">Watch</button>
              <button className="px-3 py-1 bg-white border border-stone-200 text-stone-600 rounded-full text-xs font-medium hover:bg-stone-50 transition-colors">Stable</button>
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <span className="material-symbols-outlined text-[18px]">sort</span>
              <span>Sort: <span className="font-medium text-stone-800">Risk (high to low)</span></span>
            </div>
          </div>
          <FadeIn delay={0.3}>
            <div className="space-y-4">
              <div className="bg-orange-50/30 border border-[#E7E5E4] rounded-xl p-6 shadow-[0_2px_4px_rgba(28,25,23,0.02)] transition-shadow hover:shadow-[0_4px_12px_rgba(28,25,23,0.05)]">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4 lg:w-1/3">
                  <div className="relative">
                    <img alt="Asha Sharma" className="w-10 h-10 rounded-full object-cover ring-2 ring-[#EA580C] ring-offset-2" data-alt="A professional headshot of a mature Indian woman looking directly at the camera with a calm, neutral expression. She is set against a clean, light studio background with soft, even lighting typical of a high-end corporate or medical directory portrait." src="https://lh3.googleusercontent.com/aida-public/AB6AXuALJaUdahyZHMcRc2aE21WPKYHIQ89V0T5Avs6SOGayrXtm_ZLaZ1AF2jQ5Z0JAoo5dbmwgoA-hPjJCPEP7gcBo7g4mddpUe4Si-JsBzkLe-qAOuFhPMTAwmVjnzA9r2flYTRQMayStEnVPJIs2UXfXhlZybPq3YXyY6Cv2Rkk3sWMqgCo-PPMYN1Tsz_Vy9HWoK7hkYvOdOXksPgCh06NQm7pApXwacn1rZWGInD3Pmjahp5SAMmZU55EGEItc666XtXJw4b_EVcOS" />
                  </div>
                  <div>
                    <h3 className="font-h2 text-h2 text-stone-900">Asha Sharma, 62</h3>
                    <p className="font-body-sm text-body-sm text-stone-500 mt-0.5">T2DM + HTN <span className="mx-1">•</span> <span className="text-stone-400">2h ago</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 lg:w-1/2">
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">BP</p>
                    <p className="font-vital-lg text-vital-lg text-stone-900">148/92</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">FBG</p>
                    <p className="font-vital-lg text-vital-lg text-stone-900">156</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">Adherence</p>
                    <p className="font-vital-lg text-vital-lg text-[#EA580C]">71%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:w-1/6 gap-4">
                  <div className="w-16 h-8 flex items-center">
                    <svg height="100%" preserveAspectRatio="none" viewBox="0 0 60 30" width="100%">
                      <path d="M0 25 L15 20 L30 22 L45 10 L60 5" fill="none" stroke="#EA580C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                      <circle cx="60" cy="5" fill="#EA580C" r="2"></circle>
                    </svg>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold bg-[#EA580C]/10 text-[#EA580C]">ELEVATED</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_1px_2px_rgba(28,25,23,0.02)] transition-shadow hover:shadow-[0_4px_12px_rgba(28,25,23,0.05)]">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4 lg:w-1/3">
                  <div className="relative">
                    <img alt="Ravi Kumar" className="w-10 h-10 rounded-full object-cover ring-2 ring-[#CA8A04] ring-offset-2" data-alt="A professional headshot of a middle-aged Indian man with a mild, friendly demeanor. The background is a clean, bright white studio setting. Lighting is soft and flattering, suitable for a professional corporate profile or medical dossier." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQLcGtTlkqAJz19ocF6eyVjAE_hCl9f6xT9KWHQMd-nuo6UeFrb82wW9B_TyCzd-2UINWyqEpSFKZxh0G2HKwCegsJ0NK1YrELUbp6Re3lDHK9KHdAcehDVBp_ohVz-4Xq8DcpUAgxnHmDN1KgTVyuBaoDalg-_8Bdyz4AZW41M5lDt_D93D9xfsiwskAiwd8S53Wj55gD0qRI5aTMdRJNQtpx0TcxeKnv7N0Gky5bWXj9TNQq6q8Wg_vcMos3sTVMWuj_iaLEt7aX" />
                  </div>
                  <div>
                    <h3 className="font-h2 text-h2 text-stone-900">Ravi Kumar, 58</h3>
                    <p className="font-body-sm text-body-sm text-stone-500 mt-0.5">T2DM <span className="mx-1">•</span> <span className="text-stone-400">5h ago</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 lg:w-1/2">
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">BP</p>
                    <p className="font-vital-lg text-vital-lg text-stone-900">132/84</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">FBG</p>
                    <p className="font-vital-lg text-vital-lg text-stone-900">138</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">Adherence</p>
                    <p className="font-vital-lg text-vital-lg text-[#CA8A04]">88%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:w-1/6 gap-4">
                  <div className="w-16 h-8 flex items-center">
                    <svg height="100%" preserveAspectRatio="none" viewBox="0 0 60 30" width="100%">
                      <path d="M0 15 L20 16 L40 14 L60 15" fill="none" stroke="#CA8A04" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                      <circle cx="60" cy="15" fill="#CA8A04" r="2"></circle>
                    </svg>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold bg-[#CA8A04]/10 text-[#CA8A04]">WATCH</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_1px_2px_rgba(28,25,23,0.02)] transition-shadow hover:shadow-[0_4px_12px_rgba(28,25,23,0.05)]">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4 lg:w-1/3">
                  <div className="relative">
                    <img alt="Lakshmi Devi" className="w-10 h-10 rounded-full object-cover ring-2 ring-[#CA8A04] ring-offset-2" data-alt="A portrait of an older Indian woman smiling gently, dressed in a muted professional top. The lighting is high-key and soft, set against a pristine white background. The image feels clinical yet warm, appropriate for a modern healthcare application UI." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZpZwNGhDAJlNp1uf1VHHbUkQ9kGDRhPFrNzQOBtLYh6wgw1L-a_eQcpebqkuKjnfpvMGJriT508wi8eDdSoUyOQ6YW1fZ-8v7sgEdQLolqKG-aEP33QTzkFvyITjQz_67WaBYPCjU48gxmmetBC0UIOYp8QWlPE3kfBzvqbHyPLkZ_k88URfFLpqY14iA9ipTHpHObEVIEThu_FT_j4QhY_Tl7S4DPIeG0PpHwUHTpsJRwEpxz2MwElwX8eVRodCHUkc5nlLDGSYb" />
                  </div>
                  <div>
                    <h3 className="font-h2 text-h2 text-stone-900">Lakshmi Devi, 67</h3>
                    <p className="font-body-sm text-body-sm text-stone-500 mt-0.5">HTN + CKD Stage 2 <span className="mx-1">•</span> <span className="text-stone-400">1d ago</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 lg:w-1/2">
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">BP</p>
                    <p className="font-vital-lg text-vital-lg text-[#CA8A04]">142/88</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-300 mb-1">FBG</p>
                    <p className="font-vital-lg text-vital-lg text-stone-300">--</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">Adherence</p>
                    <p className="font-vital-lg text-vital-lg text-stone-900">92%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:w-1/6 gap-4">
                  <div className="w-16 h-8 flex items-center">
                    <svg height="100%" preserveAspectRatio="none" viewBox="0 0 60 30" width="100%">
                      <path d="M0 20 L20 22 L40 18 L60 12" fill="none" stroke="#CA8A04" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                      <circle cx="60" cy="12" fill="#CA8A04" r="2"></circle>
                    </svg>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold bg-[#CA8A04]/10 text-[#CA8A04]">WATCH</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_1px_2px_rgba(28,25,23,0.02)] transition-shadow hover:shadow-[0_4px_12px_rgba(28,25,23,0.05)]">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4 lg:w-1/3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-semibold ring-2 ring-[#16A34A] ring-offset-2">SR</div>
                  </div>
                  <div>
                    <h3 className="font-h2 text-h2 text-stone-900">Suresh Rao, 71</h3>
                    <p className="font-body-sm text-body-sm text-stone-500 mt-0.5">T2DM + HTN <span className="mx-1">•</span> <span className="text-stone-400">3h ago</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 lg:w-1/2">
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">BP</p>
                    <p className="font-vital-lg text-vital-lg text-stone-900">128/80</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">FBG</p>
                    <p className="font-vital-lg text-vital-lg text-stone-900">118</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">Adherence</p>
                    <p className="font-vital-lg text-vital-lg text-[#16A34A]">95%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:w-1/6 gap-4">
                  <div className="w-16 h-8 flex items-center">
                    <svg height="100%" preserveAspectRatio="none" viewBox="0 0 60 30" width="100%">
                      <path d="M0 15 L20 15 L40 14 L60 15" fill="none" stroke="#16A34A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                      <circle cx="60" cy="15" fill="#16A34A" r="2"></circle>
                    </svg>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold bg-[#16A34A]/10 text-[#16A34A]">STABLE</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_1px_2px_rgba(28,25,23,0.02)] transition-shadow hover:shadow-[0_4px_12px_rgba(28,25,23,0.05)]">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4 lg:w-1/3">
                  <div className="relative">
                    <img alt="Meena Iyer" className="w-10 h-10 rounded-full object-cover ring-2 ring-[#16A34A] ring-offset-2" data-alt="A portrait of a middle-aged South Asian woman smiling confidently. The lighting is studio-quality, bright and clean, reflecting a professional medical or corporate environment. The background is a soft, out-of-focus neutral tone." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbm0tzt1SQiB8HH7WDy341R0kqy14rNvMFrGC14ek68n6VxwnmEKi_1t-T2ih6F4-NyA1AAb0Sommqa0kQdUZcvR3pI-gwQRD-bDvnu4j90NEi-mAN7D9mtZm6MeC3lCKApz2mp3CilVyXXfLwvULhjS-U2Sh4XA125SlSRnplsu8lF4lO5eBOPDL0Z7KHDRVV5S5qlQO_vJj2vWdUhMTxc6BhblBXBg4U2js-gkG5P3FW9yyy-mUahvFd3-OHVFNuKCIHfz0n-0tV" />
                  </div>
                  <div>
                    <h3 className="font-h2 text-h2 text-stone-900">Meena Iyer, 54</h3>
                    <p className="font-body-sm text-body-sm text-stone-500 mt-0.5">T2DM <span className="mx-1">•</span> <span className="text-stone-400">6h ago</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 lg:w-1/2">
                  <div>
                    <p className="font-label text-label text-stone-300 mb-1">BP</p>
                    <p className="font-vital-lg text-vital-lg text-stone-300">--</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">FBG</p>
                    <p className="font-vital-lg text-vital-lg text-stone-900">122</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">Adherence</p>
                    <p className="font-vital-lg text-vital-lg text-[#16A34A]">90%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:w-1/6 gap-4">
                  <div className="w-16 h-8 flex items-center">
                    <svg height="100%" preserveAspectRatio="none" viewBox="0 0 60 30" width="100%">
                      <path d="M0 16 L20 15 L40 16 L60 15" fill="none" stroke="#16A34A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                      <circle cx="60" cy="15" fill="#16A34A" r="2"></circle>
                    </svg>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold bg-[#16A34A]/10 text-[#16A34A]">STABLE</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_1px_2px_rgba(28,25,23,0.02)] transition-shadow hover:shadow-[0_4px_12px_rgba(28,25,23,0.05)]">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4 lg:w-1/3">
                  <div className="relative">
                    <img alt="Krishnan Nair" className="w-10 h-10 rounded-full object-cover ring-2 ring-[#16A34A] ring-offset-2" data-alt="A portrait of a mature Indian man with grey hair, looking composed and serious. Photographed in a high-key studio setting with bright, clinical lighting. The aesthetic is clean, minimal, and suitable for a medical patient dashboard avatar." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDy3ei6-cVWHEUkx714D-NZD1xwlkAgu3IhZm08sgGLif-o_ptN4ZlKWRZiVEpDHT3sJTiOwj3WDW1hexu1iFNABtP1rtSI-Yi6lmF6UWzXHp5jtZeco11BFxds8yhLjXxCVTR9zDXDndLli1y9eTIBCdfKvTGBzzbFYYMXQhdDL9KK4-6oevObw5KG1l8RgQdYzPtqHq6J8BZdRKkL92tYeUU0u4EZ-4eobt5pVijGIN0pvSaIR8nWPw22Q3a3FACp2EdZUTfl4-2K" />
                  </div>
                  <div>
                    <h3 className="font-h2 text-h2 text-stone-900">Krishnan Nair, 69</h3>
                    <p className="font-body-sm text-body-sm text-stone-500 mt-0.5">HTN <span className="mx-1">•</span> <span className="text-stone-400">1d ago</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 lg:w-1/2">
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">BP</p>
                    <p className="font-vital-lg text-vital-lg text-stone-900">130/82</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-300 mb-1">FBG</p>
                    <p className="font-vital-lg text-vital-lg text-stone-300">--</p>
                  </div>
                  <div>
                    <p className="font-label text-label text-stone-500 mb-1">Adherence</p>
                    <p className="font-vital-lg text-vital-lg text-[#16A34A]">94%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:w-1/6 gap-4">
                  <div className="w-16 h-8 flex items-center">
                    <svg height="100%" preserveAspectRatio="none" viewBox="0 0 60 30" width="100%">
                      <path d="M0 15 L20 14 L40 15 L60 14" fill="none" stroke="#16A34A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                      <circle cx="60" cy="14" fill="#16A34A" r="2"></circle>
                    </svg>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold bg-[#16A34A]/10 text-[#16A34A]">STABLE</span>
                </div>
              </div>
            </div>
          </div>
          </FadeIn>
        </main>
      </div>
    </div>
  );
}
