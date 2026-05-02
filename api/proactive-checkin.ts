import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CRON_SECRET = process.env.CRON_SECRET || '';
const LLM_MODEL_FAST = process.env.LLM_MODEL_FAST || 'anthropic/claude-haiku-4.5';
const TG_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const LLM_TIMEOUT_MS = 15000;

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

function isAuthorized(req: VercelRequest): boolean {
  const cronHeader = (req.headers['x-vercel-cron'] || req.headers['X-Vercel-Cron']) as string | undefined;
  if (cronHeader) return true;
  const auth = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
  if (!CRON_SECRET) return false;
  if (!auth) return false;
  const expected = `Bearer ${CRON_SECRET}`;
  return auth === expected;
}

function isFbg(t: string) { return t === 'fbg' || t === 'glucose_fasting'; }
function isPpbg(t: string) { return t === 'ppbg' || t === 'glucose_postprandial'; }

type PatientRow = {
  id: string;
  full_name: string;
  dob: string | null;
  preferred_language: string;
  telegram_chat_id: string;
};

type Summary = {
  vitalsLines: string[];
  adherenceLine: string;
  symptomsLine: string;
  silent: boolean;
};

async function buildSummary(patientId: string): Promise<{ summary: Summary; conditions: string[] }> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const [vRes, aRes, sRes, dxRes] = await Promise.all([
    supabase.from('vitals')
      .select('vital_type, value_systolic, value_diastolic, value_numeric, recorded_at')
      .eq('patient_id', patientId).gte('recorded_at', since)
      .order('recorded_at', { ascending: false }),
    supabase.from('adherence_events')
      .select('status, scheduled_at, medication_id')
      .eq('patient_id', patientId).gte('scheduled_at', since),
    supabase.from('symptoms')
      .select('symptom_text_normalized, symptom_text_raw, severity, recorded_at')
      .eq('patient_id', patientId).gte('recorded_at', since)
      .order('recorded_at', { ascending: false }),
    supabase.from('diagnoses')
      .select('condition, icd10_code')
      .eq('patient_id', patientId)
  ]);

  const vitalsRows = (vRes.data || []) as any[];
  const adhRows = (aRes.data || []) as any[];
  const symRows = (sRes.data || []) as any[];

  const conditions = ((dxRes.data || []) as any[]).map(d => {
    if (d.icd10_code?.startsWith('E11')) return 'Type 2 Diabetes';
    if (d.icd10_code?.startsWith('I10')) return 'Hypertension';
    if (d.icd10_code?.startsWith('E78')) return 'Dyslipidemia';
    if (d.icd10_code?.startsWith('N18')) return 'CKD';
    return d.condition;
  });

  const vitalsLines: string[] = [];
  for (const v of vitalsRows.slice(0, 6)) {
    if (v.vital_type === 'bp' && v.value_systolic != null && v.value_diastolic != null) {
      vitalsLines.push(`BP ${v.value_systolic}/${v.value_diastolic}`);
    } else if (isFbg(v.vital_type) && v.value_numeric != null) {
      vitalsLines.push(`fasting glucose ${v.value_numeric} mg/dL`);
    } else if (isPpbg(v.vital_type) && v.value_numeric != null) {
      vitalsLines.push(`post-meal glucose ${v.value_numeric} mg/dL`);
    } else if (v.vital_type === 'glucose_random' && v.value_numeric != null) {
      vitalsLines.push(`random glucose ${v.value_numeric} mg/dL`);
    }
  }

  const taken = adhRows.filter(r => r.status === 'taken' || r.status === 'late').length;
  const missed = adhRows.filter(r => r.status === 'missed').length;
  const pending = adhRows.filter(r => r.status === 'scheduled' || r.status === 'pending').length;
  const adherenceLine = (taken || missed || pending)
    ? `${taken} dose(s) taken, ${missed} missed, ${pending} still pending`
    : 'no medications scheduled or logged';

  const symptomsLine = symRows.length === 0
    ? 'no symptoms reported'
    : symRows.slice(0, 3).map(s => `"${s.symptom_text_normalized || s.symptom_text_raw}"${s.severity ? ` (${s.severity})` : ''}`).join(', ');

  const silent = vitalsLines.length === 0 && taken === 0 && missed === 0 && symRows.length === 0;

  return {
    summary: { vitalsLines, adherenceLine, symptomsLine, silent },
    conditions
  };
}

async function composeProactiveMessage(patient: PatientRow, conditions: string[], summary: Summary): Promise<string | null> {
  const langCode = patient.preferred_language || 'en';
  const langLabel = LANG_LABEL[langCode] || 'English';
  const firstName = (patient.full_name || '').split(/\s+/)[0] || patient.full_name || '';
  const age = ageFromDob(patient.dob);
  const conditionsLabel = conditions.length > 0 ? conditions.join(' + ') : 'chronic conditions';

  const summaryBlock = summary.silent
    ? 'They have not logged anything in the last 24 hours.'
    : [
        summary.vitalsLines.length > 0 ? `Vitals logged: ${summary.vitalsLines.join('; ')}.` : 'No vitals logged.',
        `Medications: ${summary.adherenceLine}.`,
        `Symptoms: ${summary.symptomsLine}.`
      ].join(' ');

  const systemPrompt = `You are Saathi, a warm care companion for ${firstName}, age ${age != null ? age : 'unknown'}, with ${conditionsLabel}. Their preferred language is ${langLabel}. Compose ONE short proactive message (2-3 sentences max) in ${langLabel} that either:
- asks about the most relevant gap (e.g. no BP logged today → ask for it)
- follows up on the latest concerning event (high reading, missed dose, symptom)
- sends a warm morning prompt if nothing was logged

Rules: never alarm, never give medical advice, end with a gentle question (not a command), address ${firstName} by first name, one emoji max.

Output JSON only: {"message": "..."}`;

  const userPayload = `Last 24 hours for ${firstName}:\n${summaryBlock}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://care-companion-vemana.vercel.app',
        'X-Title': 'Care Companion Proactive Check-in'
      },
      body: JSON.stringify({
        model: LLM_MODEL_FAST,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPayload }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5
      })
    });
    if (!res.ok) {
      console.error('proactive LLM HTTP', res.status, (await res.text()).slice(0, 400));
      return null;
    }
    const j: any = await res.json();
    const content: string | undefined = j?.choices?.[0]?.message?.content;
    if (!content) return null;
    const cleaned = content.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    const msg = typeof parsed?.message === 'string' ? parsed.message.trim() : null;
    return msg && msg.length > 0 ? msg : null;
  } catch (err) {
    console.error('proactive LLM error', err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function sendTelegramText(chatId: string, text: string): Promise<{ ok: boolean; status: number }> {
  if (!TELEGRAM_TOKEN) return { ok: false, status: 0 };
  const res = await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  return { ok: res.ok, status: res.status };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  try {
    const { data: patients, error: pErr } = await supabase
      .from('patients')
      .select('id, full_name, dob, preferred_language, telegram_chat_id')
      .not('telegram_chat_id', 'is', null);

    if (pErr) {
      res.status(500).json({ error: 'patients lookup failed', detail: pErr.message });
      return;
    }

    const sent: Array<{ patient_id: string; message: string; telegram_status: number }> = [];
    const skipped: Array<{ patient_id: string; reason: string }> = [];

    for (const p of (patients || []) as PatientRow[]) {
      const { summary, conditions } = await buildSummary(p.id);
      const message = await composeProactiveMessage(p, conditions, summary);
      if (!message) {
        skipped.push({ patient_id: p.id, reason: 'llm_no_message' });
        continue;
      }
      const tg = await sendTelegramText(p.telegram_chat_id, message);
      if (!tg.ok) {
        skipped.push({ patient_id: p.id, reason: `telegram_${tg.status}` });
        continue;
      }
      try {
        await supabase.from('audit_log').insert({
          actor_type: 'system',
          action: 'proactive_checkin_sent',
          target_table: 'patients',
          target_id: p.id,
          changes: { message, telegram_status: tg.status, summary_silent: summary.silent }
        });
      } catch (e) {
        console.error('proactive audit_log insert failed', e);
      }
      sent.push({ patient_id: p.id, message, telegram_status: tg.status });
    }

    res.status(200).json({
      ok: true,
      sent,
      skipped,
      generated_at: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('proactive-checkin error', err);
    res.status(500).json({ error: 'internal_error', detail: err?.message || String(err) });
  }
}
