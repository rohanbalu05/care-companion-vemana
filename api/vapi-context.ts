import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

const LANG_LABEL: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  kn: 'Kannada'
};

const FREQ_HUMAN: Record<string, string> = {
  OD: 'every morning',
  BD: 'twice daily',
  TDS: 'three times a day',
  QID: 'four times a day',
  SOS: 'as needed',
  HS: 'at bedtime'
};

function yearsBetween(fromIso: string | null | undefined, ref: Date): number | null {
  if (!fromIso) return null;
  const t = new Date(fromIso).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.floor((ref.getTime() - t) / (365.25 * 24 * 3600 * 1000)));
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'a while ago';
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);
  const sameDay = then.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = then.toDateString() === yesterday.toDateString();
  const hour = then.getHours();
  const partOfDay = hour < 5 ? 'overnight' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

  if (diffMin < 2) return 'just now';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (sameDay) return `today ${partOfDay}`;
  if (isYesterday) return `yesterday ${partOfDay}`;
  if (diffHr < 24 * 7) {
    const days = Math.round(diffHr / 24);
    return `${days} days ago`;
  }
  const weeks = Math.round(diffHr / (24 * 7));
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

function isFbg(t: string) { return t === 'fbg' || t === 'glucose_fasting'; }
function isPpbg(t: string) { return t === 'ppbg' || t === 'glucose_postprandial'; }

function formatVital(v: any): string {
  const when = formatRelative(v.recorded_at);
  if (v.vital_type === 'bp' && v.value_systolic && v.value_diastolic) {
    return `BP ${v.value_systolic}/${v.value_diastolic} ${when}`;
  }
  if (isFbg(v.vital_type) && v.value_numeric != null) {
    return `fasting glucose ${v.value_numeric} ${v.unit || 'mg/dL'} ${when}`;
  }
  if (isPpbg(v.vital_type) && v.value_numeric != null) {
    return `post-meal glucose ${v.value_numeric} ${v.unit || 'mg/dL'} ${when}`;
  }
  if (v.vital_type === 'weight' && v.value_numeric != null) {
    return `weight ${v.value_numeric} ${v.unit || 'kg'} ${when}`;
  }
  if (v.vital_type === 'spo2' && v.value_numeric != null) {
    return `SpO2 ${v.value_numeric}% ${when}`;
  }
  return `${v.vital_type} reading ${when}`;
}

function formatMedication(m: any): string {
  const dose = m.dose_amount && m.dose_unit ? `${m.dose_amount}${m.dose_unit}` : '';
  const freq = m.frequency ? (FREQ_HUMAN[m.frequency] || m.frequency) : '';
  const instr = m.instructions ? ` (${m.instructions})` : '';
  return [m.drug_name, dose, freq].filter(Boolean).join(' ') + instr;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const patientId = (req.query.patient_id as string | undefined)?.trim();
  if (!patientId) {
    res.status(400).json({ error: 'patient_id required' });
    return;
  }

  try {
    const now = new Date();

    const [pRes, dxRes, medsRes, vitalsRes, riskRes, adhRes] = await Promise.all([
      supabase.from('patients')
        .select('id, full_name, dob, preferred_language, last_detected_language, telegram_linked_at, clinic_id, enrolled_by_clinician_id')
        .eq('id', patientId).single(),
      supabase.from('diagnoses')
        .select('condition, diagnosed_on').eq('patient_id', patientId)
        .order('diagnosed_on', { ascending: true }),
      supabase.from('medications')
        .select('drug_name, dose_amount, dose_unit, frequency, instructions')
        .eq('patient_id', patientId).eq('status', 'active'),
      supabase.from('vitals')
        .select('vital_type, value_systolic, value_diastolic, value_numeric, unit, recorded_at')
        .eq('patient_id', patientId).order('recorded_at', { ascending: false }).limit(3),
      supabase.from('risk_events')
        .select('event_type, severity, narrative_text, detected_at, rule_fired')
        .eq('patient_id', patientId).order('detected_at', { ascending: false }).limit(1),
      supabase.from('adherence_events')
        .select('status, scheduled_at, taken_at')
        .eq('patient_id', patientId).order('scheduled_at', { ascending: false }).limit(20)
    ]);

    const patient = pRes.data;
    if (!patient) {
      res.status(404).json({ error: 'patient not found' });
      return;
    }

    const [clinicRes, clinicianRes] = await Promise.all([
      patient.clinic_id
        ? supabase.from('clinics').select('name').eq('id', patient.clinic_id).maybeSingle()
        : Promise.resolve({ data: null }),
      patient.enrolled_by_clinician_id
        ? supabase.from('clinicians').select('full_name').eq('id', patient.enrolled_by_clinician_id).maybeSingle()
        : Promise.resolve({ data: null })
    ]);

    const ageYears = yearsBetween(patient.dob, now);
    const firstName = (patient.full_name || '').split(/\s+/)[0] || patient.full_name || '';
    const langCode = patient.preferred_language || 'en';
    const preferredLanguage = LANG_LABEL[langCode] || 'English';

    const conditions = (dxRes.data || []).map((d: any) => {
      const yrs = yearsBetween(d.diagnosed_on, now);
      return yrs != null ? `${d.condition} (${yrs} year${yrs === 1 ? '' : 's'})` : d.condition;
    }).join(', ') || 'no chronic conditions on record';

    const vitalsSummary = (vitalsRes.data || []).map(formatVital).join(', ') || 'no recent vitals on record';
    const medications = (medsRes.data || []).map(formatMedication).join(', ') || 'no active medications on record';

    const lastTouchTimes = [
      patient.telegram_linked_at,
      vitalsRes.data?.[0]?.recorded_at,
      riskRes.data?.[0]?.detected_at
    ].filter(Boolean).map((s: string) => new Date(s).getTime());
    const lastTouchIso = lastTouchTimes.length > 0
      ? new Date(Math.max(...lastTouchTimes)).toISOString()
      : null;
    const lastContact = lastTouchIso ? `${formatRelative(lastTouchIso)} via Telegram` : 'no recent contact';

    const adh = (adhRes.data || []);
    const last7CutoffMs = now.getTime() - 7 * 24 * 3600 * 1000;
    const recentAdh = adh.filter((r: any) => r.scheduled_at && new Date(r.scheduled_at).getTime() >= last7CutoffMs);
    const taken = recentAdh.filter((r: any) => r.status === 'taken').length;
    const missed = recentAdh.filter((r: any) => r.status === 'missed').length;

    const riskRow = riskRes.data?.[0];
    const riskParts: string[] = [];
    if (riskRow?.narrative_text) riskParts.push(riskRow.narrative_text);
    if (missed >= 2) riskParts.push(`${missed} missed doses in the past week`);
    if ((vitalsRes.data || []).some((v: any) => v.vital_type === 'bp' && v.value_systolic && v.value_systolic >= 140)) {
      riskParts.push('BP trending high in recent readings');
    }
    if ((vitalsRes.data || []).some((v: any) => isPpbg(v.vital_type) && v.value_numeric && v.value_numeric >= 200)) {
      riskParts.push('post-meal glucose above target');
    }
    if ((vitalsRes.data || []).some((v: any) => isFbg(v.vital_type) && v.value_numeric && v.value_numeric >= 140)) {
      riskParts.push('fasting glucose above target');
    }
    const riskSummary = riskParts.length > 0
      ? riskParts.join('. ') + '.'
      : 'No active risk flags. Adherence and vitals within range over the past week.';

    const clinicianName = clinicianRes.data?.full_name || 'Dr. Priya Mehta';

    res.status(200).json({
      clinicianName,
      patientName: patient.full_name,
      patientFirstName: firstName,
      patientAge: ageYears != null ? String(ageYears) : 'unknown',
      preferredLanguage,
      conditions,
      vitalsSummary,
      medications,
      lastContact,
      riskSummary,
      _meta: {
        clinic: clinicRes.data?.name || null,
        last_detected_language: patient.last_detected_language || null,
        adherence_7d: { taken, missed }
      }
    });
  } catch (err) {
    console.error('vapi-context error', err);
    res.status(500).json({ error: 'internal error', detail: String(err) });
  }
}
