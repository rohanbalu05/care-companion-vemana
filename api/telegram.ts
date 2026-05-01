import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const TG_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});

type Lang = 'en' | 'hi' | 'kn';

const messages = {
  welcome: (name: string, lang: Lang) => ({
    hi: `नमस्ते ${name} जी! 🙏 मैं Saathi हूँ — आपकी देखभाल में आपका साथी।\nआज से, आप यहाँ अपनी BP, शुगर, दवाइयाँ और लक्षण साझा कर सकती हैं। Dr. Priya Mehta को सब अपडेट मिलेंगे।\nशुरू करने के लिए /help लिखें।`,
    kn: `ನಮಸ್ಕಾರ ${name}! 🙏 ನಾನು Saathi — ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಂಗಾತಿ.\nಇಂದಿನಿಂದ, ನೀವು ನಿಮ್ಮ BP, ಸಕ್ಕರೆ, ಔಷಧಗಳು ಮತ್ತು ಲಕ್ಷಣಗಳನ್ನು ಇಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಬಹುದು.\n/help ಎಂದು ಬರೆಯಿರಿ.`,
    en: `Namaste ${name}! 🙏 I am Saathi — your care companion.\nFrom today, you can share your BP, sugar, medicines, and symptoms here. Dr. Priya Mehta will get all updates.\nType /help to begin.`
  }[lang]),
  ack: (name: string, lang: Lang) => ({
    hi: `मिल गया, ${name}। 🙏 मैं डॉक्टर को सूचित कर दूँगा।\n(पूरी बातचीत और AI सहायता जल्द ही शुरू होगी।)`,
    kn: `ಸಿಕ್ಕಿತು, ${name}. 🙏 ನಾನು ಡಾಕ್ಟರ್‌ಗೆ ತಿಳಿಸುತ್ತೇನೆ.`,
    en: `Got it, ${name}. 🙏 I will keep your doctor in the loop.\n(Full conversational + AI support coming next.)`
  }[lang]),
  invalid: `This link looks expired or already used. Please contact your clinic for a fresh link. 🙏`,
  hint: `Hello! 👋 To begin, please open the secure link your clinic shared with you. If you don't have it, please contact your clinic.`
};

async function sendMessage(chatId: number, text: string) {
  const res = await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
  if (!res.ok) console.error('Telegram send failed', res.status, await res.text());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(200).send('ok');

  try {
    const update = req.body || {};
    const msg = update.message;
    if (!msg) return res.status(200).send('no message');

    const chatId: number = msg.chat.id;
    const firstName: string = msg.chat.first_name || '';
    const text: string = (msg.text || '').trim();
    const isStart = text === '/start' || text.startsWith('/start ');
    const startToken = isStart && text.includes(' ') ? text.split(/\s+/)[1] : null;

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
        await sendMessage(chatId, messages.invalid);
        return res.status(200).send('invalid token');
      }

      const lang = (claimed.preferred_language || 'en') as Lang;
      await sendMessage(chatId, messages.welcome(claimed.full_name, lang));
      return res.status(200).send('claimed');
    }

    const { data: patient } = await supabase
      .from('patients')
      .select('full_name, preferred_language')
      .eq('telegram_chat_id', String(chatId))
      .maybeSingle();

    if (!patient) {
      await sendMessage(chatId, messages.hint);
      return res.status(200).send('unlinked');
    }

    const lang = (patient.preferred_language || 'en') as Lang;
    await sendMessage(chatId, messages.ack(patient.full_name || firstName, lang));
    return res.status(200).send('ack');

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(200).send('error logged');
  }
}
