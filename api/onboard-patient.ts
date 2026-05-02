import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomUUID, randomBytes } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

type DiagnosisChoice = 't2dm' | 'htn' | 'both';
type Lang = 'en' | 'hi' | 'kn';

const DIAGNOSIS_TEMPLATES: Record<string, { condition: string; icd10_code: string }> = {
  t2dm: { condition: 'Type 2 Diabetes Mellitus', icd10_code: 'E11' },
  htn:  { condition: 'Essential Hypertension', icd10_code: 'I10' }
};

function dobFromAge(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return d.toISOString().slice(0, 10);
}

function safeJson(s: any): any { try { return typeof s === 'string' ? JSON.parse(s) : (s || {}); } catch { return {}; } }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const body = safeJson(req.body);
  const fullName = (body.full_name || '').trim();
  const age = parseInt(body.age, 10);
  const sex = body.sex === 'female' || body.sex === 'male' ? body.sex : null;
  const phone = (body.phone || '').trim() || null;
  const diagnosisChoice = (body.diagnosis as DiagnosisChoice) || 'both';
  const language = (['en','hi','kn'].includes(body.language) ? body.language : 'en') as Lang;
  const guardianName = (body.guardian_name || '').trim() || null;
  const guardianPhone = (body.guardian_phone || '').trim() || null;
  const guardianRelationship = (body.guardian_relationship || '').trim() || null;

  if (!fullName || !age || isNaN(age) || age < 18 || age > 120) {
    res.status(400).json({ error: 'name and valid age (18-120) required' });
    return;
  }

  try {
    const [{ data: clinic }, { data: clinician }] = await Promise.all([
      supabase.from('clinics').select('id').limit(1).maybeSingle(),
      supabase.from('clinicians').select('id').eq('full_name', 'Dr. Priya Mehta').maybeSingle()
    ]);
    if (!clinic?.id) { res.status(500).json({ error: 'no clinic configured' }); return; }

    const accessToken = randomUUID();
    const startToken = randomBytes(12).toString('hex');

    const { data: pIns, error: pErr } = await supabase.from('patients').insert({
      clinic_id: clinic.id,
      full_name: fullName,
      dob: dobFromAge(age),
      sex,
      phone,
      preferred_language: language,
      enrolled_by_clinician_id: clinician?.id || null,
      access_token: accessToken,
      telegram_link_token: startToken
    }).select('id').single();
    if (pErr || !pIns) { res.status(500).json({ error: 'patient insert failed', detail: pErr?.message }); return; }
    const patientId = pIns.id as string;

    const dxChoices = diagnosisChoice === 'both' ? ['t2dm', 'htn'] : [diagnosisChoice];
    const dxRows = dxChoices.map(k => ({
      patient_id: patientId,
      condition: DIAGNOSIS_TEMPLATES[k].condition,
      icd10_code: DIAGNOSIS_TEMPLATES[k].icd10_code,
      diagnosed_on: new Date().toISOString().slice(0, 10)
    }));
    if (dxRows.length > 0) {
      const { error: dxErr } = await supabase.from('diagnoses').insert(dxRows);
      if (dxErr) console.error('diagnoses insert failed', dxErr.message);
    }

    let guardianId: string | null = null;
    let guardianAccessToken: string | null = null;
    if (guardianName) {
      guardianAccessToken = randomUUID();
      const { data: gIns, error: gErr } = await supabase.from('guardians').insert({
        patient_id: patientId,
        full_name: guardianName,
        phone: guardianPhone,
        relationship: guardianRelationship,
        notify_on_non_response: true,
        access_token: guardianAccessToken
      }).select('id').single();
      if (gErr) console.error('guardian insert failed', gErr.message);
      else guardianId = gIns?.id ?? null;
    }

    try {
      await supabase.from('audit_log').insert({
        actor_type: 'system',
        action: 'patient_onboarded',
        target_table: 'patients',
        target_id: patientId,
        changes: { full_name: fullName, age, language, diagnosis: diagnosisChoice, has_guardian: !!guardianId }
      });
    } catch (e) { console.error('audit_log insert failed', e); }

    res.status(200).json({
      patient_id: patientId,
      access_token: accessToken,
      start_token: startToken,
      guardian_id: guardianId,
      guardian_access_token: guardianAccessToken,
      patient_link: `/patient?token=${accessToken}`,
      guardian_link: guardianAccessToken ? `/guardian?token=${guardianAccessToken}` : null,
      telegram_link: `https://t.me/Care_companion_Saathi_bot?start=${startToken}`
    });
  } catch (err: any) {
    console.error('onboard-patient error', err);
    res.status(500).json({ error: 'internal_error', detail: err?.message || String(err) });
  }
}
