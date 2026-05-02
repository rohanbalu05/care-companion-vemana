import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { classifyImage } from '../lib/imageClassifier';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const LLM_MODEL_FAST = process.env.LLM_MODEL_FAST || 'anthropic/claude-haiku-4.5';
const LLM_MODEL_SMART = process.env.LLM_MODEL_SMART || 'anthropic/claude-sonnet-4';
const DEMO_PATIENT_NAME = process.env.DEMO_PATIENT_NAME || 'Asha Sharma';
const TG_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const TG_FILE_BASE = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

type Lang = 'en' | 'hi' | 'kn';

const staticMessages = {
  welcome: (name: string, lang: Lang) => ({
    hi: `नमस्ते ${name} जी! 🙏 मैं Saathi हूँ — आपकी देखभाल में आपका साथी।\nआज से, आप यहाँ अपनी BP, शुगर, दवाइयाँ और लक्षण साझा कर सकती हैं। Dr. Priya Mehta को सब अपडेट मिलेंगे।\nशुरू करने के लिए /help लिखें।`,
    kn: `ನಮಸ್ಕಾರ ${name}! 🙏 ನಾನು Saathi — ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಂಗಾತಿ.\nಇಂದಿನಿಂದ, ನೀವು ನಿಮ್ಮ BP, ಸಕ್ಕರೆ, ಔಷಧಗಳು ಮತ್ತು ಲಕ್ಷಣಗಳನ್ನು ಇಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಬಹುದು.\n/help ಎಂದು ಬರೆಯಿರಿ.`,
    en: `Namaste ${name}! 🙏 I am Saathi — your care companion.\nFrom today, you can share your BP, sugar, medicines, and symptoms here. Dr. Priya Mehta will get all updates.\nType /help to begin.`
  }[lang]),
  fallbackAck: (name: string, lang: Lang) => ({
    hi: `मिल गया, ${name}। मैंने नोट कर लिया है, डॉक्टर को बता दूँगा। 🙏`,
    kn: `ಸಿಕ್ಕಿತು, ${name}. ನಾನು ದಾಖಲಿಸಿದ್ದೇನೆ, ಡಾಕ್ಟರ್‌ಗೆ ತಿಳಿಸುತ್ತೇನೆ. 🙏`,
    en: `Got it, ${name}. I've noted this and will keep your doctor posted. 🙏`
  }[lang]),
  prescriptionConfirm: (count: number, drugList: string, lang: Lang, lowConfidence: boolean) => {
    const base = {
      hi: `मैंने आपके नुस्ख़े से ${count} दवा${count === 1 ? '' : 'इयाँ'} दर्ज की:\n${drugList}\nसमय पर याद दिलाती रहूँगी। Dr. Priya Mehta को सूचित कर दिया गया है ✅`,
      kn: `ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಶನ್‌ನಿಂದ ${count} ಔಷಧ${count === 1 ? '' : 'ಗಳನ್ನು'} ದಾಖಲಿಸಿದ್ದೇನೆ:\n${drugList}\nಸರಿಯಾದ ಸಮಯಕ್ಕೆ ನೆನಪಿಸುತ್ತೇನೆ. Dr. Priya Mehta ಗೆ ತಿಳಿಸಲಾಗಿದೆ ✅`,
      en: `I've recorded ${count} medicine${count === 1 ? '' : 's'} from your prescription:\n${drugList}\nI'll remind you at the right times. Dr. Priya Mehta has been notified ✅`
    }[lang];
    if (!lowConfidence) return base;
    const tail = {
      hi: `\nकृपया डॉक्टर से ये जानकारी एक बार पुष्टि कर लें।`,
      kn: `\nದಯವಿಟ್ಟು ಈ ವಿವರಗಳನ್ನು ನಿಮ್ಮ ಡಾಕ್ಟರ್ ಬಳಿ ಒಮ್ಮೆ ಖಚಿತಪಡಿಸಿ.`,
      en: `\nPlease confirm these details with your doctor.`
    }[lang];
    return base + tail;
  },
  notAPrescription: (lang: Lang) => ({
    hi: `यह नुस्ख़े जैसा नहीं लग रहा। कृपया अपने प्रिंटेड प्रेसक्रिप्शन की साफ़ तस्वीर भेजें।`,
    kn: `ಇದು ಪ್ರಿಸ್ಕ್ರಿಪ್ಶನ್‌ನಂತೆ ತೋರುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮುದ್ರಿತ ಪ್ರಿಸ್ಕ್ರಿಪ್ಶನ್‌ನ ಸ್ಪಷ್ಟ ಫೋಟೋ ಕಳುಹಿಸಿ.`,
    en: `This doesn't look like a prescription. Please send a clear photo of your printed prescription.`
  }[lang]),
  handwrittenGuard: (lang: Lang) => ({
    hi: `मैं अभी सिर्फ़ प्रिंटेड प्रेसक्रिप्शन पढ़ सकती हूँ। कृपया दवाइयों के नाम टाइप कर दें, या डॉक्टर से प्रिंटेड कॉपी माँगें।`,
    kn: `ನಾನು ಸದ್ಯಕ್ಕೆ ಮುದ್ರಿತ ಪ್ರಿಸ್ಕ್ರಿಪ್ಶನ್‌ಗಳನ್ನು ಮಾತ್ರ ಓದಬಲ್ಲೆ. ದಯವಿಟ್ಟು ಔಷಧಿಗಳ ಹೆಸರುಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ, ಅಥವಾ ಡಾಕ್ಟರ್‌ನಿಂದ ಮುದ್ರಿತ ಪ್ರತಿಯನ್ನು ಕೇಳಿ.`,
    en: `I can only read printed prescriptions right now. Please type the medicine names, or ask your doctor for a printed copy.`
  }[lang]),
  ocrRetry: (lang: Lang) => ({
    hi: `नुस्ख़ा साफ़ नहीं पढ़ पाई। कृपया एक साफ़ तस्वीर भेजें, या दवाइयों के नाम टाइप कर दें।`,
    kn: `ಪ್ರಿಸ್ಕ್ರಿಪ್ಶನ್ ಸ್ಪಷ್ಟವಾಗಿ ಓದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾದ ಫೋಟೋ ಕಳುಹಿಸಿ, ಅಥವಾ ಔಷಧಿಗಳ ಹೆಸರುಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ.`,
    en: `Couldn't read this clearly — could you send a clearer photo, or type the medicine names?`
  }[lang]),
  bpRecorded: (sys: number, dia: number, pulse: number | null, lang: Lang, high: boolean, doc: string) => {
    const pulseTxt = pulse != null ? `, pulse ${pulse}` : '';
    if (high) {
      return ({
        hi: `मैंने आपका BP दर्ज किया: ${sys}/${dia}${pulseTxt}. ✅ यह रीडिंग ज़्यादा है — ${doc} को सूचित कर दिया जाएगा।`,
        kn: `ನಿಮ್ಮ BP ದಾಖಲಿಸಿದ್ದೇನೆ: ${sys}/${dia}${pulseTxt}. ✅ ಈ ರೀಡಿಂಗ್ ಹೆಚ್ಚಿದೆ — ${doc} ಗೆ ತಿಳಿಸಲಾಗುತ್ತದೆ.`,
        en: `I've recorded your BP: ${sys}/${dia}${pulseTxt}. ✅ This reading is high — ${doc} will be alerted.`
      } as const)[lang];
    }
    return ({
      hi: `मैंने आपका BP दर्ज किया: ${sys}/${dia}${pulseTxt}. ✅`,
      kn: `ನಿಮ್ಮ BP ದಾಖಲಿಸಿದ್ದೇನೆ: ${sys}/${dia}${pulseTxt}. ✅`,
      en: `I've recorded your BP: ${sys}/${dia}${pulseTxt}. ✅`
    } as const)[lang];
  },
  bpUnreadable: (lang: Lang) => ({
    hi: `BP की रीडिंग साफ़ नहीं दिख रही। कृपया दोबारा फोटो भेजें — पूरी स्क्रीन के नंबर साफ़ दिखें।`,
    kn: `BP ರೀಡಿಂಗ್ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಫೋಟೋ ಕಳುಹಿಸಿ — ಪರದೆಯ ಎಲ್ಲಾ ಸಂಖ್ಯೆಗಳು ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣಬೇಕು.`,
    en: `Couldn't read your BP clearly — please retake the photo with the numbers fully visible.`
  }[lang]),
  glucoseRecordedAskMeal: (val: number, lang: Lang) => ({
    hi: `मैंने आपकी शुगर दर्ज की: ${val} mg/dL. क्या यह खाने से पहले (fasting) थी या खाने के बाद (post-meal)? कृपया जवाब दें।`,
    kn: `ನಿಮ್ಮ ಸಕ್ಕರೆ ಮಟ್ಟ ದಾಖಲಿಸಿದ್ದೇನೆ: ${val} mg/dL. ಇದು ಊಟಕ್ಕೆ ಮೊದಲು (fasting) ಆಗಿತ್ತೋ ಅಥವಾ ಊಟದ ನಂತರ (post-meal) ಆಗಿತ್ತೋ?`,
    en: `I've recorded your glucose: ${val} mg/dL. Was this before food (fasting) or after food (post-meal)?`
  }[lang]),
  glucoseUpdatedFasting: (val: number, lang: Lang) => ({
    hi: `धन्यवाद — मैंने इसे fasting शुगर के रूप में दर्ज कर लिया (${val} mg/dL). ✅`,
    kn: `ಧನ್ಯವಾದಗಳು — ನಾನು ಇದನ್ನು fasting ಸಕ್ಕರೆಯಾಗಿ ದಾಖಲಿಸಿದ್ದೇನೆ (${val} mg/dL). ✅`,
    en: `Thanks — recorded as fasting glucose (${val} mg/dL). ✅`
  }[lang]),
  glucoseUpdatedPostprandial: (val: number, lang: Lang) => ({
    hi: `धन्यवाद — मैंने इसे post-meal शुगर के रूप में दर्ज कर लिया (${val} mg/dL). ✅`,
    kn: `ಧನ್ಯವಾದಗಳು — ನಾನು ಇದನ್ನು post-meal ಸಕ್ಕರೆಯಾಗಿ ದಾಖಲಿಸಿದ್ದೇನೆ (${val} mg/dL). ✅`,
    en: `Thanks — recorded as post-meal glucose (${val} mg/dL). ✅`
  }[lang]),
  glucoseUnreadable: (lang: Lang) => ({
    hi: `शुगर की रीडिंग साफ़ नहीं दिख रही। कृपया दोबारा फोटो भेजें।`,
    kn: `ಸಕ್ಕರೆ ರೀಡಿಂಗ್ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಫೋಟೋ ಕಳುಹಿಸಿ.`,
    en: `Couldn't read your glucose reading clearly — please retake the photo.`
  }[lang]),
  photoUnclear: (lang: Lang) => ({
    hi: `तस्वीर साफ़ नहीं है। कृपया अच्छी रोशनी में दोबारा भेजें।`,
    kn: `ಫೋಟೋ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಉತ್ತಮ ಬೆಳಕಿನಲ್ಲಿ ಮತ್ತೊಮ್ಮೆ ಕಳುಹಿಸಿ.`,
    en: `I can see you're trying to share something, but the photo isn't clear enough. Could you retake it with better lighting?`
  }[lang]),
  photoOther: (subject: string, lang: Lang) => ({
    hi: `मैं अभी सिर्फ़ नुस्ख़े, BP मॉनिटर रीडिंग, और ग्लुकोमीटर रीडिंग की तस्वीरें पढ़ सकती हूँ। यह ${subject} जैसा लग रहा है — कृपया उन तीनों में से कुछ भेजें।`,
    kn: `ನಾನು ಸದ್ಯಕ್ಕೆ ಪ್ರಿಸ್ಕ್ರಿಪ್ಶನ್, BP ಮಾನಿಟರ್, ಮತ್ತು ಗ್ಲುಕೋಮೀಟರ್ ಫೋಟೋಗಳನ್ನು ಮಾತ್ರ ಓದಬಲ್ಲೆ. ಇದು ${subject} ರೀತಿ ಕಾಣುತ್ತಿದೆ — ದಯವಿಟ್ಟು ಆ ಮೂರರಲ್ಲಿ ಒಂದನ್ನು ಕಳುಹಿಸಿ.`,
    en: `I can only process prescriptions, BP monitor readings, and glucometer readings right now. This looks like a ${subject} — please send one of those instead.`
  }[lang]),
  invalid: `This link looks expired or already used. Please contact your clinic for a fresh link. 🙏`,
  hint: `Hello! 👋 To begin, please open the secure link your clinic shared with you. If you don't have it, please contact your clinic.`
};

async function sendTelegramText(chatId: number | string, text: string) {
  const res = await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!res.ok) console.error('Telegram send failed', res.status, await res.text());
}

async function getTelegramFileBuffer(fileId: string): Promise<{ buffer: Buffer; mime: string; fileName: string }> {
  const metaRes = await fetch(`${TG_API}/getFile?file_id=${encodeURIComponent(fileId)}`);
  if (!metaRes.ok) throw new Error(`getFile failed ${metaRes.status}`);
  const meta: any = await metaRes.json();
  const filePath: string = meta?.result?.file_path;
  if (!filePath) throw new Error('getFile returned no file_path');
  const dl = await fetch(`${TG_FILE_BASE}/${filePath}`);
  if (!dl.ok) throw new Error(`download failed ${dl.status}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  const ext = filePath.split('.').pop() || 'bin';
  const mime = ext === 'oga' || ext === 'ogg' ? 'audio/ogg'
    : ext === 'mp3' ? 'audio/mpeg'
    : ext === 'm4a' ? 'audio/mp4'
    : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : 'application/octet-stream';
  return { buffer: buf, mime, fileName: filePath.split('/').pop() || 'file' };
}

type LinkedPatient = {
  id: string;
  full_name: string;
  preferred_language: Lang;
  telegram_chat_id: string;
};

type LlmOutput = {
  detected_language: Lang;
  language_switch_request: Lang | null;
  intent: 'vitals_log' | 'symptom_log' | 'medication_query' | 'greeting' | 'distress' | 'smalltalk' | 'unknown';
  vitals: Array<{
    kind: 'bp' | 'fbg' | 'ppbg' | 'weight' | 'spo2';
    value_systolic: number | null;
    value_diastolic: number | null;
    value_numeric: number | null;
    unit: string;
  }>;
  symptoms: Array<{ name: string; severity: 'mild' | 'moderate' | 'severe' }>;
  distress_signal: boolean;
  reply_text: string;
};

type OcrMedication = {
  name: string;
  dose: string;
  frequency: string;
  duration: string | null;
  instructions: string | null;
};

type OcrOutput = {
  doctor_name: string | null;
  clinic_name: string | null;
  prescription_date: string | null;
  medications: OcrMedication[];
  is_handwritten: boolean;
  confidence: 'high' | 'medium' | 'low';
};

async function buildPatientContext(patientId: string) {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

  const [pRes, dxRes, medsRes, vitalsRes, adhRes] = await Promise.all([
    supabase.from('patients').select('full_name, dob, preferred_language, last_detected_language, allergies').eq('id', patientId).single(),
    supabase.from('diagnoses').select('condition, diagnosed_on').eq('patient_id', patientId),
    supabase.from('medications').select('drug_name, dose_amount, dose_unit, frequency').eq('patient_id', patientId).eq('status', 'active'),
    supabase.from('vitals').select('vital_type, value_systolic, value_diastolic, value_numeric, unit, recorded_at')
      .eq('patient_id', patientId).gte('recorded_at', threeDaysAgo).order('recorded_at', { ascending: false }).limit(10),
    supabase.from('adherence_events').select('status')
      .eq('patient_id', patientId).gte('scheduled_at', startOfToday.toISOString()).lte('scheduled_at', endOfToday.toISOString())
  ]);

  const p = pRes.data;
  const age = p?.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
  const adh = (adhRes.data || []).reduce((acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + 1; return acc;
  }, {});

  return {
    name: p?.full_name ?? null,
    age,
    preferred_language: p?.preferred_language ?? 'en',
    last_detected_language: p?.last_detected_language ?? null,
    allergies: p?.allergies ?? [],
    diagnoses: (dxRes.data || []).map((d: any) => ({ condition: d.condition, since: d.diagnosed_on })),
    active_medications: (medsRes.data || []).map((m: any) => ({
      drug: m.drug_name,
      dose: m.dose_amount && m.dose_unit ? `${m.dose_amount}${m.dose_unit}` : null,
      frequency: m.frequency
    })),
    recent_vitals_3d: vitalsRes.data || [],
    adherence_today: { taken: adh.taken || 0, missed: adh.missed || 0, pending: adh.pending || 0 }
  };
}

const SYSTEM_PROMPT_TEMPLATE = (ctxJson: string) => `You are Saathi, a warm chronic-care companion for Indian patients on Telegram.
You support English, Hindi (Devanagari), and Kannada. You never invent clinical
facts; you only react to what the patient writes and the context provided.

Patient context:
${ctxJson}

Return ONLY valid JSON with this exact shape:
{
  "detected_language": "en" | "hi" | "kn",
  "language_switch_request": "en" | "hi" | "kn" | null,
  "intent": "vitals_log" | "symptom_log" | "medication_query" | "greeting" | "distress" | "smalltalk" | "unknown",
  "vitals": [ { "kind": "bp"|"fbg"|"ppbg"|"weight"|"spo2", "value_systolic": number|null, "value_diastolic": number|null, "value_numeric": number|null, "unit": string } ],
  "symptoms": [ { "name": string, "severity": "mild"|"moderate"|"severe" } ],
  "distress_signal": boolean,
  "reply_text": string
}

Rules for reply_text:
- Reply language priority: language_switch_request > patient.preferred_language > detected_language
- Warm but brief (1-3 sentences). One emoji max. Address patient by first name.
- If vitals logged: confirm receipt, mention threshold context only if it
  exceeds locked rules (BP ≥140/90, FBG ≥140, PPBG ≥200). Never diagnose.
- If distress_signal=true: empathetic ack + reassure that the doctor will be informed.
  Do not offer medical advice.
- If language_switch_request is set: acknowledge the switch in the new language.

Follow-up question directive:
After acknowledging what the patient logged, ask EXACTLY ONE short follow-up
question that helps you understand context. The question must be relevant to
what they just shared. Examples:
- User logs BP 145/92 → "Got it, 145/92. Slightly above your usual. Did you take your amlodipine this morning?"
- User says "feeling tired" → "Sorry to hear. Has it been all day, or just since waking?"
- User logs FBG 168 → "Logged 168 mg/dL. Was this before breakfast, or after eating?"
- User sends prescription photo → after meds extracted: "Got it. Should I remind you for the morning dose?"

Rules for the follow-up:
- ONE question max, in the same language as the patient just used.
- Conversational, never clinical-sounding.
- If the patient's last message already answered everything (e.g. "yes I took it"),
  skip the question and just acknowledge warmly.
- Keep total reply within 1-3 sentences including the question.`;

async function callOpenRouter(ctx: object, userText: string): Promise<LlmOutput> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://care-companion-vemana.vercel.app',
      'X-Title': 'Care Companion Saathi'
    },
    body: JSON.stringify({
      model: LLM_MODEL_FAST,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_TEMPLATE(JSON.stringify(ctx, null, 2)) },
        { role: 'user', content: userText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const json: any = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned empty content');
  return JSON.parse(content) as LlmOutput;
}

const OCR_SYSTEM_PROMPT = `You are a prescription parser for Indian printed prescriptions.
Extract printed prescription content. Return ONLY valid JSON:
{
  "doctor_name": string|null,
  "clinic_name": string|null,
  "prescription_date": "YYYY-MM-DD"|null,
  "medications": [
    {
      "name": string,
      "dose": string,
      "frequency": string,
      "duration": string|null,
      "instructions": string|null
    }
  ],
  "is_handwritten": boolean,
  "confidence": "high"|"medium"|"low"
}
Extract ONLY what is clearly visible in the image. Never invent drug names or doses.
If is_handwritten is true OR confidence is low, still return what you can but flag it.
If the image is not a prescription at all, return medications: [] with confidence: "low".`;

function stripJsonFences(s: string): string {
  return s.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

async function callOcrVision(imageDataUrl: string): Promise<OcrOutput> {
  const requestBody = {
    model: LLM_MODEL_SMART,
    messages: [
      { role: 'system', content: OCR_SYSTEM_PROMPT },
      { role: 'user', content: [
        { type: 'image_url', image_url: { url: imageDataUrl } },
        { type: 'text', text: 'Extract medications from this prescription.' }
      ] }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1
  };
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://care-companion-vemana.vercel.app',
      'X-Title': 'Care Companion Saathi'
    },
    body: JSON.stringify(requestBody)
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error('OCR vision HTTP', res.status, 'model=', LLM_MODEL_SMART, 'body=', txt.slice(0, 500));
    throw new Error(`OCR vision ${res.status}`);
  }
  const json: any = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OCR vision empty content');
  const cleaned = stripJsonFences(content);
  try {
    return JSON.parse(cleaned) as OcrOutput;
  } catch (e) {
    console.error('OCR JSON parse failed; raw content head:', cleaned.slice(0, 400));
    throw e;
  }
}

const FREQ_PATTERNS: Array<[RegExp, 'OD' | 'BD' | 'TDS' | 'QID' | 'SOS' | 'HS']> = [
  [/\b(?:od|qd|once[\s-]*daily|once[\s-]*a[\s-]*day|1[\s-]*-?[\s-]*0[\s-]*-?[\s-]*0|morning)\b/i, 'OD'],
  [/\b(?:bd|bid|twice[\s-]*daily|twice[\s-]*a[\s-]*day|two[\s-]*times|1[\s-]*-?[\s-]*0[\s-]*-?[\s-]*1)\b/i, 'BD'],
  [/\b(?:tds|tid|thrice[\s-]*daily|three[\s-]*times|1[\s-]*-?[\s-]*1[\s-]*-?[\s-]*1)\b/i, 'TDS'],
  [/\b(?:qid|four[\s-]*times)\b/i, 'QID'],
  [/\b(?:sos|prn|as[\s-]*needed|when[\s-]*needed)\b/i, 'SOS'],
  [/\b(?:hs|at[\s-]*bedtime|before[\s-]*bed|at[\s-]*night|night)\b/i, 'HS']
];

function mapFrequency(s: string | null | undefined): 'OD' | 'BD' | 'TDS' | 'QID' | 'SOS' | 'HS' | null {
  if (!s) return null;
  for (const [re, code] of FREQ_PATTERNS) if (re.test(s)) return code;
  return null;
}

function parseDose(s: string | null | undefined): { amount: number | null; unit: 'mg' | 'g' | 'ml' | 'unit' | null } {
  if (!s) return { amount: null, unit: null };
  const m = s.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|units?|iu)/i);
  if (!m) return { amount: null, unit: null };
  const u = m[2].toLowerCase();
  const unit = u === 'mcg' ? 'mg' : u === 'units' || u === 'unit' || u === 'iu' ? 'unit' : (u as 'mg' | 'g' | 'ml');
  const amount = u === 'mcg' ? parseFloat(m[1]) / 1000 : parseFloat(m[1]);
  return { amount, unit };
}

const TEMPLATE_PLACEHOLDER_RE = /\b(?:demo|sample|placeholder|medicine\s*\d|drug\s*\d|xxx+|name\s+of\s+medicine|generic\s+name|brand\s+name)\b/i;

function looksLikePlaceholderDrug(name: string | null | undefined): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (trimmed.length < 2) return true;
  if (TEMPLATE_PLACEHOLDER_RE.test(trimmed)) return true;
  if (/^(?:medicine|drug|tablet|tab)\s*\d+$/i.test(trimmed)) return true;
  return false;
}

type BpExtraction = {
  bp_systolic: number | null;
  bp_diastolic: number | null;
  pulse: number | null;
  reading_visible: boolean;
  confidence: 'high' | 'medium' | 'low';
};

const BP_VISION_PROMPT = `You are reading a digital blood pressure monitor display. Extract the values shown. Output ONLY valid JSON:
{
  "bp_systolic": number|null,
  "bp_diastolic": number|null,
  "pulse": number|null,
  "reading_visible": boolean,
  "confidence": "high"|"medium"|"low"
}
The systolic value (SYS) is the larger top number. The diastolic value (DIA) is the middle number. Pulse (PULSE/min) is usually at the bottom. If any value is unreadable, set it to null. If the display is off or no reading is visible, set reading_visible to false.`;

async function callBpVision(imageDataUrl: string): Promise<BpExtraction> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://care-companion-vemana.vercel.app',
      'X-Title': 'Care Companion BP OCR'
    },
    body: JSON.stringify({
      model: LLM_MODEL_SMART,
      messages: [
        { role: 'system', content: BP_VISION_PROMPT },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: imageDataUrl } },
          { type: 'text', text: 'Extract the BP reading from this monitor display.' }
        ] }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });
  if (!res.ok) {
    console.error('BP vision HTTP', res.status, (await res.text()).slice(0, 400));
    throw new Error(`BP vision ${res.status}`);
  }
  const j: any = await res.json();
  const content: string | undefined = j?.choices?.[0]?.message?.content;
  if (!content) throw new Error('BP vision empty content');
  return JSON.parse(stripJsonFences(content)) as BpExtraction;
}

type GlucoseExtraction = {
  glucose_value: number | null;
  unit: 'mg/dL' | 'mmol/L' | null;
  reading_time: 'fasting' | 'post_meal' | 'random' | null;
  reading_visible: boolean;
  confidence: 'high' | 'medium' | 'low';
};

const GLUCOSE_VISION_PROMPT = `You are reading a handheld blood glucose meter display. Extract the reading. Output ONLY valid JSON:
{
  "glucose_value": number|null,
  "unit": "mg/dL"|"mmol/L"|null,
  "reading_time": "fasting"|"post_meal"|"random"|null,
  "reading_visible": boolean,
  "confidence": "high"|"medium"|"low"
}
Most Indian glucometers show mg/dL. If the display shows mmol/L, convert to mg/dL by multiplying by 18 and set unit to "mg/dL" with the converted value. If meal context (fasting/post-meal) is visible on the display, capture it; otherwise leave reading_time as null.`;

async function callGlucoseVision(imageDataUrl: string): Promise<GlucoseExtraction> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://care-companion-vemana.vercel.app',
      'X-Title': 'Care Companion Glucose OCR'
    },
    body: JSON.stringify({
      model: LLM_MODEL_SMART,
      messages: [
        { role: 'system', content: GLUCOSE_VISION_PROMPT },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: imageDataUrl } },
          { type: 'text', text: 'Extract the glucose reading from this meter display.' }
        ] }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });
  if (!res.ok) {
    console.error('Glucose vision HTTP', res.status, (await res.text()).slice(0, 400));
    throw new Error(`Glucose vision ${res.status}`);
  }
  const j: any = await res.json();
  const content: string | undefined = j?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Glucose vision empty content');
  return JSON.parse(stripJsonFences(content)) as GlucoseExtraction;
}

async function transcribeWhisper(buffer: Buffer, fileName: string, mime: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', new Blob([buffer], { type: mime }), fileName.endsWith('.ogg') ? fileName : `${fileName}.ogg`);
  fd.append('model', 'whisper-1');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: fd
  });
  if (!res.ok) throw new Error(`Whisper ${res.status}: ${await res.text()}`);
  const json: any = await res.json();
  return (json?.text || '').trim();
}

function fireAndForgetRiskEval(patientId: string) {
  const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://care-companion-vemana.vercel.app';
  fetch(`${host}/api/evaluate-risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id: patientId })
  }).catch(err => console.error('risk eval trigger failed', err instanceof Error ? err.message : err));
}

async function persistExtractions(
  patient: LinkedPatient,
  rawText: string,
  telegramMessageId: number,
  llm: LlmOutput
) {
  const now = new Date().toISOString();

  for (const v of llm.vitals || []) {
    const { error: vErr } = await supabase.from('vitals').insert({
      patient_id: patient.id,
      vital_type: v.kind,
      value_systolic: v.value_systolic,
      value_diastolic: v.value_diastolic,
      value_numeric: v.value_numeric,
      unit: v.unit,
      source: 'telegram_text',
      recorded_at: now
    });
    if (vErr) console.error('vitals insert failed', { code: vErr.code, message: vErr.message, details: vErr.details, hint: vErr.hint, payload: v });
  }

  for (const s of llm.symptoms || []) {
    const { error: sErr } = await supabase.from('symptoms').insert({
      patient_id: patient.id,
      symptom_text_raw: rawText,
      symptom_text_normalized: s.name,
      language_detected: llm.detected_language,
      severity: s.severity,
      source: 'telegram_text',
      recorded_at: now
    });
    if (sErr) console.error('symptoms insert failed', { code: sErr.code, message: sErr.message, details: sErr.details });
  }

  if (llm.language_switch_request) {
    try {
      await supabase.from('patients')
        .update({ preferred_language: llm.language_switch_request, last_detected_language: llm.detected_language })
        .eq('id', patient.id);
    } catch (e) { console.error('language switch update failed', e); }
  } else if (llm.detected_language) {
    try {
      await supabase.from('patients')
        .update({ last_detected_language: llm.detected_language })
        .eq('id', patient.id);
    } catch (e) { console.error('detected lang update failed', e); }
  }

  if (llm.distress_signal) {
    try {
      await supabase.from('risk_events').insert({
        patient_id: patient.id,
        event_type: 'symptom_cluster',
        severity: 'medium',
        score_delta: 0,
        rule_fired: 'telegram_distress_signal',
        data_point_refs: { telegram_message_id: telegramMessageId, raw_text: rawText },
        llm_reasoning_trace: llm,
        detected_at: now
      });
    } catch (e) { console.error('risk_events insert failed', e); }
  }
}

async function handleLinkedTextMessage(patient: LinkedPatient, msg: any, sourceLabel: string) {
  const rawText: string = (msg.text || '').trim();
  const telegramMessageId: number = msg.message_id;
  if (rawText.length > 0 && rawText.length < 80) {
    const resolved = await maybeResolveGlucoseMealContext(patient, rawText);
    if (resolved) return;
  }
  try {
    const ctx = await buildPatientContext(patient.id);
    const llm = await callOpenRouter(ctx, rawText);
    await persistExtractions(patient, rawText, telegramMessageId, llm);
    await sendTelegramText(patient.telegram_chat_id, llm.reply_text);
    fireAndForgetRiskEval(patient.id);
  } catch (err) {
    console.error(`LLM brain failure (${sourceLabel})`, { text: rawText, error: String(err) });
    await sendTelegramText(
      patient.telegram_chat_id,
      staticMessages.fallbackAck(patient.full_name, patient.preferred_language)
    );
  }
}

async function handleVoiceMessage(patient: LinkedPatient, msg: any) {
  const fileId = msg.voice?.file_id || msg.audio?.file_id;
  if (!fileId) return;
  try {
    const { buffer, mime, fileName } = await getTelegramFileBuffer(fileId);
    const transcript = await transcribeWhisper(buffer, fileName, mime);
    if (!transcript) {
      await sendTelegramText(patient.telegram_chat_id, staticMessages.fallbackAck(patient.full_name, patient.preferred_language));
      return;
    }
    const ctx = await buildPatientContext(patient.id);
    const llm = await callOpenRouter(ctx, transcript);
    await persistExtractions(patient, transcript, msg.message_id, llm);
    await sendTelegramText(patient.telegram_chat_id, `🎙️ I heard: "${transcript}"\n\n${llm.reply_text}`);
    fireAndForgetRiskEval(patient.id);
  } catch (err) {
    console.error('Voice handler failure', err);
    await sendTelegramText(patient.telegram_chat_id, staticMessages.fallbackAck(patient.full_name, patient.preferred_language));
  }
}

async function extractPrescription(patient: LinkedPatient, dataUrl: string) {
  const lang = (patient.preferred_language || 'en') as Lang;
  let ocr: OcrOutput;
  try {
    ocr = await callOcrVision(dataUrl);
  } catch (err) {
    console.error('Prescription OCR failure', err);
    await sendTelegramText(patient.telegram_chat_id, staticMessages.ocrRetry(lang));
    return;
  }

  if (ocr.is_handwritten === true) {
    await sendTelegramText(patient.telegram_chat_id, staticMessages.handwrittenGuard(lang));
    return;
  }

  const realMeds = (Array.isArray(ocr.medications) ? ocr.medications : []).filter(m => !looksLikePlaceholderDrug(m?.name));
  const placeholderCount = (ocr.medications?.length || 0) - realMeds.length;
  if (placeholderCount > 0 && realMeds.length === 0) {
    console.log('prescription rejected as template/placeholder', { placeholderCount, totalSeen: ocr.medications?.length || 0 });
    await sendTelegramText(patient.telegram_chat_id, staticMessages.ocrRetry(lang));
    return;
  }
  if (realMeds.length === 0) {
    await sendTelegramText(patient.telegram_chat_id, staticMessages.notAPrescription(lang));
    return;
  }

  let prescriptionId: string | null = null;
  try {
    const presRes = await supabase.from('prescriptions').insert({
      patient_id: patient.id,
      parsed_medications: { ...ocr, medications: realMeds },
      status: 'pending_review',
      notes: [
        ocr.confidence ? `ocr_confidence=${ocr.confidence}` : null,
        ocr.doctor_name ? `doctor=${ocr.doctor_name}` : null,
        ocr.clinic_name ? `clinic=${ocr.clinic_name}` : null,
        placeholderCount > 0 ? `placeholders_filtered=${placeholderCount}` : null
      ].filter(Boolean).join(' | ') || null
    }).select('id').single();
    prescriptionId = presRes.data?.id ?? null;
  } catch (e) { console.error('prescriptions insert failed', e); }

  const drugLines: string[] = [];
  for (const m of realMeds) {
    const { amount, unit } = parseDose(m.dose);
    const freqCode = mapFrequency(m.frequency);
    try {
      await supabase.from('medications').insert({
        patient_id: patient.id,
        drug_name: m.name,
        dose_amount: amount,
        dose_unit: unit,
        frequency: freqCode,
        instructions: [m.instructions, m.duration ? `duration:${m.duration}` : null,
          !freqCode && m.frequency ? `frequency:${m.frequency}` : null].filter(Boolean).join(' | ') || null,
        status: 'pending_confirmation',
        prescription_id: prescriptionId,
        prescribed_on: ocr.prescription_date || new Date().toISOString().slice(0, 10)
      });
    } catch (e) { console.error('medication insert failed', e, { drug: m.name }); }
    const dosePart = m.dose ? ` ${m.dose}` : '';
    const freqPart = m.frequency ? ` ${m.frequency}` : '';
    drugLines.push(`• ${m.name}${dosePart}${freqPart}`);
  }

  await sendTelegramText(
    patient.telegram_chat_id,
    staticMessages.prescriptionConfirm(realMeds.length, drugLines.join('\n'), lang, ocr.confidence === 'low')
  );
  fireAndForgetRiskEval(patient.id);
}

async function extractBP(patient: LinkedPatient, dataUrl: string) {
  const lang = (patient.preferred_language || 'en') as Lang;
  let bp: BpExtraction;
  try {
    bp = await callBpVision(dataUrl);
  } catch (err) {
    console.error('BP vision failure', err);
    await sendTelegramText(patient.telegram_chat_id, staticMessages.bpUnreadable(lang));
    return;
  }

  const sys = bp.bp_systolic;
  const dia = bp.bp_diastolic;
  const pulse = bp.pulse;
  const validSys = typeof sys === 'number' && sys >= 60 && sys <= 260 ? sys : null;
  const validDia = typeof dia === 'number' && dia >= 30 && dia <= 180 ? dia : null;
  const validPulse = typeof pulse === 'number' && pulse >= 30 && pulse <= 200 ? pulse : null;

  if (!bp.reading_visible || validSys == null || validDia == null) {
    await sendTelegramText(patient.telegram_chat_id, staticMessages.bpUnreadable(lang));
    return;
  }

  const now = new Date().toISOString();
  const { error: bpErr } = await supabase.from('vitals').insert({
    patient_id: patient.id,
    vital_type: 'bp',
    value_systolic: validSys,
    value_diastolic: validDia,
    unit: 'mmHg',
    source: 'photo',
    recorded_at: now
  });
  if (bpErr) console.error('BP vitals insert failed', { code: bpErr.code, message: bpErr.message, details: bpErr.details, sys: validSys, dia: validDia });

  if (validPulse != null) {
    const { error: hrErr } = await supabase.from('vitals').insert({
      patient_id: patient.id,
      vital_type: 'heart_rate',
      value_numeric: validPulse,
      unit: 'bpm',
      source: 'photo',
      recorded_at: now
    });
    if (hrErr) console.error('Pulse vitals insert failed', { code: hrErr.code, message: hrErr.message, details: hrErr.details, pulse: validPulse });
  }

  const high = validSys >= 140 || validDia >= 90;
  await sendTelegramText(
    patient.telegram_chat_id,
    staticMessages.bpRecorded(validSys, validDia, validPulse, lang, high, 'Dr. Priya Mehta')
  );
  fireAndForgetRiskEval(patient.id);
}

async function extractGlucose(patient: LinkedPatient, dataUrl: string) {
  const lang = (patient.preferred_language || 'en') as Lang;
  let g: GlucoseExtraction;
  try {
    g = await callGlucoseVision(dataUrl);
  } catch (err) {
    console.error('Glucose vision failure', err);
    await sendTelegramText(patient.telegram_chat_id, staticMessages.glucoseUnreadable(lang));
    return;
  }

  const value = g.glucose_value;
  if (!g.reading_visible || typeof value !== 'number' || value < 30 || value > 600) {
    await sendTelegramText(patient.telegram_chat_id, staticMessages.glucoseUnreadable(lang));
    return;
  }

  const vitalType = g.reading_time === 'fasting' ? 'glucose_fasting'
    : g.reading_time === 'post_meal' ? 'glucose_postprandial'
    : 'glucose_random';

  const { error: gErr } = await supabase.from('vitals').insert({
    patient_id: patient.id,
    vital_type: vitalType,
    value_numeric: value,
    unit: 'mg/dL',
    source: 'photo',
    recorded_at: new Date().toISOString()
  });
  if (gErr) console.error('Glucose vitals insert failed', { code: gErr.code, message: gErr.message, details: gErr.details, value, vitalType });

  if (vitalType === 'glucose_random') {
    await sendTelegramText(patient.telegram_chat_id, staticMessages.glucoseRecordedAskMeal(value, lang));
  } else {
    const fasting = vitalType === 'glucose_fasting';
    await sendTelegramText(
      patient.telegram_chat_id,
      fasting ? staticMessages.glucoseUpdatedFasting(value, lang) : staticMessages.glucoseUpdatedPostprandial(value, lang)
    );
  }
  fireAndForgetRiskEval(patient.id);
}

async function maybeResolveGlucoseMealContext(patient: LinkedPatient, rawText: string): Promise<boolean> {
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('vitals')
    .select('id, value_numeric, recorded_at')
    .eq('patient_id', patient.id)
    .eq('vital_type', 'glucose_random')
    .eq('source', 'photo')
    .gte('recorded_at', tenMinAgo)
    .order('recorded_at', { ascending: false })
    .limit(1);
  const row = (data || [])[0];
  if (!row) return false;

  const lower = rawText.toLowerCase().trim();
  const fastingHits = /\b(fasting|fast|empty\s*stomach|before\s*food|before\s*meal|upvas|khali\s*pet|bhojan\s*ke\s*pehle)\b/.test(lower);
  const postHits = /\b(post[\s-]*meal|after\s*food|after\s*eating|post[\s-]*prandial|khane\s*ke\s*baad|baad\s*mein|after\s*lunch|after\s*dinner|after\s*breakfast)\b/.test(lower);
  if (!fastingHits && !postHits) return false;
  const newType = fastingHits ? 'glucose_fasting' : 'glucose_postprandial';

  const lang = (patient.preferred_language || 'en') as Lang;
  try {
    await supabase.from('vitals').update({ vital_type: newType }).eq('id', row.id);
    await sendTelegramText(
      patient.telegram_chat_id,
      newType === 'glucose_fasting'
        ? staticMessages.glucoseUpdatedFasting(Number(row.value_numeric), lang)
        : staticMessages.glucoseUpdatedPostprandial(Number(row.value_numeric), lang)
    );
    fireAndForgetRiskEval(patient.id);
    return true;
  } catch (e) {
    console.error('glucose meal-context update failed', e);
    return false;
  }
}

async function handlePhotoMessage(patient: LinkedPatient, msg: any) {
  let fileId: string | null = null;
  let mimeHint = 'image/jpeg';
  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    fileId = msg.photo[msg.photo.length - 1].file_id;
  } else if (msg.document && typeof msg.document.mime_type === 'string' && msg.document.mime_type.startsWith('image/')) {
    fileId = msg.document.file_id;
    mimeHint = msg.document.mime_type;
  }
  if (!fileId) return;
  const lang = (patient.preferred_language || 'en') as Lang;

  let dataUrl: string;
  try {
    const { buffer, mime } = await getTelegramFileBuffer(fileId);
    const usedMime = mime.startsWith('image/') ? mime : mimeHint;
    dataUrl = `data:${usedMime};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error('photo download failure', err);
    await sendTelegramText(patient.telegram_chat_id, staticMessages.photoUnclear(lang));
    return;
  }

  const cls = await classifyImage(dataUrl);
  console.log('image classified', { type: cls.type, confidence: cls.confidence, subject: cls.detected_subject });

  switch (cls.type) {
    case 'prescription':
      await extractPrescription(patient, dataUrl);
      return;
    case 'bp_monitor':
      await extractBP(patient, dataUrl);
      return;
    case 'glucometer':
      await extractGlucose(patient, dataUrl);
      return;
    case 'unclear':
      await sendTelegramText(patient.telegram_chat_id, staticMessages.photoUnclear(lang));
      return;
    case 'other':
    default:
      await sendTelegramText(patient.telegram_chat_id, staticMessages.photoOther(cls.detected_subject || 'photo', lang));
      return;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(200).send('ok');

  try {
    const update = req.body || {};
    const msg = update.message;
    if (!msg) return res.status(200).send('no message');

    const chatId: number = msg.chat.id;
    const text: string = (msg.text || '').trim();
    const isStart = text === '/start' || text.startsWith('/start ');
    const startToken = isStart && text.includes(' ') ? text.split(/\s+/)[1] : null;

    if (startToken === 'demo') {
      const { data: claimed, error } = await supabase
        .from('patients')
        .update({
          telegram_chat_id: String(chatId),
          telegram_linked_at: new Date().toISOString()
        })
        .eq('full_name', DEMO_PATIENT_NAME)
        .select('full_name, preferred_language')
        .single();

      if (error || !claimed) {
        await sendTelegramText(chatId, staticMessages.invalid);
        return res.status(200).send('demo claim failed');
      }
      const lang = (claimed.preferred_language || 'en') as Lang;
      await sendTelegramText(chatId, staticMessages.welcome(claimed.full_name, lang));
      return res.status(200).send('demo claimed');
    }

    if (startToken) {
      const { data: claimed, error } = await supabase
        .from('patients')
        .update({
          telegram_chat_id: String(chatId),
          telegram_linked_at: new Date().toISOString(),
          telegram_link_token: null
        })
        .eq('telegram_link_token', startToken)
        .select('full_name, preferred_language')
        .single();

      if (error || !claimed) {
        await sendTelegramText(chatId, staticMessages.invalid);
        return res.status(200).send('invalid token');
      }
      const lang = (claimed.preferred_language || 'en') as Lang;
      await sendTelegramText(chatId, staticMessages.welcome(claimed.full_name, lang));
      return res.status(200).send('claimed');
    }

    const { data: patient } = await supabase
      .from('patients')
      .select('id, full_name, preferred_language, telegram_chat_id')
      .eq('telegram_chat_id', String(chatId))
      .maybeSingle();

    if (!patient) {
      await sendTelegramText(chatId, staticMessages.hint);
      return res.status(200).send('unlinked');
    }

    const linked = patient as LinkedPatient;

    if (msg.voice || msg.audio) {
      await handleVoiceMessage(linked, msg);
      return res.status(200).send('voice ok');
    }

    if ((Array.isArray(msg.photo) && msg.photo.length > 0) ||
        (msg.document && typeof msg.document.mime_type === 'string' && msg.document.mime_type.startsWith('image/'))) {
      await handlePhotoMessage(linked, msg);
      return res.status(200).send('photo ok');
    }

    await handleLinkedTextMessage(linked, msg, 'text');
    return res.status(200).send('ok');

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(200).send('error logged');
  }
}
