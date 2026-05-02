import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, UserPlus } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

type Step = 'form' | 'success' | 'error';

type SuccessPayload = {
  patient_id: string;
  access_token: string;
  start_token: string;
  guardian_access_token: string | null;
  patient_link: string;
  guardian_link: string | null;
  telegram_link: string;
};

export default function AddPatientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<SuccessPayload | null>(null);
  const [copied, setCopied] = useState<'patient' | 'telegram' | null>(null);

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'female' | 'male' | ''>('');
  const [diagnosis, setDiagnosis] = useState<'t2dm' | 'htn' | 'both'>('both');
  const [language, setLanguage] = useState<'en' | 'hi' | 'kn'>('hi');
  const [phone, setPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('son');
  const [guardianPhone, setGuardianPhone] = useState('');

  function reset() {
    setStep('form'); setSubmitting(false); setErrorMsg(null); setResult(null); setCopied(null);
    setFullName(''); setAge(''); setSex(''); setDiagnosis('both'); setLanguage('hi'); setPhone('');
    setGuardianName(''); setGuardianRelationship('son'); setGuardianPhone('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/onboard-patient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          age: parseInt(age, 10),
          sex: sex || null,
          phone: phone || null,
          diagnosis,
          language,
          guardian_name: guardianName || null,
          guardian_relationship: guardianRelationship || null,
          guardian_phone: guardianPhone || null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || `request failed (${res.status})`);
        setStep('error');
        setSubmitting(false);
        return;
      }
      setResult(data);
      setStep('success');
      setSubmitting(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'request failed');
      setStep('error');
      setSubmitting(false);
    }
  }

  async function copyTo(kind: 'patient' | 'telegram', text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullPatientLink = result?.patient_link ? `${origin}${result.patient_link}` : '';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          />
          <motion.div
            key="modal"
            role="dialog"
            aria-label="Add patient"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto w-full max-w-lg bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_8px_30px_rgba(28,25,23,0.12)] flex flex-col max-h-[92vh]"
            >
              <div className="flex-none flex items-center justify-between p-6 border-b border-outline-variant/60">
                <div className="flex items-center gap-2">
                  <UserPlus size={18} className="text-primary-container" />
                  <h2 className="text-lg font-semibold tracking-tight text-on-surface">
                    {step === 'success' ? 'Patient onboarded' : 'Add patient'}
                  </h2>
                </div>
                <button onClick={handleClose} aria-label="Close" className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high transition-colors">
                  <X size={18} />
                </button>
              </div>

              {step === 'form' && (
                <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                  <Field label="Full name">
                    <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Sunita Devi"
                      className="w-full px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Age">
                      <input required type="number" min={18} max={120} value={age} onChange={e => setAge(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
                    </Field>
                    <Field label="Sex">
                      <select value={sex} onChange={e => setSex(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:border-primary-container">
                        <option value="">—</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Phone (optional)">
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 …"
                      className="w-full px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
                  </Field>
                  <Field label="Primary diagnosis">
                    <div className="grid grid-cols-3 gap-2">
                      {(['t2dm','htn','both'] as const).map(v => (
                        <button type="button" key={v} onClick={() => setDiagnosis(v)}
                          className={`px-3 py-2 rounded-md border text-xs font-medium transition-colors ${diagnosis===v ? 'bg-primary-container text-on-primary border-primary-container' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low'}`}>
                          {v === 't2dm' ? 'T2DM only' : v === 'htn' ? 'HTN only' : 'T2DM + HTN'}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Primary language">
                    <div className="grid grid-cols-3 gap-2">
                      {(['en','hi','kn'] as const).map(v => (
                        <button type="button" key={v} onClick={() => setLanguage(v)}
                          className={`px-3 py-2 rounded-md border text-xs font-medium transition-colors ${language===v ? 'bg-primary-container text-on-primary border-primary-container' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low'}`}>
                          {v === 'en' ? 'English' : v === 'hi' ? 'Hindi' : 'Kannada'}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="border-t border-outline-variant/60 pt-4 mt-2">
                    <h3 className="text-[12px] uppercase tracking-wider text-on-surface-variant font-medium mb-3">Guardian (optional)</h3>
                    <div className="flex flex-col gap-3">
                      <Field label="Guardian name">
                        <input value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="e.g. Rohan Sharma"
                          className="w-full px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Relationship">
                          <select value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:border-primary-container">
                            {['son','daughter','spouse','sibling','parent','other'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                          </select>
                        </Field>
                        <Field label="Phone">
                          <input type="tel" value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} placeholder="+91 …"
                            className="w-full px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
                        </Field>
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-sm text-error bg-error-container/40 border border-error-container/60 rounded-md px-3 py-2">{errorMsg}</p>
                  )}

                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={handleClose} className="px-4 py-2 rounded-md border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-low transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-primary-container text-on-primary text-sm font-medium hover:bg-primary transition-colors disabled:opacity-60 inline-flex items-center gap-2">
                      {submitting ? 'Onboarding…' : 'Onboard patient'}
                    </button>
                  </div>
                </form>
              )}

              {step === 'success' && result && (
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                  <p className="text-sm text-on-surface-variant">
                    {fullName || 'The patient'} is now in your roster. Share these links with them.
                  </p>

                  <div className="flex flex-col gap-2">
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-medium">Patient dashboard link</span>
                    <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-md px-3 py-2">
                      <code className="flex-1 text-[12px] text-on-surface truncate">{fullPatientLink}</code>
                      <button onClick={() => copyTo('patient', fullPatientLink)} className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors" aria-label="Copy patient link">
                        {copied === 'patient' ? <Check size={14} className="text-primary-container" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 pt-2">
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-medium self-stretch">Telegram bot — scan to bind chat</span>
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
                      <QRCodeSVG value={result.telegram_link} size={196} level="M" />
                    </div>
                    <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-md px-3 py-2 self-stretch">
                      <code className="flex-1 text-[11px] text-on-surface-variant truncate">{result.telegram_link}</code>
                      <button onClick={() => copyTo('telegram', result.telegram_link)} className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors" aria-label="Copy telegram link">
                        {copied === 'telegram' ? <Check size={14} className="text-primary-container" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-outline text-center">Patient scans → taps Start → first daily check-in begins.</p>
                  </div>

                  {result.guardian_link && (
                    <div className="flex flex-col gap-2 border-t border-outline-variant/60 pt-4">
                      <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-medium">Guardian dashboard link</span>
                      <code className="text-[12px] text-on-surface bg-surface-container-low border border-outline-variant rounded-md px-3 py-2 truncate">{origin}{result.guardian_link}</code>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button onClick={handleClose} className="px-4 py-2 rounded-md bg-primary-container text-on-primary text-sm font-medium hover:bg-primary transition-colors">
                      Done
                    </button>
                  </div>
                </div>
              )}

              {step === 'error' && (
                <div className="flex-1 p-6 flex flex-col gap-4">
                  <p className="text-sm text-error bg-error-container/40 border border-error-container/60 rounded-md px-3 py-2">
                    {errorMsg || 'Onboarding failed.'}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setStep('form')} className="px-4 py-2 rounded-md border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-low transition-colors">
                      Back to form
                    </button>
                    <button onClick={handleClose} className="px-4 py-2 rounded-md bg-primary-container text-on-primary text-sm font-medium hover:bg-primary transition-colors">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium uppercase tracking-wider text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}
