import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  DISEASE_REGISTRY,
  DiseaseId,
  resolveDiseaseId,
  lookupDrugDisease,
  getCitationFor,
  getFallbackMessageEn
} from '../lib/diseaseRegistry';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const RISK_LLM_MODEL = 'anthropic/claude-sonnet-4';
const LLM_TIMEOUT_MS = 25000;
const IDEMPOTENCY_HOURS = 6;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

type EngineSeverity = 'watch' | 'elevated' | 'critical';
type DbSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

const SEVERITY_MAP: Record<EngineSeverity, DbSeverity> = {
  watch: 'low',
  elevated: 'medium',
  critical: 'critical'
};

const SEVERITY_RANK: Record<EngineSeverity, number> = { watch: 1, elevated: 2, critical: 3 };

function bumpSeverity(s: EngineSeverity): EngineSeverity {
  if (s === 'watch') return 'elevated';
  if (s === 'elevated') return 'critical';
  return 'critical';
}

type DataPointRef = { table: string; id: string; summary?: string };

type Candidate = {
  event_type: string;
  base_severity: EngineSeverity;
  final_severity: EngineSeverity;
  severity_modifier: 'comorbidity_escalation' | null;
  primary_diagnosis_id: string | null;
  primary_disease_id: DiseaseId | null;
  involved_diagnosis_ids: string[];
  data_points: DataPointRef[];
  rules_fired: string[];
  detected_at: string;
};

type ProfileDiagnosis = {
  id: string;
  disease_id: DiseaseId;
  display_name: string;
  diagnosed_on: string | null;
};

type ProfileMedication = {
  id: string;
  drug_name: string;
  dose_amount: number | null;
  dose_unit: string | null;
  frequency: string | null;
  start_date: string | null;
  disease_id: DiseaseId | null;
};

type AdherenceRow = {
  id: string;
  medication_id: string;
  drug_name: string;
  status: string;
  scheduled_at: string;
};

type VitalRow = {
  id: string;
  vital_type: string;
  value_systolic: number | null;
  value_diastolic: number | null;
  value_numeric: number | null;
  unit: string | null;
  recorded_at: string;
};

type SymptomRow = {
  id: string;
  symptom_text_normalized: string | null;
  symptom_text_raw: string;
  severity: string | null;
  recorded_at: string;
};

type PatientProfile = {
  patient: {
    id: string;
    full_name: string;
    first_name: string;
    age: number | null;
    sex: string | null;
    preferred_language: string;
    baselines: any;
  };
  active_diagnoses: ProfileDiagnosis[];
  comorbidity_count: number;
  active_medications: ProfileMedication[];
  last_14d: {
    vitals: VitalRow[];
    adherence: AdherenceRow[];
    symptoms: SymptomRow[];
  };
  recent_risk_events: Array<{ event_type: string; severity: string; detected_at: string; narrative_text: string | null }>;
};

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const t = new Date(dob).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / (365.25 * 24 * 3600 * 1000)));
}

async function buildPatientProfile(patientId: string): Promise<PatientProfile> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

  const [pRes, dxRes, medsRes, vitalsRes, adhRes, symRes, riskRes] = await Promise.all([
    supabase.from('patients').select('id, full_name, dob, sex, preferred_language').eq('id', patientId).single(),
    supabase.from('diagnoses').select('id, condition, icd10_code, diagnosed_on, baseline_values').eq('patient_id', patientId).order('diagnosed_on', { ascending: true }),
    supabase.from('medications').select('id, drug_name, dose_amount, dose_unit, frequency, start_date, status').eq('patient_id', patientId).eq('status', 'active'),
    supabase.from('vitals').select('id, vital_type, value_systolic, value_diastolic, value_numeric, unit, recorded_at').eq('patient_id', patientId).gte('recorded_at', fourteenDaysAgo).order('recorded_at', { ascending: false }),
    supabase.from('adherence_events').select('id, medication_id, status, scheduled_at').eq('patient_id', patientId).gte('scheduled_at', fourteenDaysAgo).order('scheduled_at', { ascending: false }),
    supabase.from('symptoms').select('id, symptom_text_raw, symptom_text_normalized, severity, recorded_at').eq('patient_id', patientId).gte('recorded_at', fourteenDaysAgo).order('recorded_at', { ascending: false }),
    supabase.from('risk_events').select('event_type, severity, detected_at, narrative_text').eq('patient_id', patientId).order('detected_at', { ascending: false }).limit(5)
  ]);

  if (pRes.error || !pRes.data) throw new Error(`patient lookup failed: ${pRes.error?.message || 'not found'}`);
  const p: any = pRes.data;
  const firstName = (p.full_name || '').split(/\s+/)[0] || p.full_name || 'there';

  const baselines: any = {};
  for (const d of dxRes.data || []) {
    const bv = (d as any).baseline_values;
    if (bv && typeof bv === 'object') Object.assign(baselines, bv);
  }

  const active_diagnoses: ProfileDiagnosis[] = (dxRes.data || []).map((d: any) => ({
    id: d.id,
    disease_id: resolveDiseaseId(d.condition, d.icd10_code),
    display_name: d.condition,
    diagnosed_on: d.diagnosed_on
  }));

  const medsList: ProfileMedication[] = (medsRes.data || []).map((m: any) => ({
    id: m.id,
    drug_name: m.drug_name,
    dose_amount: m.dose_amount,
    dose_unit: m.dose_unit,
    frequency: m.frequency,
    start_date: m.start_date,
    disease_id: lookupDrugDisease(m.drug_name)
  }));

  const medById: Record<string, ProfileMedication> = {};
  for (const m of medsList) medById[m.id] = m;

  const adhWithNames: AdherenceRow[] = (adhRes.data || []).map((r: any) => ({
    id: r.id,
    medication_id: r.medication_id,
    drug_name: medById[r.medication_id]?.drug_name || 'Unknown drug',
    status: r.status,
    scheduled_at: r.scheduled_at
  }));

  return {
    patient: {
      id: p.id,
      full_name: p.full_name,
      first_name: firstName,
      age: ageFromDob(p.dob),
      sex: p.sex,
      preferred_language: p.preferred_language || 'en',
      baselines
    },
    active_diagnoses,
    comorbidity_count: active_diagnoses.length,
    active_medications: medsList,
    last_14d: {
      vitals: (vitalsRes.data || []) as VitalRow[],
      adherence: adhWithNames,
      symptoms: (symRes.data || []) as SymptomRow[]
    },
    recent_risk_events: (riskRes.data || []) as any[]
  };
}

function diagnosisIdForDisease(profile: PatientProfile, disease: DiseaseId | null): string | null {
  if (!disease) return null;
  const match = profile.active_diagnoses.find(d => d.disease_id === disease);
  return match?.id || null;
}

function ruleBpThresholdBreach(profile: PatientProfile): Candidate | null {
  const bps = profile.last_14d.vitals.filter(v =>
    v.vital_type === 'bp' &&
    typeof v.value_systolic === 'number' &&
    typeof v.value_diastolic === 'number'
  );
  const breaches = bps.filter(v => (v.value_systolic! >= 140) || (v.value_diastolic! >= 90));
  if (breaches.length < 3) return null;

  const anySevere = breaches.some(v => v.value_systolic! >= 160 || v.value_diastolic! >= 100);
  const base: EngineSeverity = (breaches.length >= 4 || anySevere) ? 'critical' : 'elevated';

  const htnDxId = diagnosisIdForDisease(profile, 'htn');

  return {
    event_type: 'bp_threshold_breach',
    base_severity: base,
    final_severity: base,
    severity_modifier: null,
    primary_diagnosis_id: htnDxId,
    primary_disease_id: 'htn',
    involved_diagnosis_ids: htnDxId ? [htnDxId] : [],
    data_points: breaches.slice(0, 6).map(v => ({ table: 'vitals', id: v.id, summary: `BP ${v.value_systolic}/${v.value_diastolic} on ${v.recorded_at.slice(0, 10)}` })),
    rules_fired: ['bp_systolic_ge_140_or_diastolic_ge_90', breaches.length >= 4 ? 'bp_4plus_readings' : 'bp_3_readings', anySevere ? 'bp_single_ge_160_100' : ''].filter(Boolean) as string[],
    detected_at: new Date().toISOString()
  };
}

function ruleGlucoseExcursion(profile: PatientProfile): Candidate | null {
  const fbgs = profile.last_14d.vitals.filter(v => (v.vital_type === 'glucose_fasting' || v.vital_type === 'fbg') && typeof v.value_numeric === 'number');
  const ppbgs = profile.last_14d.vitals.filter(v => (v.vital_type === 'glucose_postprandial' || v.vital_type === 'ppbg') && typeof v.value_numeric === 'number');
  const fbgBreaches = fbgs.filter(v => v.value_numeric! >= 140);
  const ppbgBreaches = ppbgs.filter(v => v.value_numeric! >= 200);
  const total = fbgBreaches.length + ppbgBreaches.length;
  if (total < 2) return null;

  const anySevere = fbgBreaches.some(v => v.value_numeric! >= 180) || ppbgBreaches.some(v => v.value_numeric! >= 250);
  const base: EngineSeverity = anySevere ? 'critical' : 'elevated';

  const t2dmDxId = diagnosisIdForDisease(profile, 't2dm');
  const allBreaches = [...fbgBreaches, ...ppbgBreaches].slice(0, 6);

  return {
    event_type: 'glucose_excursion',
    base_severity: base,
    final_severity: base,
    severity_modifier: null,
    primary_diagnosis_id: t2dmDxId,
    primary_disease_id: 't2dm',
    involved_diagnosis_ids: t2dmDxId ? [t2dmDxId] : [],
    data_points: allBreaches.map(v => ({ table: 'vitals', id: v.id, summary: `${v.vital_type} ${v.value_numeric} ${v.unit || 'mg/dL'} on ${v.recorded_at.slice(0, 10)}` })),
    rules_fired: ['glucose_fbg_ge_140_or_ppbg_ge_200', anySevere ? 'glucose_fbg_ge_180_or_ppbg_ge_250' : ''].filter(Boolean) as string[],
    detected_at: new Date().toISOString()
  };
}

function ruleAdherenceGapCritical(profile: PatientProfile): Candidate[] {
  const out: Candidate[] = [];
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const byMed: Record<string, AdherenceRow[]> = {};
  for (const r of profile.last_14d.adherence) {
    (byMed[r.medication_id] ||= []).push(r);
  }

  for (const med of profile.active_medications) {
    const events = (byMed[med.id] || []).slice().sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    if (events.length === 0) continue;

    const last7 = events.filter(e => new Date(e.scheduled_at).getTime() >= sevenDaysAgo);
    const last7Resolved = last7.filter(e => e.status === 'taken' || e.status === 'missed' || e.status === 'late');
    const last7Taken = last7Resolved.filter(e => e.status === 'taken' || e.status === 'late');
    const adherencePct = last7Resolved.length > 0 ? (last7Taken.length / last7Resolved.length) * 100 : 100;
    const ruleA = last7Resolved.length >= 3 && adherencePct < 80;

    let consecutive = 0;
    let consecutiveBreach = false;
    let consecutiveIds: string[] = [];
    for (const e of events) {
      if (e.status === 'missed') {
        consecutive++;
        consecutiveIds.push(e.id);
        if (consecutive >= 2) { consecutiveBreach = true; }
      } else if (e.status === 'taken' || e.status === 'late') {
        if (!consecutiveBreach) { consecutive = 0; consecutiveIds = []; }
        else break;
      }
    }
    const ruleB = consecutiveBreach;

    if (!ruleA && !ruleB) continue;

    const base: EngineSeverity = ruleB ? 'critical' : 'elevated';
    const dxId = med.disease_id ? diagnosisIdForDisease(profile, med.disease_id) : null;

    const points: DataPointRef[] = [];
    if (ruleB) {
      for (const id of consecutiveIds) {
        const ev = events.find(x => x.id === id);
        if (ev) points.push({ table: 'adherence_events', id: ev.id, summary: `${med.drug_name} missed on ${ev.scheduled_at.slice(0, 10)}` });
      }
    } else {
      for (const e of last7Resolved.filter(x => x.status === 'missed').slice(0, 4)) {
        points.push({ table: 'adherence_events', id: e.id, summary: `${med.drug_name} missed on ${e.scheduled_at.slice(0, 10)}` });
      }
    }

    const rules: string[] = [];
    if (ruleA) rules.push(`adherence_lt_80_pct_7d (${Math.round(adherencePct)}% over ${last7Resolved.length} doses)`);
    if (ruleB) rules.push('two_plus_consecutive_missed');

    out.push({
      event_type: 'adherence_gap_critical',
      base_severity: base,
      final_severity: base,
      severity_modifier: null,
      primary_diagnosis_id: dxId,
      primary_disease_id: med.disease_id,
      involved_diagnosis_ids: dxId ? [dxId] : [],
      data_points: points,
      rules_fired: rules,
      detected_at: new Date().toISOString()
    });
  }
  return out;
}

function ruleSymptomCluster(profile: PatientProfile): Candidate | null {
  const sym = profile.last_14d.symptoms.slice().sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  if (sym.length < 2) return null;

  let bestCount = 0;
  let bestStart = 0;
  for (let i = 0; i < sym.length; i++) {
    const startMs = new Date(sym[i].recorded_at).getTime();
    let count = 0;
    for (let j = i; j < sym.length; j++) {
      if (new Date(sym[j].recorded_at).getTime() - startMs <= 72 * 3600 * 1000) count++;
      else break;
    }
    if (count > bestCount) { bestCount = count; bestStart = i; }
  }
  if (bestCount < 2) return null;
  const base: EngineSeverity = bestCount >= 3 ? 'elevated' : 'watch';
  const involved = profile.active_diagnoses.map(d => d.id);

  return {
    event_type: 'symptom_cluster',
    base_severity: base,
    final_severity: base,
    severity_modifier: null,
    primary_diagnosis_id: null,
    primary_disease_id: null,
    involved_diagnosis_ids: involved,
    data_points: sym.slice(bestStart, bestStart + bestCount).map(s => ({ table: 'symptoms', id: s.id, summary: `${s.symptom_text_normalized || s.symptom_text_raw} on ${s.recorded_at.slice(0, 10)}` })),
    rules_fired: [`two_plus_symptoms_within_72h (count=${bestCount})`],
    detected_at: new Date().toISOString()
  };
}

function ruleSpo2Drop(profile: PatientProfile): Candidate | null {
  const drops = profile.last_14d.vitals.filter(v => v.vital_type === 'spo2' && typeof v.value_numeric === 'number' && v.value_numeric! < 94);
  if (drops.length === 0) return null;
  const anySevere = drops.some(v => v.value_numeric! < 90);
  const base: EngineSeverity = anySevere ? 'critical' : 'elevated';
  const involved = profile.active_diagnoses.map(d => d.id);

  return {
    event_type: 'spo2_drop',
    base_severity: base,
    final_severity: base,
    severity_modifier: null,
    primary_diagnosis_id: null,
    primary_disease_id: null,
    involved_diagnosis_ids: involved,
    data_points: drops.slice(0, 4).map(v => ({ table: 'vitals', id: v.id, summary: `SpO2 ${v.value_numeric}% on ${v.recorded_at.slice(0, 10)}` })),
    rules_fired: [anySevere ? 'spo2_lt_90' : 'spo2_lt_94'],
    detected_at: new Date().toISOString()
  };
}

function ruleMultiFactorPattern(contributors: Candidate[]): Candidate | null {
  if (contributors.length < 2) return null;

  const ts = contributors.map(c => {
    const earliest = c.data_points
      .map(dp => dp.summary?.match(/\d{4}-\d{2}-\d{2}/)?.[0])
      .filter(Boolean)
      .map(d => new Date(d as string).getTime())
      .sort((a, b) => a - b)[0];
    return earliest || new Date(c.detected_at).getTime();
  });

  let overlap = false;
  for (let i = 0; i < ts.length; i++) {
    for (let j = i + 1; j < ts.length; j++) {
      if (Math.abs(ts[i] - ts[j]) <= 72 * 3600 * 1000) { overlap = true; break; }
    }
    if (overlap) break;
  }
  if (!overlap) return null;

  const top = contributors.slice().sort((a, b) => SEVERITY_RANK[b.final_severity] - SEVERITY_RANK[a.final_severity])[0];
  const involvedSet = new Set<string>();
  for (const c of contributors) for (const id of c.involved_diagnosis_ids) involvedSet.add(id);

  return {
    event_type: 'multi_factor_pattern',
    base_severity: 'critical',
    final_severity: 'critical',
    severity_modifier: null,
    primary_diagnosis_id: top.primary_diagnosis_id,
    primary_disease_id: top.primary_disease_id,
    involved_diagnosis_ids: Array.from(involvedSet),
    data_points: contributors.flatMap(c => c.data_points).slice(0, 8),
    rules_fired: contributors.map(c => c.event_type),
    detected_at: new Date().toISOString()
  };
}

function applyComorbidityModifier(c: Candidate, comorbidityCount: number): Candidate {
  if (comorbidityCount < 3) return c;
  if (c.base_severity === 'critical') return c;
  return {
    ...c,
    final_severity: bumpSeverity(c.base_severity),
    severity_modifier: 'comorbidity_escalation'
  };
}

function runRules(profile: PatientProfile): Candidate[] {
  const single: Candidate[] = [];
  const bp = ruleBpThresholdBreach(profile); if (bp) single.push(bp);
  const glu = ruleGlucoseExcursion(profile); if (glu) single.push(glu);
  for (const a of ruleAdherenceGapCritical(profile)) single.push(a);
  const sym = ruleSymptomCluster(profile); if (sym) single.push(sym);
  const spo2 = ruleSpo2Drop(profile); if (spo2) single.push(spo2);

  const bumped = single.map(c => applyComorbidityModifier(c, profile.comorbidity_count));
  const multi = ruleMultiFactorPattern(bumped);
  return multi ? [...bumped, multi] : bumped;
}

type LlmOutput = {
  narrative: string;
  citation: string;
  intervention_message: string;
  suggested_action: 'schedule_call' | 'medication_review' | 'lab_test' | 'lifestyle_check' | 'urgent_review';
};

const LLM_SYSTEM_PROMPT = `You are a clinical reasoning assistant for Care Companion, a chronic care monitoring platform for Indian patients with multiple chronic conditions. Compose a 3-4 sentence narrative describing a detected risk event using ONLY the data provided. The narrative must:
- Reference the patient's full diagnosis list, not just the disease that triggered the rule.
- Reference the specific data points that fired the rule and any baseline values.
- If comorbidity_count >= 2, explicitly explain why this event is more concerning given the comorbidities.
- End with one guideline citation matching the primary diagnosis (provided to you).

Then draft a 2-3 sentence intervention message in the patient's preferred_language, addressed by first_name, suggesting one concrete action. Do not mention guideline names in the patient message.

Output ONLY valid JSON:
{ "narrative": string, "citation": string, "intervention_message": string, "suggested_action": "schedule_call"|"medication_review"|"lab_test"|"lifestyle_check"|"urgent_review" }`;

async function callRiskLlm(profile: PatientProfile, candidate: Candidate): Promise<LlmOutput | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);
  const userPayload = {
    patient: {
      first_name: profile.patient.first_name,
      age: profile.patient.age,
      preferred_language: profile.patient.preferred_language,
      baselines: profile.patient.baselines
    },
    active_diagnoses: profile.active_diagnoses.map(d => ({ name: d.display_name, disease_id: d.disease_id, diagnosed_on: d.diagnosed_on })),
    comorbidity_count: profile.comorbidity_count,
    active_medications: profile.active_medications.map(m => ({
      drug_name: m.drug_name,
      dose: m.dose_amount && m.dose_unit ? `${m.dose_amount}${m.dose_unit}` : null,
      frequency: m.frequency,
      disease_id: m.disease_id
    })),
    candidate: {
      event_type: candidate.event_type,
      severity: candidate.final_severity,
      severity_modifier: candidate.severity_modifier,
      data_points: candidate.data_points,
      rules_fired: candidate.rules_fired,
      primary_diagnosis_id: candidate.primary_diagnosis_id,
      involved_diagnosis_ids: candidate.involved_diagnosis_ids
    },
    primary_diagnosis_citation: getCitationFor(candidate.primary_disease_id),
    recent_risk_events: profile.recent_risk_events
  };

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://care-companion-vemana.vercel.app',
        'X-Title': 'Care Companion Risk Engine'
      },
      body: JSON.stringify({
        model: RISK_LLM_MODEL,
        messages: [
          { role: 'system', content: LLM_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(userPayload) }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    });
    if (!res.ok) {
      console.error('risk LLM HTTP', res.status, (await res.text()).slice(0, 400));
      return null;
    }
    const j: any = await res.json();
    const content: string | undefined = j?.choices?.[0]?.message?.content;
    if (!content) return null;
    const cleaned = content.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    return JSON.parse(cleaned) as LlmOutput;
  } catch (err) {
    console.error('risk LLM error', err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function isIdempotentSkip(patientId: string, candidate: Candidate): Promise<boolean> {
  const since = new Date(Date.now() - IDEMPOTENCY_HOURS * 3600 * 1000).toISOString();
  let q = supabase.from('risk_events').select('id', { count: 'exact', head: true })
    .eq('patient_id', patientId)
    .eq('event_type', candidate.event_type)
    .gte('detected_at', since);
  if (candidate.primary_diagnosis_id) q = q.eq('primary_diagnosis_id', candidate.primary_diagnosis_id);
  else q = q.is('primary_diagnosis_id', null);
  const { count, error } = await q;
  if (error) {
    console.error('idempotency check failed', error.message);
    return false;
  }
  return (count || 0) > 0;
}

async function insertRiskEventAndIntervention(profile: PatientProfile, candidate: Candidate, llm: LlmOutput | null) {
  const dbSeverity = SEVERITY_MAP[candidate.final_severity];
  const citation = llm?.citation || getCitationFor(candidate.primary_disease_id);
  const narrative = llm?.narrative || null;

  const dataPointRefs = {
    data_points: candidate.data_points,
    rules_fired: candidate.rules_fired,
    severity_modifier: candidate.severity_modifier,
    base_severity: candidate.base_severity,
    final_severity: candidate.final_severity
  };

  const reIns = await supabase.from('risk_events').insert({
    patient_id: profile.patient.id,
    event_type: candidate.event_type,
    severity: dbSeverity,
    score_delta: 0,
    rule_fired: candidate.rules_fired[0] || candidate.event_type,
    data_point_refs: dataPointRefs,
    narrative_text: narrative,
    guideline_citation: citation,
    llm_reasoning_trace: llm ? llm as any : null,
    detected_at: candidate.detected_at,
    primary_diagnosis_id: candidate.primary_diagnosis_id,
    involved_diagnosis_ids: candidate.involved_diagnosis_ids
  }).select('id').single();

  if (reIns.error || !reIns.data) {
    console.error('risk_events insert failed', reIns.error?.message);
    return { riskEventId: null, interventionId: null };
  }
  const riskEventId: string = reIns.data.id;

  const fallbackMessage = getFallbackMessageEn(candidate.primary_disease_id, candidate.event_type, profile.patient.first_name);
  const message = (llm?.intervention_message || fallbackMessage).trim();
  const action = llm?.suggested_action || 'schedule_call';
  const reasoning = `[${action}]${narrative ? `\n\n${narrative}` : ''}`;

  const intIns = await supabase.from('interventions').insert({
    patient_id: profile.patient.id,
    triggered_by_risk_event_id: riskEventId,
    recommendation_text: message,
    citation,
    clinical_reasoning: reasoning,
    status: 'pending_review',
    diagnosis_id: candidate.primary_diagnosis_id
  }).select('id').single();

  if (intIns.error || !intIns.data) {
    console.error('interventions insert failed', intIns.error?.message);
    return { riskEventId, interventionId: null };
  }
  return { riskEventId, interventionId: intIns.data.id as string };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const body: any = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const patientId: string | undefined = body.patient_id;
  if (!patientId) {
    res.status(400).json({ error: 'patient_id required' });
    return;
  }

  const warnings: string[] = [];
  try {
    const profile = await buildPatientProfile(patientId);
    const candidates = runRules(profile);

    let eventsCreated = 0;
    let eventsSkipped = 0;
    let interventionsCreated = 0;
    const eventIds: string[] = [];

    for (const c of candidates) {
      const skip = await isIdempotentSkip(patientId, c);
      if (skip) { eventsSkipped++; continue; }
      const llm = await callRiskLlm(profile, c);
      if (!llm) warnings.push(`llm_fallback:${c.event_type}`);
      const { riskEventId, interventionId } = await insertRiskEventAndIntervention(profile, c, llm);
      if (riskEventId) {
        eventsCreated++;
        eventIds.push(riskEventId);
        if (interventionId) interventionsCreated++;
      }
    }

    try {
      await supabase.from('audit_log').insert({
        actor_type: 'system',
        action: 'risk_evaluation',
        target_table: 'patients',
        target_id: patientId,
        changes: {
          events_created: eventsCreated,
          events_skipped: eventsSkipped,
          interventions_created: interventionsCreated,
          comorbidity_count: profile.comorbidity_count,
          warnings
        }
      });
    } catch (e) { console.error('audit_log insert failed', e); }
    // WELLNESS_RECALC_HOOK

    res.status(200).json({
      patient_id: patientId,
      events_created: eventsCreated,
      events_skipped_idempotency: eventsSkipped,
      interventions_created: interventionsCreated,
      comorbidity_count: profile.comorbidity_count,
      event_ids: eventIds,
      warnings
    });
  } catch (err: any) {
    console.error('evaluate-risk failed', err);
    res.status(500).json({ error: 'engine_error', detail: err?.message || String(err) });
  }
}

function safeJson(s: string): any {
  try { return JSON.parse(s); } catch { return {}; }
}
