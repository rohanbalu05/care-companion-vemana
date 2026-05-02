import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FadeIn } from "../components/FadeIn";
import RiskStoryTimeline from "../components/RiskStoryTimeline";
import ReasoningTracePanel from "./ReasoningTracePanel";
import { useDashboard, riskColor } from "../lib/dashboardData";
import { DashboardLoading, DashboardError } from "../components/DashboardStateGate";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

type ActionState = 'idle' | 'submitting' | 'sent' | 'rejected' | 'error';

function relativeDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  const hr = Math.round(diff / 3600000);
  const day = Math.round(diff / 86400000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day === 1) return 'yesterday';
  if (day < 7) return `${day}d ago`;
  return `${Math.round(day / 7)}w ago`;
}

export default function PatientDetail({ initialPanelOpen = false }: { initialPanelOpen?: boolean }) {
  const [panelOpen, setPanelOpen] = useState(initialPanelOpen);
  const [panelEventId, setPanelEventId] = useState<string | null>(null);
  const openPanel = (eventId?: string) => { setPanelEventId(eventId || null); setPanelOpen(true); };
  const closePanel = () => setPanelOpen(false);
  const { data, loading, error, refresh, patchIntervention } = useDashboard();
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  if (loading && !data) return <DashboardLoading label="Loading patient view…" />;
  if (error && !data && error !== 'invalid_or_expired_token') return <DashboardError error={error} onRetry={refresh} kind="clinician" />;
  const patient = data?.patient;
  const guardian = data?.guardian;
  const risk = data?.risk;
  const allInterventions = data?.interventions || [];
  const intervention = allInterventions.find(i => i.status === 'pending_review') || allInterventions[0] || null;
  const historyInterventions = allInterventions.filter(i => i.id !== intervention?.id).slice(0, 6);
  const risky = risk ? riskColor(risk.level) : riskColor('elevated');

  async function handleAction(action: 'approve' | 'reject') {
    if (!intervention || actionState === 'submitting') return;
    setActionState('submitting');
    setActionMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/intervention-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervention_id: intervention.id, action })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionState('error');
        setActionMsg(body?.error || `request failed (${res.status})`);
        return;
      }
      if (action === 'approve') {
        setActionState('sent');
        setActionMsg(body?.telegram_sent
          ? 'Approved & sent to Telegram ✓'
          : 'Approved (patient not linked to Telegram yet)');
        patchIntervention(intervention.id, {
          status: body?.status || 'sent',
          sent_message_text: body?.sent_message_text || intervention.recommendation_text,
          sent_at: new Date().toISOString(),
          approved_at: new Date().toISOString()
        });
      } else {
        setActionState('rejected');
        setActionMsg('Intervention rejected');
        patchIntervention(intervention.id, {
          status: 'rejected',
          approved_at: new Date().toISOString()
        });
      }
      setTimeout(() => { refresh(); }, 2500);
    } catch (e: any) {
      setActionState('error');
      setActionMsg(e?.message || 'request failed');
    }
  }

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
          <Link to="/clinician/interventions" className="flex items-center gap-3 px-3 py-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors rounded-md cursor-pointer active:opacity-80 group">
            <span className="material-symbols-outlined text-[20px]">healing</span>
            <span>Interventions</span>
          </Link>
          <Link to="/clinician?add=1" className="flex items-center gap-3 px-3 py-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors rounded-md cursor-pointer active:opacity-80 group">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>Onboard patient</span>
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
                  </div>
                </div>
              </div>
              </FadeIn>
              <RiskStoryTimeline
                bp={data?.vitals.last_14_bp || []}
                glucose={data?.vitals.last_14_glucose || []}
                adherence={{ last_14_status: data?.adherence_7d.last_14_status || [] }}
                riskEvents={data?.risk.events || []}
                recentEvents={data?.recent_events || []}
                onMarkerClick={(eventId) => openPanel(eventId)}
              />
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
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={`relative bg-surface-container-lowest rounded-xl border p-4 shadow-[0_2px_4px_rgba(28,25,23,0.02)] flex flex-col gap-3 ${
                    intervention.status === 'pending_review' && actionState === 'idle'
                      ? 'border-primary-container/60'
                      : 'border-outline-variant'
                  }`}>
                  {intervention.status === 'pending_review' && actionState === 'idle' && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3" aria-hidden>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container/50"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-container"></span>
                    </span>
                  )}
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
                  {intervention.status !== 'sent' && actionState !== 'sent' && actionState !== 'rejected' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAction('reject')}
                        disabled={actionState === 'submitting'}
                        className="flex-1 py-1.5 px-3 rounded border border-outline-variant text-on-surface font-label text-label hover:bg-surface-container-low transition-colors disabled:opacity-50">
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction('approve')}
                        disabled={actionState === 'submitting'}
                        className="flex-1 py-1.5 px-3 rounded bg-primary text-on-primary font-label text-label hover:bg-primary-container transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-1.5">
                        {actionState === 'submitting' && (
                          <span className="inline-block w-3 h-3 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                        )}
                        {actionState === 'submitting' ? 'Sending…' : 'Approve & Send'}
                      </button>
                    </div>
                  )}
                  <AnimatePresence>
                    {(actionState === 'sent' || actionState === 'rejected' || actionState === 'error') && actionMsg && (
                      <motion.div
                        key="action-status"
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className={`mt-2 px-3 py-2 rounded-md text-label font-label inline-flex items-center gap-2 ${
                          actionState === 'sent' ? 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30'
                            : actionState === 'rejected' ? 'bg-surface-container border border-outline-variant text-on-surface-variant'
                            : 'bg-error-container/40 text-on-error-container border border-error-container/60'
                        }`}>
                        {actionState === 'sent' && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                        {actionState === 'rejected' && <span className="material-symbols-outlined text-[16px]">block</span>}
                        {actionState === 'error' && <span className="material-symbols-outlined text-[16px]">error</span>}
                        <span>{actionMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : !error && (
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_2px_4px_rgba(28,25,23,0.02)] text-center">
                  <span className="material-symbols-outlined text-primary text-[28px]">check_circle</span>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-2">No active interventions. {patient?.first_name || 'Patient'} is on track. ✨</p>
                </div>
              )}

              {historyInterventions.length > 0 && (
                <div className="flex flex-col gap-2 mt-4">
                  <h4 className="font-label text-label uppercase tracking-wider text-on-surface-variant">Recent activity</h4>
                  <ol className="flex flex-col gap-2">
                    {historyInterventions.map((it, idx) => (
                      <motion.li
                        key={it.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        className="bg-surface-container-lowest rounded-md border border-outline-variant/60 p-3 text-body-sm font-body-sm flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${
                            it.status === 'sent' ? 'bg-[#16A34A]/10 text-[#16A34A]'
                              : it.status === 'rejected' ? 'bg-surface-container text-on-surface-variant border border-outline-variant'
                              : it.status === 'approved' ? 'bg-primary-container/30 text-on-primary-container'
                              : 'bg-tertiary-container/30 text-on-surface-variant'
                          }`}>
                            {it.status === 'sent' ? '✓ Sent' : it.status === 'rejected' ? '✕ Rejected' : it.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-outline">{relativeDate(it.sent_at || it.approved_at || it.created_at)}</span>
                        </div>
                        <p className="text-on-surface-variant text-[13px] leading-snug line-clamp-2">{it.recommendation_text}</p>
                        {it.citation && <span className="text-[10px] text-outline">{it.citation}</span>}
                      </motion.li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
            </FadeIn>
          </div>
        </main>
      </div>
      <ReasoningTracePanel isOpen={panelOpen} onClose={closePanel} eventId={panelEventId} events={data?.risk.events || []} />
    </div>
  );
}
