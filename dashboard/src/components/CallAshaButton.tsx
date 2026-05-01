import { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';

type CallState = 'idle' | 'connecting' | 'in-call' | 'error';

const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY as string | undefined;
const AGENT_ID = import.meta.env.VITE_VAPI_AGENT_ID as string | undefined;
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

export default function CallAshaButton({ patientId }: { patientId: string }) {
  const vapiRef = useRef<Vapi | null>(null);
  const [state, setState] = useState<CallState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!PUBLIC_KEY) return;
    const v = new Vapi(PUBLIC_KEY);
    vapiRef.current = v;
    v.on('call-start', () => setState('in-call'));
    v.on('call-end', () => setState('idle'));
    v.on('error', (e: any) => {
      console.error('vapi error', e);
      setErrorMsg(typeof e === 'string' ? e : (e?.message || 'Call failed'));
      setState('error');
    });
    return () => { try { v.stop(); } catch {} };
  }, []);

  const handleStart = async () => {
    if (!PUBLIC_KEY || !AGENT_ID) {
      setErrorMsg('VAPI keys missing — set VITE_VAPI_PUBLIC_KEY and VITE_VAPI_AGENT_ID');
      setState('error');
      return;
    }
    if (!vapiRef.current) return;
    setErrorMsg(null);
    setState('connecting');
    try {
      const ctx = await fetch(`${API_BASE}/api/vapi-context?patient_id=${encodeURIComponent(patientId)}`)
        .then(r => {
          if (!r.ok) throw new Error(`context ${r.status}`);
          return r.json();
        });
      await vapiRef.current.start(AGENT_ID, { variableValues: ctx });
    } catch (err: any) {
      console.error('vapi start failed', err);
      setErrorMsg(err?.message || 'Could not start call');
      setState('error');
    }
  };

  const handleStop = () => {
    try { vapiRef.current?.stop(); } catch {}
    setState('idle');
  };

  const isBusy = state === 'connecting' || state === 'in-call';
  const label = state === 'connecting' ? 'Calling…'
    : state === 'in-call' ? 'End call'
    : state === 'error' ? 'Try again'
    : '📞 Call Asha';

  const palette = state === 'in-call'
    ? 'bg-error text-on-error hover:opacity-90'
    : state === 'error'
    ? 'bg-error-container text-on-error-container hover:opacity-90'
    : 'bg-primary text-on-primary hover:opacity-90';

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={state === 'in-call' ? handleStop : handleStart}
        disabled={state === 'connecting'}
        className={`px-4 py-2 rounded-full font-label text-label transition-colors flex items-center gap-2 disabled:opacity-60 ${palette}`}
      >
        {state === 'connecting' && (
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        )}
        {label}
      </button>
      <p className="text-label font-label text-outline text-right max-w-[260px]">
        Or dial <span className="font-mono">+91 94849 57011</span> to speak with Saathi directly
      </p>
      {errorMsg && state === 'error' && (
        <p className="text-label font-label text-error text-right max-w-[260px]">{errorMsg}</p>
      )}
    </div>
  );
}
