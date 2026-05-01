import ClinicianRoster from "./screens/ClinicianRoster";
import PatientDetail from "./screens/PatientDetail";
import ReasoningTracePanel from "./screens/ReasoningTracePanel";
import PatientDashboard from "./screens/PatientDashboard";
import GuardianDashboard from "./screens/GuardianDashboard";
import { DashboardProvider } from "./lib/dashboardData";

type ScreenKey = "roster" | "detail" | "trace" | "patient" | "guardian";

function getQueryParam(name: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || undefined;
}

function pickScreen(key: string | undefined): ScreenKey {
  switch (key) {
    case 'roster': case 'trace': case 'patient': case 'guardian': case 'detail':
      return key;
    default:
      return 'detail';
  }
}

function renderScreen(key: ScreenKey) {
  switch (key) {
    case 'roster':   return <ClinicianRoster />;
    case 'trace':    return <ReasoningTracePanel />;
    case 'patient':  return <PatientDashboard />;
    case 'guardian': return <GuardianDashboard />;
    default:         return <PatientDetail />;
  }
}

export default function App() {
  const active = pickScreen(getQueryParam('screen'));
  const patientId = getQueryParam('patient_id');

  return (
    <DashboardProvider patientId={patientId}>
      <div className="min-h-screen bg-background">
        {renderScreen(active)}
      </div>
    </DashboardProvider>
  );
}
