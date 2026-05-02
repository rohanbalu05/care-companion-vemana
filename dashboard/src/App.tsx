import { BrowserRouter, Routes, Route, useSearchParams, Navigate } from "react-router-dom";
import LandingPage from "./screens/LandingPage";
import LoginPage from "./screens/LoginPage";
import ClinicianRoster from "./screens/ClinicianRoster";
import PatientDetail from "./screens/PatientDetail";
import PatientDashboard from "./screens/PatientDashboard";
import GuardianDashboard from "./screens/GuardianDashboard";
import { DashboardProvider } from "./lib/dashboardData";

function ClinicianRosterRoute() {
  return (
    <DashboardProvider>
      <ClinicianRoster />
    </DashboardProvider>
  );
}

function PatientDetailRoute({ panelOpen }: { panelOpen?: boolean }) {
  const [params] = useSearchParams();
  const patientId = params.get('patient_id') || undefined;
  return (
    <DashboardProvider patientId={patientId}>
      <PatientDetail initialPanelOpen={panelOpen} />
    </DashboardProvider>
  );
}

function PatientDashboardRoute() {
  const [params] = useSearchParams();
  const token = params.get('token') || undefined;
  if (!token) return <InvalidLink kind="patient" />;
  return (
    <DashboardProvider token={token}>
      <TokenGuard label="Patient">
        <PatientDashboard />
      </TokenGuard>
    </DashboardProvider>
  );
}

function GuardianDashboardRoute() {
  const [params] = useSearchParams();
  const token = params.get('token') || undefined;
  if (!token) return <InvalidLink kind="guardian" />;
  return (
    <DashboardProvider guardianToken={token}>
      <TokenGuard label="Guardian">
        <GuardianDashboard />
      </TokenGuard>
    </DashboardProvider>
  );
}

import { useDashboard } from "./lib/dashboardData";

function TokenGuard({ children, label }: { children: React.ReactNode; label: string }) {
  const { error } = useDashboard();
  if (error === 'invalid_or_expired_token') return <InvalidLink kind={label.toLowerCase() as 'patient' | 'guardian'} />;
  return <>{children}</>;
}

function InvalidLink({ kind }: { kind: 'patient' | 'guardian' }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md text-center bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-[0_2px_4px_rgba(28,25,23,0.04)]">
        <h1 className="text-xl font-semibold text-on-surface mb-2">Invalid or expired link</h1>
        <p className="text-sm text-on-surface-variant">
          This {kind} link couldn't be matched to an active record. Please ask your clinic for a new one.
        </p>
        <a className="mt-6 inline-block text-sm text-primary-container hover:text-primary" href="/">Back to landing</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/clinician" element={<ClinicianRosterRoute />} />
        <Route path="/clinician/detail" element={<PatientDetailRoute />} />
        <Route path="/clinician/trace" element={<PatientDetailRoute panelOpen={true} />} />
        <Route path="/patient" element={<PatientDashboardRoute />} />
        <Route path="/guardian" element={<GuardianDashboardRoute />} />
        <Route path="/trace" element={<PatientDetailRoute panelOpen={true} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
