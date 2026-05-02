import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

const LANG_LABEL: Record<string, string> = { en: 'English', hi: 'Hindi', kn: 'Kannada' };

type RiskLevel = 'critical' | 'elevated' | 'watch' | 'stable';

function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const t = new Date(dob).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / (365.25 * 24 * 3600 * 1000)));
}

function relativeLabel(iso: string | null | undefined): string {
  if (!iso) return 'no contact yet';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return 'no contact yet';
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

function isFbg(t: string) { return t === 'fbg' || t === 'glucose_fasting'; }

function shortFromIcd(icd?: string | null, condition?: string): string {
  if (icd?.startsWith('E11')) return 'T2DM';
  if (icd?.startsWith('I10')) return 'HTN';
  if (icd?.startsWith('E78')) return 'Dyslipidemia';
  if (icd?.startsWith('N18')) return 'CKD';
  return (condition || '').split(/\s+/).slice(0, 2).join(' ');
}

function deriveRiskLevel(hasCritical: boolean, adhPct: number | null, bpHigh: boolean, fbgHigh: boolean): RiskLevel {
  if (hasCritical) return 'critical';
  if ((adhPct != null && adhPct < 80) || bpHigh || fbgHigh) return 'elevated';
  if (adhPct != null && adhPct < 90) return 'watch';
  return 'stable';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const { data: pRows, error: pErr } = await supabase
      .from('patients')
      .select('id, full_name, dob, sex, preferred_language, telegram_chat_id, telegram_linked_at, created_at')
      .order('created_at', { ascending: false });
    if (pErr) {
      res.status(500).json({ error: 'patients lookup failed', detail: pErr.message });
      return;
    }
    const patients = pRows || [];
    const ids = patients.map(p => p.id);

    if (ids.length === 0) {
      res.status(200).json({
        stats: { total: 0, high_risk: 0, interventions_pending: 0, telegram_linked: 0 },
        patients: [],
        generated_at: new Date().toISOString()
      });
      return;
    }

    const [dxRes, vitalsRes, adhRes, intRes, riskRes] = await Promise.all([
      supabase.from('diagnoses').select('patient_id, condition, icd10_code').in('patient_id', ids),
      supabase.from('vitals')
        .select('patient_id, vital_type, value_systolic, value_diastolic, value_numeric, recorded_at')
        .in('patient_id', ids)
        .gte('recorded_at', fourteenDaysAgo)
        .order('recorded_at', { ascending: false }),
      supabase.from('adherence_events')
        .select('patient_id, status, scheduled_at')
        .in('patient_id', ids)
        .gte('scheduled_at', sevenDaysAgo),
      supabase.from('interventions')
        .select('patient_id, status, created_at')
        .in('patient_id', ids),
      supabase.from('risk_events')
        .select('patient_id, severity, detected_at')
        .in('patient_id', ids)
        .gte('detected_at', fourteenDaysAgo)
        .order('detected_at', { ascending: false })
    ]);

    const dxByPt: Record<string, string[]> = {};
    for (const d of (dxRes.data || []) as any[]) {
      const list = (dxByPt[d.patient_id] ||= []);
      const s = shortFromIcd(d.icd10_code, d.condition);
      if (s && !list.includes(s)) list.push(s);
    }

    const bpByPt: Record<string, any[]> = {};
    const fbgByPt: Record<string, any[]> = {};
    for (const v of (vitalsRes.data || []) as any[]) {
      if (v.vital_type === 'bp') {
        (bpByPt[v.patient_id] ||= []).push(v);
      } else if (isFbg(v.vital_type)) {
        (fbgByPt[v.patient_id] ||= []).push(v);
      }
    }

    const adhByPt: Record<string, any[]> = {};
    for (const a of (adhRes.data || []) as any[]) {
      (adhByPt[a.patient_id] ||= []).push(a);
    }

    const intPendingByPt: Record<string, number> = {};
    for (const i of (intRes.data || []) as any[]) {
      if (i.status === 'pending_review') {
        intPendingByPt[i.patient_id] = (intPendingByPt[i.patient_id] || 0) + 1;
      }
    }

    const criticalByPt: Record<string, boolean> = {};
    const lastRiskByPt: Record<string, string> = {};
    for (const r of (riskRes.data || []) as any[]) {
      if (r.severity === 'critical' || r.severity === 'high') criticalByPt[r.patient_id] = true;
      if (!lastRiskByPt[r.patient_id]) lastRiskByPt[r.patient_id] = r.detected_at;
    }

    const enriched = patients.map(p => {
      const langCode = p.preferred_language || 'en';
      const bp = (bpByPt[p.id] || [])[0] || null;
      const fbg = (fbgByPt[p.id] || [])[0] || null;
      const adh = adhByPt[p.id] || [];
      const adhResolved = adh.filter((r: any) => r.status === 'taken' || r.status === 'missed' || r.status === 'late');
      const adhTaken = adh.filter((r: any) => r.status === 'taken' || r.status === 'late');
      const adhPct = adhResolved.length > 0 ? Math.round((adhTaken.length / adhResolved.length) * 100) : null;

      const bpHigh = bp ? (Number(bp.value_systolic) >= 140 || Number(bp.value_diastolic) >= 90) : false;
      const fbgHigh = fbg ? Number(fbg.value_numeric) >= 140 : false;
      const hasCritical = !!criticalByPt[p.id];
      const level = deriveRiskLevel(hasCritical, adhPct, bpHigh, fbgHigh);

      const trend = (bpByPt[p.id] || []).slice(0, 6).reverse().map((v: any) => Number(v.value_systolic));

      const lastTouchTimes = [
        p.telegram_linked_at,
        bp?.recorded_at,
        fbg?.recorded_at,
        lastRiskByPt[p.id]
      ].filter(Boolean).map((s: string) => new Date(s).getTime());
      const lastTouchIso = lastTouchTimes.length ? new Date(Math.max(...lastTouchTimes)).toISOString() : null;

      return {
        id: p.id,
        full_name: p.full_name,
        first_name: (p.full_name || '').split(/\s+/)[0] || p.full_name || '',
        age: ageFromDob(p.dob),
        sex: p.sex,
        preferred_language: langCode,
        preferred_language_label: LANG_LABEL[langCode] || 'English',
        conditions: dxByPt[p.id] || [],
        conditions_short: (dxByPt[p.id] || []).join(' + ') || '—',
        telegram_linked: Boolean(p.telegram_chat_id),
        last_contact: { iso: lastTouchIso, label: relativeLabel(lastTouchIso) },
        risk: { level },
        vitals: {
          latest_bp: bp ? {
            systolic: Number(bp.value_systolic),
            diastolic: Number(bp.value_diastolic),
            out_of_range: bpHigh
          } : null,
          latest_fbg: fbg ? {
            value: Number(fbg.value_numeric),
            out_of_range: fbgHigh
          } : null
        },
        adherence_pct_7d: adhPct,
        interventions_pending: intPendingByPt[p.id] || 0,
        trend
      };
    });

    const stats = {
      total: enriched.length,
      high_risk: enriched.filter(p => p.risk.level === 'critical' || p.risk.level === 'elevated').length,
      interventions_pending: enriched.reduce((sum, p) => sum + p.interventions_pending, 0),
      telegram_linked: enriched.filter(p => p.telegram_linked).length
    };

    const RISK_RANK: Record<RiskLevel, number> = { critical: 0, elevated: 1, watch: 2, stable: 3 };
    enriched.sort((a, b) => {
      const r = RISK_RANK[a.risk.level] - RISK_RANK[b.risk.level];
      if (r !== 0) return r;
      const aIso = a.last_contact.iso ? new Date(a.last_contact.iso).getTime() : 0;
      const bIso = b.last_contact.iso ? new Date(b.last_contact.iso).getTime() : 0;
      return bIso - aIso;
    });

    res.status(200).json({
      stats,
      patients: enriched,
      generated_at: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('patients-roster error', err);
    res.status(500).json({ error: 'internal_error', detail: err?.message || String(err) });
  }
}
