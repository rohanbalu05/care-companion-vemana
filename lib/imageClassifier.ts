const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const LLM_MODEL_SMART = process.env.LLM_MODEL_SMART || 'anthropic/claude-sonnet-4';
const CLASSIFY_TIMEOUT_MS = 25000;

export type ImageType = 'prescription' | 'bp_monitor' | 'glucometer' | 'unclear' | 'other';

export type Classification = {
  type: ImageType;
  confidence: 'high' | 'medium' | 'low';
  detected_subject: string;
  reasoning: string;
};

const CLASSIFY_SYSTEM_PROMPT = `You are an image classifier for a chronic care monitoring app. Classify the provided image into ONE category. Output ONLY valid JSON:
{
  "type": "prescription" | "bp_monitor" | "glucometer" | "unclear" | "other",
  "confidence": "high" | "medium" | "low",
  "detected_subject": string,
  "reasoning": string
}

Rules:
- "prescription" = printed medical prescription (Rx symbol, doctor letterhead, list of medicines with dosage). Even sample/template prescriptions count as prescription type.
- "bp_monitor" = digital blood pressure cuff display showing SYS, DIA, and usually pulse numbers.
- "glucometer" = handheld blood glucose meter showing a single mg/dL reading, typically with date/time.
- "unclear" = clearly one of the above categories but the photo is too blurry/dark/cropped to read reliably.
- "other" = anything else (food, person, screenshot, document that isn't a prescription, etc.). Set detected_subject to a short description.

If confidence is "low", classify as "unclear" instead of guessing.`;

function stripJsonFences(s: string): string {
  return s.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

export async function classifyImage(dataUrl: string): Promise<Classification> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CLASSIFY_TIMEOUT_MS);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://care-companion-vemana.vercel.app',
        'X-Title': 'Care Companion Image Classifier'
      },
      body: JSON.stringify({
        model: LLM_MODEL_SMART,
        messages: [
          { role: 'system', content: CLASSIFY_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
              { type: 'text', text: 'Classify this image.' }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });
    if (!res.ok) {
      console.error('classifier HTTP', res.status, (await res.text()).slice(0, 400));
      return { type: 'unclear', confidence: 'low', detected_subject: 'unknown', reasoning: 'classifier_http_error' };
    }
    const j: any = await res.json();
    const content: string | undefined = j?.choices?.[0]?.message?.content;
    if (!content) return { type: 'unclear', confidence: 'low', detected_subject: 'unknown', reasoning: 'classifier_empty_content' };
    return JSON.parse(stripJsonFences(content)) as Classification;
  } catch (err) {
    console.error('classifier error', err instanceof Error ? err.message : err);
    return { type: 'unclear', confidence: 'low', detected_subject: 'unknown', reasoning: 'classifier_exception' };
  } finally {
    clearTimeout(timer);
  }
}
