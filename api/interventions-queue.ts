import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

const LANG_LABEL: Record<string, string> = { en: 'English', hi: 'Hindi', kn: 'Kannada' };

function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const t = new Date(dob).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / (365.25 * 24 * 3600 * 1000)));
}

function relativeLabel(iso: string | null | undefined): string {
  if (!iso) return 'just now';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return 'just now';
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

function shortCondition(condition: string, icd10?: string | null): string {
  if (icd10?.startsWith('E11')) return 'T2DM';
  if (icd10?.startsWith('I10')) return 'HTN';
  if (icd10?.startsWith('E78')) return 'Dyslipidemia';
  if (icd10?.startsWith('N18')) return 'CKD';
  return condition.split(/\s+/).slice(0, 2).join(' ');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const filterPatientId = (req.query.patient as string | undefined)?.trim();

  try {
    let q = supabase
      .from('interventions')
      .select('id, patient_id, recommendation_text, citation, clinical_reasoning, status, created_at, triggered_by_risk_event_id')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });
    if (filterPatientId) q = q.eq('patient_id', filterPatientId);
    const { data: items, error } = await q;
    if (error) {
      res.status(500).json({ error: 'queue lookup failed', detail: error.message });
      return;
    }

    const rows = items || [];
    const patientIds = Array.from(new Set(rows.map(r => r.patient_id)));
    const eventIds = Array.from(new Set(rows.map(r => r.triggered_by_risk_event_id).filter(Boolean) as string[]));

    const [pRes, dxRes, evRes] = await Promise.all([
      patientIds.length
        ? supabase.from('patients').select('id, full_name, dob, sex, preferred_language').in('id', patientIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      patientIds.length
        ? supabase.from('diagnoses').select('patient_id, condition, icd10_code').in('patient_id', patientIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      eventIds.length
        ? supabase.from('risk_events').select('id, event_type, severity, narrative_text').in('id', eventIds)
        : Promise.resolve({ data: [] as any[], error: null })
    ]);

    const patientById: Record<string, any> = {};
    for (const p of (pRes.data || []) as any[]) patientById[p.id] = p;

    const diagnosesByPatient: Record<string, string[]> = {};
    for (const d of (dxRes.data || []) as any[]) {
      const list = (diagnosesByPatient[d.patient_id] ||= []);
      const short = shortCondition(d.condition, d.icd10_code);
      if (!list.includes(short)) list.push(short);
    }

    const eventById: Record<string, any> = {};
    for (const ev of (evRes.data || []) as any[]) eventById[ev.id] = ev;

    const queue = rows.map(it => {
      const p = patientById[it.patient_id] || {};
      const conditions = diagnosesByPatient[it.patient_id] || [];
      const ev = it.triggered_by_risk_event_id ? eventById[it.triggered_by_risk_event_id] : null;
      const langCode: string = p.preferred_language || 'en';
      const firstName = (p.full_name || '').split(/\s+/)[0] || p.full_name || '';
      return {
        id: it.id,
        patient_id: it.patient_id,
        patient_name: p.full_name || 'Unknown',
        patient_first_name: firstName,
        patient_age: ageFromDob(p.dob),
        patient_sex: p.sex,
        conditions,
        recommendation_text: it.recommendation_text,
        clinical_reasoning: it.clinical_reasoning,
        citation: it.citation,
        message_language: langCode,
        message_language_label: LANG_LABEL[langCode] || 'English',
        triggering_event: ev ? {
          event_type: ev.event_type,
          severity: ev.severity,
          narrative_text: ev.narrative_text
        } : null,
        created_at: it.created_at,
        drafted_relative: relativeLabel(it.created_at)
      };
    });

    res.status(200).json({
      total: queue.length,
      filtered_by_patient: filterPatientId || null,
      items: queue,
      generated_at: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('interventions-queue error', err);
    res.status(500).json({ error: 'internal_error', detail: err?.message || String(err) });
  }
}
