import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

export type RiskLevel = 'critical' | 'elevated' | 'watch' | 'stable';

export type DashboardData = {
  patient: {
    id: string;
    full_name: string;
    first_name: string;
    age: number | null;
    sex: string | null;
    phone: string | null;
    city: string | null;
    preferred_language: string;
    preferred_language_label: string;
    last_detected_language: string | null;
    diagnoses_label: string;
    diagnoses_short: string;
    diagnoses: Array<{ condition: string; years: number | null; label: string; short: string }>;
    clinic_name: string | null;
    clinic_city: string | null;
    clinician_name: string;
    last_contact: { iso: string | null; label: string };
    telegram_linked: boolean;
  };
  guardian: { name: string; phone: string | null; relationship: string | null; address: string | null } | null;
  risk: {
    level: RiskLevel;
    narrative: string | null;
    citation: string | null;
    rule_fired: string | null;
    detected_at: string | null;
    events_count: number;
    events: Array<{
      id: string;
      event_type: string;
      severity: string;
      rule_fired: string | null;
      narrative_text: string | null;
      guideline_citation: string | null;
      detected_at: string;
      relative: string;
      data_point_refs: any;
      llm_reasoning_trace: any;
      primary_diagnosis_id: string | null;
      involved_diagnosis_ids: string[] | null;
    }>;
  };
  vitals: {
    latest_bp: { systolic: number; diastolic: number; recorded_at: string; relative: string; out_of_range: boolean } | null;
    latest_fbg: { value: number; unit: string; recorded_at: string; relative: string; out_of_range: boolean } | null;
    latest_ppbg: { value: number; unit: string; recorded_at: string; relative: string; out_of_range: boolean } | null;
    latest_glucose_any: { value: number; unit: string; kind: 'fasting' | 'post_meal' | 'random'; recorded_at: string; relative: string; out_of_range: boolean } | null;
    last_14_bp: Array<{ recorded_at: string; systolic: number; diastolic: number }>;
    last_14_glucose: Array<{ recorded_at: string; value: number; kind: 'fbg' | 'ppbg' | 'random' }>;
  };
  wellness: {
    score: number | null;
    subscores: { adherence: number; vitals: number; engagement: number; symptom: number } | null;
    trend: Array<{ date: string; score: number }>;
    voucher_target: number;
  };
  adherence_7d: {
    taken: number;
    missed: number;
    total: number;
    pct: number | null;
    last_14_status: string[];
    last_14_days: Array<{ date: string; status: 'taken' | 'missed' | 'pending' }>;
  };
  active_medications: Array<{ drug_name: string; dose: string | null; frequency: string | null; instructions: string | null; prescribed_on: string | null }>;
  medications_adherence: Array<{
    drug_name: string;
    dose: string | null;
    frequency: string | null;
    purpose: string | null;
    adherence_pct_30d: number | null;
    doses_resolved_30d: number;
  }>;
  recent_events: Array<{
    kind: 'vital_bp' | 'vital_glucose' | 'adherence_taken' | 'adherence_missed' | 'symptom' | 'intervention_sent' | 'risk_event';
    label: string;
    detail?: string | null;
    severity?: 'info' | 'warn' | 'alert';
    language?: string | null;
    recorded_at: string;
    relative: string;
  }>;
  check_in: { last_7_days: Array<{ date: string; logged: boolean }>; streak: number };
  interventions: Array<{
    id: string;
    recommendation_text: string;
    citation: string | null;
    clinical_reasoning: string | null;
    status: string;
    sent_message_text: string | null;
    sent_at: string | null;
    approved_at: string | null;
    created_at: string;
  }>;
  _meta: { generated_at: string; patient_id: string };
};

type InterventionPatch = Partial<DashboardData['interventions'][number]>;

type Ctx = {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  patchIntervention: (id: string, patch: InterventionPatch) => void;
};

const DashboardContext = createContext<Ctx>({
  data: null,
  loading: true,
  error: null,
  refresh: () => {},
  patchIntervention: () => {}
});

type ProviderProps = {
  patientId?: string;
  token?: string;
  guardianToken?: string;
  children: ReactNode;
};

export function DashboardProvider({ patientId, token, guardianToken, children }: ProviderProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (patientId) params.set('patient_id', patientId);
    else if (token) params.set('token', token);
    else if (guardianToken) params.set('guardian_token', guardianToken);
    const qs = params.toString();
    const url = `${API_BASE}/api/dashboard-data${qs ? `?${qs}` : ''}`;
    fetch(url)
      .then(async r => {
        if (!r.ok) {
          let detail = '';
          try { const j = await r.json(); detail = j?.error || ''; } catch {}
          throw new Error(detail || `status ${r.status}`);
        }
        return (await r.json()) as DashboardData;
      })
      .then(d => { if (!aborted) { setData(d); setLoading(false); } })
      .catch(e => { if (!aborted) { setError(e?.message || String(e)); setLoading(false); } });
    return () => { aborted = true; };
  }, [patientId, token, guardianToken, tick]);

  useEffect(() => {
    if (error === 'invalid_or_expired_token') return;
    const id = setInterval(() => setTick(t => t + 1), 8000);
    const onVis = () => { if (!document.hidden) setTick(t => t + 1); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [error]);

  function patchIntervention(id: string, patch: InterventionPatch) {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        interventions: prev.interventions.map(i => i.id === id ? { ...i, ...patch } : i)
      };
    });
  }

  return (
    <DashboardContext.Provider value={{ data, loading, error, refresh: () => setTick(t => t + 1), patchIntervention }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}

export function riskColor(level: RiskLevel): { ring: string; pill: string; text: string; label: string } {
  switch (level) {
    case 'critical': return { ring: '#DC2626', pill: 'bg-error-container text-on-error-container', text: 'text-error', label: 'CRITICAL' };
    case 'elevated': return { ring: '#EA580C', pill: 'bg-[#EA580C]/10 text-[#EA580C]', text: 'text-[#EA580C]', label: 'ELEVATED' };
    case 'watch':    return { ring: '#CA8A04', pill: 'bg-[#CA8A04]/10 text-[#CA8A04]', text: 'text-[#CA8A04]', label: 'WATCH' };
    default:         return { ring: '#16A34A', pill: 'bg-[#16A34A]/10 text-[#16A34A]', text: 'text-[#16A34A]', label: 'STABLE' };
  }
}
