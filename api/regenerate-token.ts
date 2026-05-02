import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Care_companion_Saathi_bot';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

function safeJson(s: any): any {
  try { return typeof s === 'string' ? JSON.parse(s) : (s || {}); } catch { return {}; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const body = safeJson(req.body);
  const patientId: string | undefined = body.patient_id;
  if (!patientId) {
    res.status(400).json({ error: 'patient_id required' });
    return;
  }

  try {
    const { data: existing, error: lookupErr } = await supabase
      .from('patients')
      .select('id, full_name, telegram_chat_id')
      .eq('id', patientId)
      .maybeSingle();
    if (lookupErr || !existing) {
      res.status(404).json({ error: 'patient not found' });
      return;
    }

    const newStartToken = randomBytes(12).toString('hex');

    const { error: upErr } = await supabase
      .from('patients')
      .update({ telegram_link_token: newStartToken })
      .eq('id', patientId);
    if (upErr) {
      res.status(500).json({ error: 'regenerate failed', detail: upErr.message });
      return;
    }

    try {
      await supabase.from('audit_log').insert({
        actor_type: 'clinician',
        action: 'regenerate_telegram_link',
        target_table: 'patients',
        target_id: patientId,
        changes: { had_chat_id: Boolean(existing.telegram_chat_id) }
      });
    } catch {}

    res.status(200).json({
      patient_id: patientId,
      start_token: newStartToken,
      telegram_link: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${newStartToken}`,
      previously_bound: Boolean(existing.telegram_chat_id)
    });
  } catch (err: any) {
    console.error('regenerate-token error', err);
    res.status(500).json({ error: 'internal_error', detail: err?.message || String(err) });
  }
}
