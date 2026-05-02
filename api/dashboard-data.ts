import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const ASHA_DEFAULT_ID = '5cf64ecc-0b6a-4cea-b02b-85605a6f5f03';

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

function yearsBetween(fromIso: string | null | undefined): number | null {
  return ageFromDob(fromIso);
}

function diagnosisDurationLabel(yrs: number | null): string {
  if (yrs == null) return '';
  if (yrs < 1) return '<1y';
  return `${yrs}y`;
}

function relativeLabel(iso: string | null | undefined): string {
  if (!iso) return 'a while ago';
  const then = new Date(iso);
  const diffMs = Date.now() - then.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);
  const sameDay = then.toDateString() === new Date().toDateString();
  const yesterday = new Date(); yesterday.setDate(new Date().getDate() - 1);
  const isYesterday = then.toDateString() === yesterday.toDateString();
  if (diffMin < 2) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (sameDay) return `${diffHr}h ago`;
  if (isYesterday) return 'yesterday';
  if (diffHr < 24 * 7) return `${Math.round(diffHr / 24)}d ago`;
  return `${Math.round(diffHr / (24 * 7))}w ago`;
}

function isFbg(t: string) { return t === 'fbg' || t === 'glucose_fasting'; }
function isPpbg(t: string) { return t === 'ppbg' || t === 'glucose_postprandial'; }

function toRiskLevel(score: number, hasCriticalEvent: boolean): 'critical' | 'elevated' | 'watch' | 'stable' {
  if (hasCriticalEvent) return 'critical';
  if (score < 50) return 'critical';
  if (score < 75) return 'elevated';
  if (score < 85) return 'watch';
  return 'stable';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const queryPatientId = (req.query.patient_id as string | undefined)?.trim();
  const queryToken = (req.query.token as string | undefined)?.trim();
  const queryGuardianToken = (req.query.guardian_token as string | undefined)?.trim();

  let patientId = queryPatientId;
  let resolvedFromToken: string | null = null;

  if (!patientId && queryToken) {
    const { data: pp } = await supabase.from('patients').select('id').eq('access_token', queryToken).maybeSingle();
    if (pp?.id) { patientId = pp.id; resolvedFromToken = `patient:${queryToken}`; }
  }
  if (!patientId && queryGuardianToken) {
    const { data: gg } = await supabase.from('guardians').select('patient_id').eq('access_token', queryGuardianToken).maybeSingle();
    if (gg?.patient_id) { patientId = gg.patient_id; resolvedFromToken = `guardian:${queryGuardianToken}`; }
  }
  if (!patientId) patientId = ASHA_DEFAULT_ID;
  patientId = patientId.trim();

  if ((queryToken || queryGuardianToken) && !resolvedFromToken) {
    res.status(404).json({ error: 'invalid_or_expired_token' });
    return;
  }

  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [pRes, dxRes, medsRes, vitalsRes, wellnessRes, riskRes, adhRes, adh30Res, intRes, gRes, sympRes] = await Promise.all([
      supabase.from('patients')
        .select('id, full_name, dob, sex, phone, preferred_language, last_detected_language, telegram_chat_id, telegram_linked_at, clinic_id, enrolled_by_clinician_id, address, city')
        .eq('id', patientId).single(),
      supabase.from('diagnoses')
        .select('condition, diagnosed_on, icd10_code')
        .eq('patient_id', patientId).order('diagnosed_on', { ascending: true }),
      supabase.from('medications')
        .select('id, drug_name, dose_amount, dose_unit, frequency, instructions, status, prescribed_on')
        .eq('patient_id', patientId).eq('status', 'active'),
      supabase.from('vitals')
        .select('vital_type, value_systolic, value_diastolic, value_numeric, unit, recorded_at')
        .eq('patient_id', patientId).gte('recorded_at', fourteenDaysAgo)
        .order('recorded_at', { ascending: false }).limit(60),
      supabase.from('wellness_scores')
        .select('score, sub_score_adherence, sub_score_vitals, sub_score_engagement, sub_score_symptom, calculated_for_date, calculation_breakdown')
        .eq('patient_id', patientId).order('calculated_for_date', { ascending: false }).limit(14),
      supabase.from('risk_events')
        .select('event_type, severity, narrative_text, guideline_citation, rule_fired, detected_at, llm_reasoning_trace')
        .eq('patient_id', patientId).order('detected_at', { ascending: false }).limit(5),
      supabase.from('adherence_events')
        .select('status, scheduled_at, taken_at, medication_id')
        .eq('patient_id', patientId).gte('scheduled_at', sevenDaysAgo).order('scheduled_at', { ascending: false }),
      supabase.from('adherence_events')
        .select('status, scheduled_at, medication_id')
        .eq('patient_id', patientId).gte('scheduled_at', thirtyDaysAgo).order('scheduled_at', { ascending: false }),
      supabase.from('interventions')
        .select('id, recommendation_text, citation, clinical_reasoning, status, sent_message_text, sent_at, approved_at, created_at')
        .eq('patient_id', patientId).order('created_at', { ascending: false }).limit(15),
      supabase.from('guardians')
        .select('full_name, phone, relationship, address')
        .eq('patient_id', patientId).limit(1),
      supabase.from('symptoms')
        .select('id, symptom_text_normalized, symptom_text_raw, severity, recorded_at, language_detected')
        .eq('patient_id', patientId).gte('recorded_at', fourteenDaysAgo)
        .order('recorded_at', { ascending: false }).limit(20)
    ]);

    if (pRes.error || !pRes.data) {
      res.status(404).json({ error: 'patient not found', detail: pRes.error?.message });
      return;
    }
    const p = pRes.data as any;

    const [clinicRes, clinicianRes] = await Promise.all([
      p.clinic_id ? supabase.from('clinics').select('name, city').eq('id', p.clinic_id).maybeSingle() : Promise.resolve({ data: null }),
      p.enrolled_by_clinician_id ? supabase.from('clinicians').select('full_name').eq('id', p.enrolled_by_clinician_id).maybeSingle() : Promise.resolve({ data: null })
    ]);

    const ageYears = ageFromDob(p.dob);
    const firstName = (p.full_name || '').split(/\s+/)[0] || p.full_name || '';
    const langCode: string = p.preferred_language || 'en';

    const diagnoses = (dxRes.data || []).map((d: any) => {
      const yrs = yearsBetween(d.diagnosed_on);
      const durLabel = diagnosisDurationLabel(yrs);
      return {
        condition: d.condition,
        years: yrs,
        label: durLabel ? `${d.condition} (${durLabel})` : d.condition,
        short: d.icd10_code?.startsWith('E11') ? 'T2DM' : d.icd10_code?.startsWith('I10') ? 'HTN' : d.condition.split(/\s+/).slice(0, 2).join(' ')
      };
    });
    const conditionsLabel = diagnoses.map(d => d.label).join(', ') || '—';
    const conditionsShort = diagnoses.map(d => d.short).join(' + ') || '—';

    const allVitals = vitalsRes.data || [];
    const bpRows = allVitals.filter((v: any) => v.vital_type === 'bp');
    const fbgRows = allVitals.filter((v: any) => isFbg(v.vital_type));
    const ppbgRows = allVitals.filter((v: any) => isPpbg(v.vital_type));

    const latestBp = bpRows[0] || null;
    const latestFbg = fbgRows[0] || null;
    const latestPpbg = ppbgRows[0] || null;

    const last14BpAsc = [...bpRows].sort((a: any, b: any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    const last14GlucAsc = [...fbgRows, ...ppbgRows].sort((a: any, b: any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

    const wellnessRows = wellnessRes.data || [];
    const todayWellness = wellnessRows[0] || null;
    const wellnessScore = todayWellness?.score ?? null;

    const adhRows = adhRes.data || [];
    const adhTaken = adhRows.filter((r: any) => r.status === 'taken').length;
    const adhMissed = adhRows.filter((r: any) => r.status === 'missed').length;
    const adhTotal = adhRows.length || 0;
    const adhPct = adhTotal > 0 ? Math.round((adhTaken / adhTotal) * 100) : null;

    const last14Adherence = adhRows.slice(0, 14).reverse().map((r: any) => r.status);

    const riskEvent = (riskRes.data || [])[0] || null;
    const hasCritical = (riskRes.data || []).some((r: any) => r.severity === 'critical' || r.severity === 'high');
    const riskLevel = wellnessScore != null ? toRiskLevel(wellnessScore, hasCritical) : (hasCritical ? 'elevated' : 'watch');

    const lastTouchTimes = [
      p.telegram_linked_at,
      latestBp?.recorded_at,
      latestFbg?.recorded_at,
      latestPpbg?.recorded_at,
      riskEvent?.detected_at
    ].filter(Boolean).map((s: string) => new Date(s).getTime());
    const lastTouchIso = lastTouchTimes.length ? new Date(Math.max(...lastTouchTimes)).toISOString() : null;
    const lastContactLabel = lastTouchIso
      ? `${relativeLabel(lastTouchIso)} via Telegram (${LANG_LABEL[langCode] || 'English'})`
      : 'no recent contact';

    const guardian = (gRes.data || [])[0] || null;

    const interventions = (intRes.data || []).map((i: any) => ({
      id: i.id,
      recommendation_text: i.recommendation_text,
      citation: i.citation,
      clinical_reasoning: i.clinical_reasoning,
      status: i.status,
      sent_message_text: i.sent_message_text,
      sent_at: i.sent_at,
      approved_at: i.approved_at,
      created_at: i.created_at
    }));

    const medsList = (medsRes.data || []) as any[];
    const adh30Rows = (adh30Res.data || []) as any[];
    const adhByMed: Record<string, { taken: number; resolved: number }> = {};
    for (const r of adh30Rows) {
      const k = r.medication_id || 'unknown';
      const slot = (adhByMed[k] ||= { taken: 0, resolved: 0 });
      if (r.status === 'taken' || r.status === 'late') { slot.taken++; slot.resolved++; }
      else if (r.status === 'missed') { slot.resolved++; }
    }
    const medications_adherence = medsList.map(m => {
      const slot = adhByMed[m.id] || { taken: 0, resolved: 0 };
      const pct = slot.resolved > 0 ? Math.round((slot.taken / slot.resolved) * 100) : null;
      const purpose = (() => {
        const drug = (m.drug_name || '').toLowerCase();
        if (/amlodipine|losartan|enalapril|telmisartan|atenolol|metoprolol|ramipril/.test(drug)) return 'Blood pressure';
        if (/metformin|glimepiride|sitagliptin|insulin|gliclazide|glibenclamide|empagliflozin/.test(drug)) return 'Diabetes';
        if (/atorvastatin|rosuvastatin|simvastatin/.test(drug)) return 'Cholesterol';
        if (/aspirin|clopidogrel/.test(drug)) return 'Anti-platelet';
        return null;
      })();
      return {
        drug_name: m.drug_name,
        dose: m.dose_amount && m.dose_unit ? `${m.dose_amount}${m.dose_unit}` : null,
        frequency: m.frequency,
        purpose,
        adherence_pct_30d: pct,
        doses_resolved_30d: slot.resolved
      };
    });

    const symptomsRows = (sympRes.data || []) as any[];
    const recentEvents: Array<{
      kind: 'vital_bp' | 'vital_glucose' | 'adherence_taken' | 'adherence_missed' | 'symptom' | 'intervention_sent' | 'risk_event';
      label: string;
      detail?: string | null;
      severity?: 'info' | 'warn' | 'alert';
      language?: string | null;
      recorded_at: string;
    }> = [];

    for (const v of bpRows.slice(0, 8)) {
      const high = Number(v.value_systolic) >= 140 || Number(v.value_diastolic) >= 90;
      recentEvents.push({
        kind: 'vital_bp',
        label: `BP reading ${v.value_systolic}/${v.value_diastolic}`,
        detail: high ? 'Above usual' : null,
        severity: high ? 'warn' : 'info',
        recorded_at: v.recorded_at
      });
    }
    for (const v of [...fbgRows, ...ppbgRows].slice(0, 8)) {
      const high = isFbg(v.vital_type) ? Number(v.value_numeric) >= 140 : Number(v.value_numeric) >= 200;
      recentEvents.push({
        kind: 'vital_glucose',
        label: `${isFbg(v.vital_type) ? 'Fasting' : 'Post-meal'} glucose ${v.value_numeric} mg/dL`,
        detail: high ? 'Above usual' : null,
        severity: high ? 'warn' : 'info',
        recorded_at: v.recorded_at
      });
    }
    const medById: Record<string, any> = {};
    for (const m of medsList) medById[m.id] = m;
    for (const r of adhRows.slice(0, 12)) {
      if (r.status === 'missed') {
        const drug = medById[r.medication_id]?.drug_name || 'Medication';
        recentEvents.push({
          kind: 'adherence_missed',
          label: `Skipped ${drug}`,
          severity: 'alert',
          recorded_at: r.scheduled_at
        });
      }
    }
    for (const s of symptomsRows.slice(0, 6)) {
      recentEvents.push({
        kind: 'symptom',
        label: `Said "${s.symptom_text_normalized || s.symptom_text_raw}"`,
        detail: s.severity ? `Severity ${s.severity}` : null,
        severity: s.severity === 'severe' ? 'alert' : s.severity === 'moderate' ? 'warn' : 'info',
        language: s.language_detected || null,
        recorded_at: s.recorded_at
      });
    }
    for (const i of (intRes.data || []) as any[]) {
      if (i.status === 'sent' && i.sent_at) {
        recentEvents.push({
          kind: 'intervention_sent',
          label: 'Telegram message from clinic',
          detail: (i.sent_message_text || i.recommendation_text || '').slice(0, 80),
          severity: 'info',
          recorded_at: i.sent_at
        });
      }
    }
    recentEvents.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    const recent_events = recentEvents.slice(0, 12).map(e => ({
      ...e,
      relative: relativeLabel(e.recorded_at)
    }));

    const checkInDays: { date: string; logged: boolean }[] = [];
    const dayKeysWithLog = new Set<string>();
    for (const v of bpRows) dayKeysWithLog.add(v.recorded_at.slice(0, 10));
    for (const v of fbgRows) dayKeysWithLog.add(v.recorded_at.slice(0, 10));
    for (const v of ppbgRows) dayKeysWithLog.add(v.recorded_at.slice(0, 10));
    for (const s of symptomsRows) dayKeysWithLog.add(s.recorded_at.slice(0, 10));
    for (const r of adhRows) {
      if (r.taken_at) dayKeysWithLog.add(r.taken_at.slice(0, 10));
    }
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      checkInDays.push({ date: key, logged: dayKeysWithLog.has(key) });
    }

    let streak = 0;
    for (let i = checkInDays.length - 1; i >= 0; i--) {
      if (checkInDays[i].logged) streak++;
      else break;
    }

    res.status(200).json({
      patient: {
        id: p.id,
        full_name: p.full_name,
        first_name: firstName,
        age: ageYears,
        sex: p.sex,
        phone: p.phone,
        city: p.city,
        preferred_language: langCode,
        preferred_language_label: LANG_LABEL[langCode] || 'English',
        last_detected_language: p.last_detected_language,
        diagnoses_label: conditionsLabel,
        diagnoses_short: conditionsShort,
        diagnoses,
        clinic_name: clinicRes?.data?.name || null,
        clinic_city: clinicRes?.data?.city || null,
        clinician_name: clinicianRes?.data?.full_name || 'Dr. Priya Mehta',
        last_contact: { iso: lastTouchIso, label: lastContactLabel },
        telegram_linked: Boolean(p.telegram_chat_id)
      },
      guardian: guardian ? {
        name: guardian.full_name,
        phone: guardian.phone,
        relationship: guardian.relationship,
        address: guardian.address
      } : null,
      risk: {
        level: riskLevel,
        narrative: riskEvent?.narrative_text || null,
        citation: riskEvent?.guideline_citation || null,
        rule_fired: riskEvent?.rule_fired || null,
        detected_at: riskEvent?.detected_at || null,
        events_count: (riskRes.data || []).length
      },
      vitals: {
        latest_bp: latestBp ? {
          systolic: Number(latestBp.value_systolic),
          diastolic: Number(latestBp.value_diastolic),
          recorded_at: latestBp.recorded_at,
          relative: relativeLabel(latestBp.recorded_at),
          out_of_range: Number(latestBp.value_systolic) >= 140 || Number(latestBp.value_diastolic) >= 90
        } : null,
        latest_fbg: latestFbg ? {
          value: Number(latestFbg.value_numeric),
          unit: latestFbg.unit || 'mg/dL',
          recorded_at: latestFbg.recorded_at,
          relative: relativeLabel(latestFbg.recorded_at),
          out_of_range: Number(latestFbg.value_numeric) >= 140
        } : null,
        latest_ppbg: latestPpbg ? {
          value: Number(latestPpbg.value_numeric),
          unit: latestPpbg.unit || 'mg/dL',
          recorded_at: latestPpbg.recorded_at,
          relative: relativeLabel(latestPpbg.recorded_at),
          out_of_range: Number(latestPpbg.value_numeric) >= 200
        } : null,
        last_14_bp: last14BpAsc.map((v: any) => ({
          recorded_at: v.recorded_at,
          systolic: Number(v.value_systolic),
          diastolic: Number(v.value_diastolic)
        })),
        last_14_glucose: last14GlucAsc.map((v: any) => ({
          recorded_at: v.recorded_at,
          value: Number(v.value_numeric),
          kind: isFbg(v.vital_type) ? 'fbg' : 'ppbg'
        }))
      },
      wellness: {
        score: wellnessScore,
        subscores: todayWellness ? {
          adherence: todayWellness.sub_score_adherence,
          vitals: todayWellness.sub_score_vitals,
          engagement: todayWellness.sub_score_engagement,
          symptom: todayWellness.sub_score_symptom
        } : null,
        trend: wellnessRows.slice().reverse().map((w: any) => ({ date: w.calculated_for_date, score: w.score })),
        voucher_target: 90
      },
      adherence_7d: {
        taken: adhTaken,
        missed: adhMissed,
        total: adhTotal,
        pct: adhPct,
        last_14_status: last14Adherence
      },
      active_medications: medsList.map((m: any) => ({
        drug_name: m.drug_name,
        dose: m.dose_amount && m.dose_unit ? `${m.dose_amount}${m.dose_unit}` : null,
        frequency: m.frequency,
        instructions: m.instructions,
        prescribed_on: m.prescribed_on
      })),
      medications_adherence,
      recent_events: recent_events,
      check_in: { last_7_days: checkInDays, streak },
      interventions,
      _meta: {
        generated_at: new Date().toISOString(),
        patient_id: patientId
      }
    });
  } catch (err) {
    console.error('dashboard-data error', err);
    res.status(500).json({ error: 'internal error', detail: String(err) });
  }
}
