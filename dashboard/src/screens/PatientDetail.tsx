import { useState } from "react";
import { Link } from "react-router-dom";
import { FadeIn } from "../components/FadeIn";
import RiskStoryTimeline from "../components/RiskStoryTimeline";
import CallAshaButton from "../components/CallAshaButton";
import ReasoningTracePanel from "./ReasoningTracePanel";
import { useDashboard, riskColor } from "../lib/dashboardData";

const ASHA_PATIENT_ID = "5cf64ecc-0b6a-4cea-b02b-85605a6f5f03";

export default function PatientDetail({ initialPanelOpen = false }: { initialPanelOpen?: boolean }) {
  const [panelOpen, setPanelOpen] = useState(initialPanelOpen);
  const [panelEventId, setPanelEventId] = useState<string | null>(null);
  const openPanel = (eventId?: string) => { setPanelEventId(eventId || null); setPanelOpen(true); };
  const closePanel = () => setPanelOpen(false);
  const { data, loading, error } = useDashboard();
  const patient = data?.patient;
  const guardian = data?.guardian;
  const risk = data?.risk;
  const intervention = data?.interventions?.[0] || null;
  const risky = risk ? riskColor(risk.level) : riskColor('elevated');
  const sexLabel = patient?.sex === 'male' ? 'M' : patient?.sex === 'female' ? 'F' : '';
  const guardianText = guardian
    ? `${guardian.name}${guardian.relationship ? ` (${guardian.relationship}` : ''}${guardian.address ? `, ${guardian.address.split(',').slice(-2)[0]?.trim() || guardian.address})` : guardian.relationship ? ')' : ''}`
    : 'No guardian on file';
  const phoneText = patient?.phone || '—';
  const headerName = patient?.full_name || 'Loading…';
  return (
    <div className="bg-background text-on-background font-body text-body antialiased selection:bg-primary-container selection:text-on-primary-container flex min-h-screen">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .icon-fill {
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>
      <nav className="bg-white dark:bg-stone-950 text-teal-700 dark:text-teal-500 font-inter text-sm antialiased fixed left-0 top-0 h-full w-[240px] border-r border-stone-200 dark:border-stone-800 flex flex-col z-40 hidden md:flex">
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
          <img alt="Clinic Logo" className="w-8 h-8 rounded-md bg-surface-variant object-cover" data-alt="A clean, minimalist medical cross logo stylized in deep teal and bright white, representing a modern chronic care clinic. Soft, clinical lighting, high contrast." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFubtl6vkrJvcoztt5DP_g0nxJT1kD1psq4asnWveMbIu54t3TSAmE1RFPtMjefRD4XYj2k74LFt3Erq0hjfNjjTw5VzymZvAx6zfJr2cbwHBESObMt1tfCMHOBX3xcE8n8ck_xIP1CmhpXnrsfHjcTrvyWmCSucdXXzpNfU16pm82WUzcNYQyMcvvg_j7bOZRSbVkvnKaecqqmICr2mbDvmw7Km2fvhIbALCcMfivP_eF0_0lyLmQk_QhX4ld5r_DO8OL0WlOttvN" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-teal-700 dark:text-teal-500">Chronic Care</h1>
            <p className="text-xs text-stone-500 font-medium mt-0.5">Clinical Portal</p>
          </div>
        </div>
        <div className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
          <Link to="/clinician" className="flex items-center gap-3 px-3 py-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors rounded-md cursor-pointer active:opacity-80 group">
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span>Patients</span>
          </Link>
          <Link to="/clinician/detail" className="flex items-center gap-3 px-3 py-2 text-teal-700 dark:text-teal-400 font-semibold border-r-2 border-teal-700 dark:border-teal-400 bg-stone-50 dark:bg-stone-900/50 cursor-pointer active:opacity-80 transition-colors rounded-md group">
            <span className="material-symbols-outlined text-[20px]">healing</span>
            <span>Interventions</span>
          </Link>
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors rounded-md cursor-pointer active:opacity-80 group">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>Onboarding</span>
          </Link>
          <Link to="/clinician" className="flex items-center gap-3 px-3 py-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors rounded-md cursor-pointer active:opacity-80 group">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </Link>
        </div>
        <div className="p-4 border-t border-stone-200 dark:border-stone-800">
          <Link to="/login" className="flex items-center gap-3 px-3 py-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors rounded-md cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
            <span>Profile</span>
          </Link>
        </div>
      </nav>
      <div className="flex-1 flex flex-col md:ml-[240px] min-w-0">
        <header className="bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md text-teal-700 dark:text-teal-500 font-inter text-sm fixed top-0 right-0 left-0 md:left-[240px] h-16 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-6 z-30 transition-all duration-200">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 text-sm font-medium">Patients</span>
            <span className="material-symbols-outlined text-stone-400 text-[16px]">chevron_right</span>
            <h2 className="text-base font-medium text-stone-900 dark:text-stone-100">{headerName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-md transition-all duration-200" title="notifications">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-md transition-all duration-200" title="filter_list">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
            <button className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-md transition-all duration-200" title="more_vert">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </header>
        <main className="flex-1 mt-16 p-6 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            <div className="flex flex-col gap-6">
              <FadeIn delay={0}>
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_2px_4px_rgba(28,25,23,0.02)]">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px_220px] items-start gap-6">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-error ring-offset-2 ring-offset-surface-container-lowest flex-shrink-0">
                      <img alt="Asha Sharma" className="w-full h-full object-cover" data-alt="A professional headshot of a mature Indian woman with silver-streaked dark hair, warm expression, wearing a simple elegant kurta. Soft natural lighting, neutral background, clinical UI context." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVzNJkS0aMlqLEYCqriwwatAhFXKbKQAxDHR94zZVX6j-61G8BW09TMm299l8DB-pO0SC7AwQsTS3dPQQpUkI61ZQhXZxZgrwuUigkSXXdp2602pUqtrDHzYM3BkOSbgqH1qqC0xWzwLGA4E2tTd5bmo5MZrgVJTAJanXUlUygf0AjSxGDWsnmXMeIBwXlY-xnJ1ForI4-6uUuIS0xJ0RtqpuDnoruo4l6al5xpF-aiV00g7mwZ1NJ3zw9Dx2eH-pVy1uJkSid5RV_" />
                    </div>
                    <div className="min-w-0 max-w-[520px]">
                      <h1 className="font-h1 text-h1 text-on-surface mb-1 flex items-center gap-2">
                        {patient?.full_name || (loading ? 'Loading…' : 'Patient')}
                        {patient && <span className="text-outline font-body-sm text-body-sm font-normal">{sexLabel}{patient.age != null ? `, ${patient.age}` : ''}</span>}
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm font-body-sm text-on-surface-variant mb-2">
                        <span className="font-medium text-on-surface">{patient?.diagnoses_label || '—'}</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">call</span> {phoneText}</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">supervisor_account</span> {guardianText}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-label font-label text-outline">
                        <span>Primary: {patient?.clinician_name || 'Dr. Priya Mehta'}</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                        <span className="flex items-center gap-1 text-primary-container"><span className="material-symbols-outlined text-[14px]">chat</span> Last contact: {patient?.last_contact?.label || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative w-[200px] h-[200px] mx-auto">
                    <svg className="w-full h-full overflow-visible" viewBox="-30 -30 220 220">
                      <circle cx="80" cy="80" fill="none" r="60" stroke="#bdc9c6" strokeDasharray="2 2" strokeWidth="0.5"></circle>
                      <circle cx="80" cy="80" fill="none" r="40" stroke="#bdc9c6" strokeDasharray="2 2" strokeWidth="0.5"></circle>
                      <circle cx="80" cy="80" fill="none" r="20" stroke="#bdc9c6" strokeDasharray="2 2" strokeWidth="0.5"></circle>
                      <line stroke="#bdc9c6" strokeWidth="0.5" x1="80" x2="80" y1="20" y2="140"></line>
                      <line stroke="#bdc9c6" strokeWidth="0.5" x1="20" x2="140" y1="80" y2="80"></line>
                      <polygon fill="#EA580C" fillOpacity="0.3" points="80,41.6 122.6,80 80,114.8 48.8,80" stroke="#EA580C" strokeWidth="2"></polygon>
                      <text className="fill-outline font-label text-[10px]" textAnchor="middle" x="80" y="6">Cardiovascular 64</text>
                      <text className="fill-outline font-label text-[10px]" textAnchor="start" x="148" y="83">Adherence 71</text>
                      <text className="fill-outline font-label text-[10px]" textAnchor="middle" x="80" y="166">Metabolic 58</text>
                      <text className="fill-outline font-label text-[10px]" textAnchor="end" x="12" y="83">Symptomatic 52</text>
                    </svg>
                  </div>
                  <div className="flex flex-col items-stretch lg:items-end gap-3">
                    <div className={`px-3 py-1.5 rounded-full font-label text-label flex items-center gap-1.5 self-start lg:self-end ${risky.pill}`}>
                      <span className="material-symbols-outlined icon-fill text-[16px]">warning</span>
                      {risky.label} RISK
                    </div>
                    <button onClick={() => openPanel()} className="text-primary text-label font-label flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0 p-0">View reasoning <span className="material-symbols-outlined text-[14px]">arrow_forward</span></button>
                    <CallAshaButton patientId={ASHA_PATIENT_ID} />
                  </div>
                </div>
              </div>
              </FadeIn>
              <RiskStoryTimeline onMarkerClick={(eventId) => openPanel(eventId)} />
            </div>
            <FadeIn delay={0.2}>
            <div className="flex flex-col gap-4">
              <h3 className="font-h2 text-h2 text-on-surface mb-2">Interventions</h3>
              {error && (
                <div className="bg-error-container/40 border border-error-container rounded-xl p-3 text-body-sm font-body-sm text-on-error-container">
                  Couldn't load interventions: {error}
                </div>
              )}
              {!error && intervention ? (
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-[0_2px_4px_rgba(28,25,23,0.02)] flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-on-surface font-body text-body font-medium">
                      <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                      AI-proposed action
                    </div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container">{intervention.status.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">{intervention.recommendation_text}</p>
                  {intervention.sent_message_text && (
                    <div className="bg-surface-container rounded-md p-3 text-body-sm font-body-sm text-on-surface font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                      {intervention.sent_message_text}
                    </div>
                  )}
                  {intervention.citation && (
                    <p className="text-label font-label text-outline">📖 {intervention.citation}</p>
                  )}
                  {intervention.status !== 'sent' && (
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 py-1.5 px-3 rounded border border-outline-variant text-on-surface font-label text-label hover:bg-surface-container-low transition-colors">Reject</button>
                      <button className="flex-1 py-1.5 px-3 rounded bg-primary text-on-primary font-label text-label hover:bg-primary-container transition-colors">Approve &amp; Send</button>
                    </div>
                  )}
                </div>
              ) : !error && (
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_2px_4px_rgba(28,25,23,0.02)] text-center">
                  <span className="material-symbols-outlined text-primary text-[28px]">check_circle</span>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-2">No active interventions. {patient?.first_name || 'Patient'} is on track. ✨</p>
                </div>
              )}
            </div>
            </FadeIn>
          </div>
        </main>
      </div>
      <ReasoningTracePanel isOpen={panelOpen} onClose={closePanel} eventId={panelEventId} />
    </div>
  );
}
