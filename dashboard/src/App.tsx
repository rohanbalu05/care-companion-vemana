import { useState } from "react";
import ClinicianRoster from "./screens/ClinicianRoster";
import PatientDetail from "./screens/PatientDetail";
import ReasoningTracePanel from "./screens/ReasoningTracePanel";
import PatientDashboard from "./screens/PatientDashboard";
import GuardianDashboard from "./screens/GuardianDashboard";

const screens = {
  roster: { label: "Clinician Roster", component: <ClinicianRoster /> },
  detail: { label: "Patient Detail", component: <PatientDetail /> },
  trace: { label: "Reasoning Trace", component: <ReasoningTracePanel /> },
  patient: { label: "Patient Dashboard", component: <PatientDashboard /> },
  guardian: { label: "Guardian Dashboard", component: <GuardianDashboard /> },
} as const;

type ScreenKey = keyof typeof screens;

export default function App() {
  const [active, setActive] = useState<ScreenKey>("detail");

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] bg-inverse-surface text-inverse-on-surface rounded-full px-2 py-1 flex gap-1 shadow-lg text-[11px]">
        {(Object.keys(screens) as ScreenKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={
              "px-3 py-1 rounded-full transition-colors " +
              (active === key
                ? "bg-primary-fixed text-on-primary-fixed font-semibold"
                : "hover:bg-white/10")
            }
          >
            {screens[key].label}
          </button>
        ))}
      </div>
      {screens[active].component}
    </div>
  );
}
