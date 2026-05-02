import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Stethoscope, ArrowRight, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { FadeIn } from "../components/FadeIn";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

type QueueItem = {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_first_name: string;
  patient_age: number | null;
  patient_sex: string | null;
  conditions: string[];
  recommendation_text: string;
  clinical_reasoning: string | null;
  citation: string | null;
  message_language: string;
  message_language_label: string;
  triggering_event: {
    event_type: string;
    severity: string;
    narrative_text: string | null;
  } | null;
  created_at: string;
  drafted_relative: string;
};

type ActionResult = { id: string; outcome: 'sent' | 'rejected'; ts: number };

const LANG_FONT: Record<string, string> = {
  en: '',
  hi: 'font-[Noto_Sans_Devanagari,Inter,sans-serif]',
  kn: 'font-[Noto_Sans_Kannada,Inter,sans-serif]'
};

export default function InterventionsPage() {
  const [searchParams] = useSearchParams();
  const filterPatientId = searchParams.get('patient') || '';
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [recent, setRecent] = useState<ActionResult[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const qs = filterPatientId ? `?patient=${encodeURIComponent(filterPatientId)}` : '';
    fetch(`${API_BASE}/api/interventions-queue${qs}`)
      .then(async r => {
        if (!r.ok) {
          let detail = '';
          try { const j = await r.json(); detail = j?.error || ''; } catch {}
          throw new Error(detail || `status ${r.status}`);
        }
        return r.json();
      })
      .then(d => { setItems(d.items || []); setLoading(false); })
      .catch(e => { setError(e?.message || String(e)); setLoading(false); });
  }, [filterPatientId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(load, 8000);
    const onVis = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [load]);

  async function act(item: QueueItem, action: 'approve' | 'reject') {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`${API_BASE}/api/intervention-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervention_id: item.id, action })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error || `action failed (${res.status})`);
        setBusyId(null);
        return;
      }
      setItems(prev => prev.filter(i => i.id !== item.id));
      const outcome: ActionResult['outcome'] = action === 'approve' ? 'sent' : 'rejected';
      setRecent(prev => [...prev.slice(-3), { id: item.id, outcome, ts: Date.now() }]);
      setBusyId(null);
    } catch (e: any) {
      setError(e?.message || 'request failed');
      setBusyId(null);
    }
  }

  const pendingCount = items.length;

  return (
    <div className="bg-[#FAFAF9] text-on-background font-body min-h-screen">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>
      <nav className="bg-white dark:bg-stone-950 text-teal-700 dark:text-teal-500 font-inter text-sm antialiased fixed left-0 top-0 h-full w-[240px] border-r border-stone-200 dark:border-stone-800 flex flex-col z-40 hidden md:flex">
        <div className="px-6 py-6 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
            <Stethoscope size={16} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-teal-700 dark:text-teal-500 leading-tight">Chronic Care</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Clinical Portal</p>
          </div>
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            <li>
              <Link to="/clinician" className="flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors">
                <span className="material-symbols-outlined text-lg">group</span>
                Patients
              </Link>
            </li>
            <li>
              <Link to="/clinician/interventions" className="flex items-center gap-3 px-3 py-2 rounded-md bg-stone-50 text-teal-700 dark:text-teal-400 font-semibold border-r-2 border-teal-700 dark:border-teal-400 transition-colors">
                <span className="material-symbols-outlined text-lg">healing</span>
                Interventions
                {pendingCount > 0 && <span className="ml-auto bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>}
              </Link>
            </li>
            <li>
              <Link to="/clinician?add=1" className="flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors">
                <span className="material-symbols-outlined text-lg">person_add</span>
                Onboard patient
              </Link>
            </li>
          </ul>
        </div>
        <div className="p-4 border-t border-stone-200 dark:border-stone-800">
          <Link to="/login" className="flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors">
            <span className="material-symbols-outlined text-lg">account_circle</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Profile</span>
              <span className="text-[10px] text-stone-500 truncate w-32">Dr. Priya Mehta, MBBS MD</span>
            </div>
          </Link>
        </div>
      </nav>

      <div className="md:ml-[240px] flex flex-col min-h-screen">
        <header className="bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md font-inter text-sm fixed top-0 right-0 left-0 md:left-[240px] h-16 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-medium text-stone-900 dark:text-stone-100">Interventions</h1>
            {filterPatientId && (
              <Link to="/clinician/interventions" className="text-[11px] text-on-surface-variant hover:text-on-surface bg-surface-container border border-outline-variant rounded-full px-2.5 py-0.5">
                Filtered to one patient · clear ✕
              </Link>
            )}
          </div>
          <div className="text-[12px] text-on-surface-variant">
            {loading ? 'Loading…' : `${pendingCount} pending`}
          </div>
        </header>

        <main className="flex-1 mt-16 p-6 max-w-[920px] mx-auto w-full">
          <AnimatePresence>
            {recent.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-3 px-4 py-2.5 rounded-md text-sm font-medium inline-flex items-center gap-2 ${
                  r.outcome === 'sent'
                    ? 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30'
                    : 'bg-surface-container border border-outline-variant text-on-surface-variant'
                }`}
              >
                {r.outcome === 'sent' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {r.outcome === 'sent' ? 'Approved & sent ✓' : 'Rejected'}
              </motion.div>
            ))}
          </AnimatePresence>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-md bg-error-container/40 border border-error-container/60 text-on-error-container text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Couldn't load intervention queue</p>
                <p className="text-[12px] opacity-90 mt-0.5">{error}</p>
              </div>
              <button onClick={load} className="px-3 py-1 rounded border border-outline-variant text-[12px] hover:bg-surface-container-low">Retry</button>
            </div>
          )}

          {loading && !error && (
            <div className="space-y-4">
              {[0,1,2].map(i => (
                <div key={i} className="bg-white border border-[#E7E5E4] rounded-xl p-6 animate-pulse">
                  <div className="h-4 w-1/3 bg-stone-200 rounded mb-3" />
                  <div className="h-3 w-2/3 bg-stone-100 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-stone-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && pendingCount === 0 && (
            <FadeIn>
              <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center shadow-[0_2px_4px_rgba(28,25,23,0.02)]">
                <div className="w-12 h-12 rounded-full bg-primary-container/15 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={22} className="text-primary-container" />
                </div>
                <h2 className="text-lg font-semibold text-on-surface">No interventions pending. Quiet day. ✨</h2>
                <p className="text-sm text-on-surface-variant mt-1">When the AI surfaces a new risk pattern, the suggested intervention will appear here for your review.</p>
              </div>
            </FadeIn>
          )}

          {!loading && !error && pendingCount > 0 && (
            <ol className="space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item, idx) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.35, delay: idx * 0.04, ease: 'easeOut' }}
                  >
                    <InterventionCard
                      item={item}
                      busy={busyId === item.id}
                      onApprove={() => act(item, 'approve')}
                      onReject={() => act(item, 'reject')}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}
        </main>
      </div>
    </div>
  );
}

function InterventionCard({ item, busy, onApprove, onReject }: {
  item: QueueItem;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const initials = (item.patient_name || '?').split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const ageSex = item.patient_age != null ? `${item.patient_age}${item.patient_sex === 'female' ? 'F' : item.patient_sex === 'male' ? 'M' : ''}` : '';
  const langClass = LANG_FONT[item.message_language] || '';
  const severity = item.triggering_event?.severity;
  const severityClass = severity === 'critical' || severity === 'high'
    ? 'bg-error-container/40 text-on-error-container border border-error-container/60'
    : severity === 'medium'
    ? 'bg-[#EA580C]/10 text-[#EA580C] border border-[#EA580C]/30'
    : 'bg-[#CA8A04]/10 text-[#CA8A04] border border-[#CA8A04]/30';

  return (
    <article className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-[0_1px_2px_rgba(28,25,23,0.02)] hover:shadow-[0_4px_12px_rgba(28,25,23,0.05)] transition-shadow flex flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 text-[12px] font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-on-surface flex items-baseline gap-2">
              <span className="truncate">{item.patient_name}</span>
              {ageSex && <span className="text-[12px] font-normal text-outline">{ageSex}</span>}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {item.conditions.map(c => (
                <span key={c} className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant text-on-surface-variant">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
        <span className="text-[11px] text-outline shrink-0">drafted {item.drafted_relative}</span>
      </header>

      {item.triggering_event && (
        <div className={`text-[12px] rounded-md px-3 py-2 inline-flex items-start gap-2 ${severityClass}`}>
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-mono uppercase tracking-wide text-[10px] mr-1">{item.triggering_event.event_type.replace(/_/g, ' ')}</span>
            {item.triggering_event.narrative_text && (
              <span className="opacity-90">{item.triggering_event.narrative_text.slice(0, 220)}{item.triggering_event.narrative_text.length > 220 ? '…' : ''}</span>
            )}
          </div>
        </div>
      )}

      <div className="bg-surface-container-low/40 border border-outline-variant/60 rounded-md p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">Drafted Telegram message</span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-container/10 text-primary-container border border-primary-container/30">
            {item.message_language_label}
          </span>
        </div>
        <p className={`text-sm text-on-surface leading-relaxed whitespace-pre-wrap ${langClass}`}>
          {item.recommendation_text}
        </p>
        {item.citation && (
          <p className="text-[11px] text-outline pt-1.5 border-t border-outline-variant/40">📖 {item.citation}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <Link
          to={`/clinician/detail?patient_id=${item.patient_id}`}
          className="text-[12px] text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1 transition-colors"
        >
          View patient detail <ArrowRight size={12} />
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            disabled={busy}
            className="px-4 py-2 rounded-md border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            disabled={busy}
            className="px-4 py-2 rounded-md bg-primary-container text-on-primary text-sm font-medium hover:bg-primary transition-colors disabled:opacity-60 inline-flex items-center gap-2"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}
            {busy ? 'Sending…' : 'Approve & send'}
          </button>
        </div>
      </div>
    </article>
  );
}
