import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export function DashboardLoading({ label = "Loading patient view…" }: { label?: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        className="w-9 h-9 rounded-full border-2 border-primary-container border-t-transparent"
        aria-hidden
      />
      <p className="text-sm text-on-surface-variant">{label}</p>
    </div>
  );
}

export function DashboardError({ error, onRetry, kind = "patient" }: {
  error: string;
  onRetry: () => void;
  kind?: "patient" | "guardian" | "clinician";
}) {
  const expired = error === 'invalid_or_expired_token';
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0_2px_4px_rgba(28,25,23,0.04)] flex flex-col items-center text-center gap-3">
        <div className="w-10 h-10 rounded-full bg-error-container/40 border border-error-container/60 flex items-center justify-center">
          <AlertTriangle size={18} className="text-on-error-container" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-on-surface">
          {expired ? `${kind === 'patient' ? 'Patient' : kind === 'guardian' ? 'Guardian' : 'Dashboard'} link not recognised` : "Couldn't load this view"}
        </h2>
        <p className="text-sm text-on-surface-variant">
          {expired
            ? 'This link may have expired or already been replaced. Please ask your clinic for a new one.'
            : error || 'Something went wrong while fetching data. Please try again.'}
        </p>
        {!expired && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-container text-on-primary text-sm font-medium hover:bg-primary transition-colors"
          >
            <RefreshCcw size={14} /> Retry
          </button>
        )}
        <a className="mt-1 text-[12px] text-outline hover:text-on-surface" href="/">Back to landing</a>
      </div>
    </div>
  );
}
