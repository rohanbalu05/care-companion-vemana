import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Stethoscope, Filter, AlertCircle, RefreshCcw } from "lucide-react";
import { FadeIn } from "../components/FadeIn";
import AddPatientModal from "../components/AddPatientModal";
import { riskColor, RiskLevel } from "../lib/dashboardData";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

type RosterPatient = {
  id: string;
  full_name: string;
  first_name: string;
  age: number | null;
  sex: string | null;
  preferred_language: string;
  preferred_language_label: string;
  conditions: string[];
  conditions_short: string;
  telegram_linked: boolean;
  last_contact: { iso: string | null; label: string };
  risk: { level: RiskLevel };
  vitals: {
    latest_bp: { systolic: number; diastolic: number; out_of_range: boolean } | null;
    latest_fbg: { value: number; out_of_range: boolean } | null;
  };
  adherence_pct_7d: number | null;
  interventions_pending: number;
  trend: number[];
};

type RosterPayload = {
  stats: {
    total: number;
    high_risk: number;
    interventions_pending: number;
    telegram_linked: number;
  };
  patients: RosterPatient[];
  generated_at: string;
};

type FilterKey = 'all' | RiskLevel;

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  critical: 'Critical',
  elevated: 'Elevated',
  watch: 'Watch',
  stable: 'Stable'
};

export default function ClinicianRoster() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<RosterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [addOpen, setAddOpen] = useState(searchParams.get('add') === '1');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setAddOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('add');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const load = useCallback(() => {
    fetch(`${API_BASE}/api/patients-roster`)
      .then(async r => {
        if (!r.ok) {
          let detail = '';
          try { const j = await r.json(); detail = j?.error || ''; } catch {}
          throw new Error(detail || `status ${r.status}`);
        }
        return (await r.json()) as RosterPayload;
      })
      .then(d => { setData(d); setGeneratedAt(d.generated_at); setLoading(false); setError(null); })
      .catch(e => { setError(e?.message || String(e)); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(load, 8000);
    const onVis = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.patients;
    if (filter !== 'all') list = list.filter(p => p.risk.level === filter);
    const s = search.trim().toLowerCase();
    if (s) {
      list = list.filter(p =>
        p.full_name.toLowerCase().includes(s) ||
        p.conditions.some(c => c.toLowerCase().includes(s))
      );
    }
    return list;
  }, [data, filter, search]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: 0, critical: 0, elevated: 0, watch: 0, stable: 0 };
    if (!data) return c;
    c.all = data.patients.length;
    for (const p of data.patients) c[p.risk.level]++;
    return c;
  }, [data]);

  const updatedLabel = generatedAt ? new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

  return (
    <div className="bg-[#FAFAF9] text-on-background font-body text-body antialiased selection:bg-primary selection:text-on-primary min-h-screen">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>
      <nav className="bg-white dark:bg-stone-950 text-teal-700 dark:text-teal-500 font-inter text-sm antialiased fixed left-0 top-0 h-full w-[240px] border-r border-stone-200 dark:border-stone-800 flex flex-col z-40 hidden md:flex">
        <div className="px-6 py-6 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
            <Stethoscope size={16} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-teal-700 dark:text-teal-500 leading-tight">Care Companion</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Clinical Portal</p>
          </div>
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            <li>
              <Link to="/clinician" className="flex items-center gap-3 px-3 py-2 rounded-md bg-stone-50 text-teal-700 dark:text-teal-400 font-semibold border-r-2 border-teal-700 dark:border-teal-400 transition-colors">
                <span className="material-symbols-outlined text-lg">group</span>
                Patients
              </Link>
            </li>
            <li>
              <Link to="/clinician/interventions" className="flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors">
                <span className="material-symbols-outlined text-lg">healing</span>
                Interventions
                {data && data.stats.interventions_pending > 0 && (
                  <span className="ml-auto bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full">{data.stats.interventions_pending}</span>
                )}
              </Link>
            </li>
            <li>
              <button onClick={() => setAddOpen(true)} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors">
                <span className="material-symbols-outlined text-lg">person_add</span>
                Onboard patient
              </button>
            </li>
          </ul>
        </div>
        <div className="p-4 border-t border-stone-200 dark:border-stone-800">
          <Link to="/login" className="flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors">
            <span className="material-symbols-outlined text-lg">account_circle</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Profile</span>
              <span className="text-[10px] text-stone-500 truncate w-32">Dr. Priya Mehta</span>
            </div>
          </Link>
        </div>
      </nav>

      <div className="md:ml-[240px] flex flex-col min-h-screen">
        <header className="bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md text-teal-700 dark:text-teal-500 font-inter text-sm fixed top-0 right-0 left-0 md:left-[240px] h-16 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-base font-medium text-stone-900 dark:text-stone-100 hidden sm:block">Patient Roster</h1>
            <div className="relative w-full max-w-md hidden md:block ml-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow"
                placeholder="Search by name or condition…"
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {generatedAt && !error && (
              <span className="text-[11px] text-stone-500 hidden sm:inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" /> Live · {updatedLabel}
              </span>
            )}
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-container text-on-primary text-sm font-medium hover:bg-primary transition-colors shadow-[0_1px_2px_rgba(15,118,110,0.2)]"
            >
              <Plus size={14} /> Onboard patient
            </button>
          </div>
        </header>

        <main className="flex-1 mt-16 p-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-md bg-error-container/40 border border-error-container/60 text-on-error-container text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Couldn't load roster</p>
                <p className="text-[12px] opacity-90 mt-0.5">{error}</p>
              </div>
              <button onClick={load} className="px-3 py-1 rounded border border-outline-variant text-[12px] hover:bg-surface-container-low inline-flex items-center gap-1">
                <RefreshCcw size={12} /> Retry
              </button>
            </div>
          )}

          {data && data.stats.interventions_pending > 0 && (
            <FadeIn delay={0}>
              <Link to="/clinician/interventions" className="block bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] px-4 py-2 rounded-md mb-6 flex items-center justify-between text-sm font-medium cursor-pointer hover:bg-[#0F766E]/15 transition-colors">
                <span>{data.stats.interventions_pending} intervention{data.stats.interventions_pending === 1 ? '' : 's'} awaiting your approval →</span>
              </Link>
            </FadeIn>
          )}

          <FadeIn delay={0.05}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                value={loading ? '—' : data?.stats.total ?? 0}
                label="Active patients"
                hint={data ? `${data.stats.telegram_linked} on Telegram` : ''}
              />
              <StatCard
                value={loading ? '—' : data?.stats.high_risk ?? 0}
                label="High risk"
                hint={data && data.stats.high_risk > 0 ? 'Need review today' : 'All clear'}
                tone="error"
              />
              <Link to="/clinician/interventions" className="block">
                <StatCard
                  value={loading ? '—' : data?.stats.interventions_pending ?? 0}
                  label="Interventions pending"
                  hint="Tap to review →"
                  tone="primary"
                  hover
                />
              </Link>
              <StatCard
                value={loading ? '—' : data?.stats.telegram_linked ?? 0}
                label="Telegram-linked"
                hint={data ? `${Math.round((data.stats.telegram_linked / Math.max(1, data.stats.total)) * 100)}% of roster` : ''}
                tone="success"
              />
            </div>
          </FadeIn>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Roster filters">
              {(Object.keys(FILTER_LABELS) as FilterKey[]).map(key => {
                const active = filter === key;
                const count = counts[key];
                const disabled = !active && key !== 'all' && count === 0;
                return (
                  <button
                    key={key}
                    onClick={() => !disabled && setFilter(key)}
                    disabled={disabled}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? 'bg-stone-900 text-white'
                        : disabled
                          ? 'bg-white border border-stone-200 text-stone-300 opacity-60 cursor-default'
                          : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {FILTER_LABELS[key]}{count > 0 ? ` · ${count}` : ''}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Filter size={14} />
              <span>Sorted: <span className="font-medium text-stone-800">Risk · highest first</span></span>
            </div>
          </div>

          <AddPatientModal open={addOpen} onClose={() => setAddOpen(false)} />

          {loading && !data && (
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

          {!loading && filtered.length === 0 && !error && (
            <FadeIn>
              <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center shadow-[0_2px_4px_rgba(28,25,23,0.02)]">
                {data && data.patients.length === 0 ? (
                  <>
                    <h2 className="text-lg font-semibold text-on-surface">Your roster is empty</h2>
                    <p className="text-sm text-on-surface-variant mt-1 mb-4">Onboard your first chronic-care patient to start monitoring.</p>
                    <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary-container text-on-primary text-sm font-medium hover:bg-primary transition-colors">
                      <Plus size={14} /> Onboard patient
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-on-surface">No matches</h2>
                    <p className="text-sm text-on-surface-variant mt-1">No patients fit the {filter === 'all' ? 'search' : `"${FILTER_LABELS[filter]}" filter`}. Try a different search or clear the filter.</p>
                  </>
                )}
              </div>
            </FadeIn>
          )}

          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {filtered.map((p, idx) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.3) }}
                >
                  <PatientCard p={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ value, label, hint, tone, hover }: {
  value: number | string;
  label: string;
  hint?: string;
  tone?: 'primary' | 'error' | 'success';
  hover?: boolean;
}) {
  const valueClass =
    tone === 'error' ? 'text-[#DC2626]' :
    tone === 'primary' ? 'text-[#0F766E]' :
    tone === 'success' ? 'text-[#16A34A]' :
    'text-stone-900';
  return (
    <div className={`bg-white border border-stone-200 p-4 rounded-xl shadow-sm ${hover ? 'hover:bg-stone-50 transition-colors cursor-pointer' : ''}`}>
      <p className={`font-vital-lg text-[24px] ${valueClass}`}>{value}</p>
      <p className="font-label text-stone-500 uppercase tracking-wider mt-1">{label}</p>
      {hint && <p className="text-[11px] text-stone-400 mt-1">{hint}</p>}
    </div>
  );
}

function PatientCard({ p }: { p: RosterPatient }) {
  const c = riskColor(p.risk.level);
  const bp = p.vitals.latest_bp;
  const fbg = p.vitals.latest_fbg;
  const adh = p.adherence_pct_7d;
  const initials = (p.full_name || '?').split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const trendPath = sparklinePath(p.trend);

  return (
    <Link
      to={`/clinician/detail?patient_id=${p.id}`}
      className={`block ${p.risk.level === 'critical' ? 'bg-red-50/30' : 'bg-white'} border border-[#E7E5E4] rounded-xl p-6 shadow-[0_1px_2px_rgba(28,25,23,0.02)] transition-all hover:shadow-[0_4px_12px_rgba(28,25,23,0.06)] hover:-translate-y-0.5`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex items-center gap-4 lg:w-1/3 min-w-0">
          <div className="relative shrink-0">
            <div
              className="w-10 h-10 rounded-full bg-stone-100 border-2 flex items-center justify-center text-stone-600 text-[12px] font-semibold ring-2 ring-offset-2 ring-offset-white"
              style={{ ['--tw-ring-color' as any]: c.ring, boxShadow: `0 0 0 2px ${c.ring}` }}
            >
              {initials}
            </div>
            {p.telegram_linked && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#0088cc] rounded-full border border-white flex items-center justify-center" title="Linked to Telegram">
                <span className="text-[7px] text-white font-bold">T</span>
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-h2 text-h2 text-stone-900 flex items-baseline gap-2 truncate">
              {p.full_name}{p.age != null && <span className="text-stone-400 font-normal text-sm">, {p.age}</span>}
            </h3>
            <p className="font-body-sm text-body-sm text-stone-500 mt-0.5">
              {p.conditions_short} <span className="mx-1">•</span> <span className="text-stone-400">{p.last_contact.label}</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 lg:w-1/2">
          <div>
            <p className="font-label text-label text-stone-500 mb-1">BP</p>
            <p className={`font-vital-lg text-vital-lg ${bp?.out_of_range ? 'text-[#DC2626]' : bp ? 'text-stone-900' : 'text-stone-300'}`}>
              {bp ? `${bp.systolic}/${bp.diastolic}` : '—'}
            </p>
          </div>
          <div>
            <p className="font-label text-label text-stone-500 mb-1">FBG</p>
            <p className={`font-vital-lg text-vital-lg ${fbg?.out_of_range ? 'text-[#DC2626]' : fbg ? 'text-stone-900' : 'text-stone-300'}`}>
              {fbg ? fbg.value : '—'}
            </p>
          </div>
          <div>
            <p className="font-label text-label text-stone-500 mb-1">Adherence</p>
            <p className="font-vital-lg text-vital-lg" style={{ color: adh != null ? c.ring : '#d6d3d1' }}>
              {adh != null ? `${adh}%` : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between lg:w-1/6 gap-4">
          <div className="w-16 h-8 flex items-center">
            {trendPath && (
              <svg height="100%" preserveAspectRatio="none" viewBox="0 0 60 30" width="100%">
                <path d={trendPath} fill="none" stroke={c.ring} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            )}
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold" style={{ backgroundColor: `${c.ring}1a`, color: c.ring }}>{c.label}</span>
        </div>
      </div>
    </Link>
  );
}

function sparklinePath(values: number[]): string | null {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const w = 60, h = 30, pad = 4;
  const stepX = (w - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + ((max - v) / range) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}
