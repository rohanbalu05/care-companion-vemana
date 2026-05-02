import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TG_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

function safeJson(s: any): any {
  try { return typeof s === 'string' ? JSON.parse(s) : (s || {}); } catch { return {}; }
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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const body = safeJson(req.body);
  const interventionId: string | undefined = body.intervention_id;
  const action: 'approve' | 'reject' | undefined = body.action;
  if (!interventionId || (action !== 'approve' && action !== 'reject')) {
    res.status(400).json({ error: 'intervention_id and action (approve|reject) required' });
    return;
  }

  try {
    const { data: iv, error: ivErr } = await supabase
      .from('interventions')
      .select('id, patient_id, recommendation_text, status')
      .eq('id', interventionId)
      .maybeSingle();
    if (ivErr || !iv) {
      res.status(404).json({ error: 'intervention not found' });
      return;
    }

    const now = new Date().toISOString();

    if (action === 'reject') {
      const { error: upErr } = await supabase
        .from('interventions')
        .update({ status: 'rejected', approved_at: now })
        .eq('id', interventionId);
      if (upErr) {
        res.status(500).json({ error: 'update failed', detail: upErr.message });
        return;
      }
      try {
        await supabase.from('audit_log').insert({
          actor_type: 'clinician',
          action: 'intervention_rejected',
          target_table: 'interventions',
          target_id: interventionId,
          changes: { previous_status: iv.status }
        });
      } catch {}
      res.status(200).json({ intervention_id: interventionId, status: 'rejected' });
      return;
    }

    const { data: patient } = await supabase
      .from('patients')
      .select('telegram_chat_id, full_name')
      .eq('id', iv.patient_id)
      .maybeSingle();

    let telegramSent = false;
    let telegramStatus = 0;
    if (patient?.telegram_chat_id) {
      try {
        const r = await sendTelegramText(patient.telegram_chat_id, iv.recommendation_text);
        telegramSent = r.ok;
        telegramStatus = r.status;
      } catch (e) {
        console.error('telegram send failed', e);
      }
    }

    const newStatus = telegramSent ? 'sent' : 'approved';
    const { error: upErr } = await supabase
      .from('interventions')
      .update({
        status: newStatus,
        approved_at: now,
        sent_at: telegramSent ? now : null,
        sent_message_text: iv.recommendation_text
      })
      .eq('id', interventionId);
    if (upErr) {
      res.status(500).json({ error: 'update failed', detail: upErr.message });
      return;
    }

    try {
      await supabase.from('audit_log').insert({
        actor_type: 'clinician',
        action: 'intervention_approved',
        target_table: 'interventions',
        target_id: interventionId,
        changes: {
          previous_status: iv.status,
          telegram_sent: telegramSent,
          telegram_status: telegramStatus
        }
      });
    } catch {}

    res.status(200).json({
      intervention_id: interventionId,
      status: newStatus,
      telegram_sent: telegramSent,
      sent_message_text: iv.recommendation_text,
      patient_linked: Boolean(patient?.telegram_chat_id)
    });
  } catch (err: any) {
    console.error('intervention-action error', err);
    res.status(500).json({ error: 'internal_error', detail: err?.message || String(err) });
  }
}
