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
  };
  vitals: {
    latest_bp: { systolic: number; diastolic: number; recorded_at: string; relative: string; out_of_range: boolean } | null;
    latest_fbg: { value: number; unit: string; recorded_at: string; relative: string; out_of_range: boolean } | null;
    latest_ppbg: { value: number; unit: string; recorded_at: string; relative: string; out_of_range: boolean } | null;
    last_14_bp: Array<{ recorded_at: string; systolic: number; diastolic: number }>;
    last_14_glucose: Array<{ recorded_at: string; value: number; kind: 'fbg' | 'ppbg' }>;
  };
  wellness: {
    score: number | null;
    subscores: { adherence: number; vitals: number; engagement: number; symptom: number } | null;
    trend: Array<{ date: string; score: number }>;
    voucher_target: number;
  };
  adherence_7d: { taken: number; missed: number; total: number; pct: number | null; last_14_status: string[] };
  active_medications: Array<{ drug_name: string; dose: string | null; frequency: string | null; instructions: string | null; prescribed_on: string | null }>;
  interventions: Array<{
    id: string;
    recommendation_text: string;
    citation: string | null;
    clinical_reasoning: string | null;
    status: string;
    sent_message_text: string | null;
    created_at: string;
  }>;
  _meta: { generated_at: string; patient_id: string };
};

type Ctx = {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const DashboardContext = createContext<Ctx>({ data: null, loading: true, error: null, refresh: () => {} });

export function DashboardProvider({ patientId, children }: { patientId?: string; children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setError(null);
    const url = `${API_BASE}/api/dashboard-data${patientId ? `?patient_id=${encodeURIComponent(patientId)}` : ''}`;
    fetch(url)
      .then(async r => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return (await r.json()) as DashboardData;
      })
      .then(d => { if (!aborted) { setData(d); setLoading(false); } })
      .catch(e => { if (!aborted) { setError(e?.message || String(e)); setLoading(false); } });
    return () => { aborted = true; };
  }, [patientId, tick]);

  return (
    <DashboardContext.Provider value={{ data, loading, error, refresh: () => setTick(t => t + 1) }}>
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
