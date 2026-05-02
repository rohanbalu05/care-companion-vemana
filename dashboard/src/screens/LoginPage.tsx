import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

let supabase: SupabaseClient | null = null;
function getSupabase() {
  if (supabase) return supabase;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
}

const DEMO_SESSION_KEY = 'cc_demo_session';

export function setDemoSession() {
  try { localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ role: 'clinician', name: 'Dr. Priya Mehta', at: Date.now() })); } catch {}
}

export function hasDemoSession(): boolean {
  try { return Boolean(localStorage.getItem(DEMO_SESSION_KEY)); } catch { return false; }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('priya.mehta@sanjeevani.demo');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const sb = getSupabase();
      if (!sb) {
        setError('Supabase auth not configured. Use the demo session button below.');
        setSubmitting(false);
        return;
      }
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setSubmitting(false);
        return;
      }
      navigate('/clinician');
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed');
      setSubmitting(false);
    }
  }

  function startDemoSession() {
    setDemoSession();
    navigate('/clinician');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 md:px-10 py-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface">
          <ArrowLeft size={14} /> Back to landing
        </Link>
      </div>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-[0_2px_4px_rgba(28,25,23,0.04)]">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Clinician sign in</h1>
            <p className="mt-1 text-sm text-on-surface-variant">Care Companion clinical portal</p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium uppercase tracking-wider text-on-surface-variant">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium uppercase tracking-wider text-on-surface-variant">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="px-3 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              />
            </label>
            {error && (
              <p className="text-sm text-error bg-error-container/40 border border-error-container/60 rounded-md px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-md bg-primary-container text-on-primary font-medium text-sm hover:bg-primary transition-colors disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="my-6 flex items-center gap-3 text-[12px] uppercase tracking-wider text-outline">
            <span className="flex-1 h-px bg-outline-variant" /> demo <span className="flex-1 h-px bg-outline-variant" />
          </div>
          <button
            onClick={startDemoSession}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-outline-variant text-on-surface font-medium text-sm hover:bg-surface-container-low transition-colors"
          >
            <ShieldCheck size={16} className="text-primary-container" /> Use demo session as Dr. Priya Mehta
          </button>
          <p className="mt-3 text-[11px] text-outline text-center">
            Skips Supabase Auth for the hackathon demo. Replaces with a real auth user pre-launch.
          </p>
        </div>
      </main>
    </div>
  );
}
