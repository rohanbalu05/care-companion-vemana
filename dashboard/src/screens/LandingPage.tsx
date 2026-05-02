import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Stethoscope, HeartPulse, Users, ArrowRight, ArrowDown, ExternalLink } from "lucide-react";

const DEMO_PATIENT_TOKEN = (import.meta.env.VITE_DEMO_PATIENT_TOKEN as string | undefined) || "demo-asha-2026";
const DEMO_GUARDIAN_TOKEN = (import.meta.env.VITE_DEMO_GUARDIAN_TOKEN as string | undefined) || "demo-rohan-2026";

function scrollToRoles(e: React.MouseEvent) {
  e.preventDefault();
  const el = document.getElementById("roles");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body antialiased">
      <style>{`
        html { scroll-behavior: smooth; }
        .dotted-grid {
          background-image: radial-gradient(circle, rgba(15,118,110,0.12) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .hindi { font-family: 'Noto Sans Devanagari', Inter, sans-serif; }
        .kannada { font-family: 'Noto Sans Kannada', Inter, sans-serif; }
      `}</style>

      <section className="relative min-h-screen flex flex-col">
        <div className="absolute inset-0 dotted-grid opacity-60 pointer-events-none" />
        <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-container/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-base text-on-surface tracking-tight">Care Companion</span>
              <span className="text-[11px] text-outline">Clinical Portal</span>
            </div>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider px-3 py-1.5 rounded-full bg-primary-container/15 text-primary-container border border-primary-container/30">
            Demo for hackathon judges
          </span>
        </header>

        <div className="relative z-10 flex-1 flex items-center justify-center px-6 md:px-10 pb-20">
          <div className="max-w-3xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-4xl md:text-6xl font-semibold tracking-tight text-on-surface leading-[1.05]"
            >
              Chronic care that actually checks in.
            </motion.h1>
            <div className="mt-8 space-y-2 text-base md:text-lg text-on-surface-variant">
              {[
                { text: "Your patients. Their daily reality. Our quiet attention.", className: "" },
                { text: "आपके मरीज़। उनकी रोज़मर्रा। हमारी शांत निगरानी।", className: "hindi" },
                { text: "ನಿಮ್ಮ ರೋಗಿಗಳು. ಅವರ ದೈನಂದಿನ. ನಮ್ಮ ಶಾಂತ ಗಮನ.", className: "kannada" }
              ].map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.15, ease: "easeOut" }}
                  className={line.className}
                >
                  {line.text}
                </motion.p>
              ))}
            </div>
            <div className="mt-10 flex items-center justify-center">
              <motion.a
                href="#roles"
                onClick={scrollToRoles}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.85, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary-container text-on-primary font-medium text-sm shadow-[0_2px_4px_rgba(15,118,110,0.15)] hover:bg-primary transition-colors"
              >
                Pick your role <ArrowDown size={16} />
              </motion.a>
            </div>
          </div>
        </div>
      </section>

      <section id="roles" className="relative px-6 md:px-10 py-20 bg-surface-container-low/40 border-y border-outline-variant/40 scroll-mt-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-on-surface">Pick your role</h2>
            <p className="mt-2 text-sm text-on-surface-variant">Three doors into the same care loop.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <RoleCard
              index={0}
              icon={<Stethoscope size={22} />}
              title="Clinician"
              body="Manage your roster, review AI-detected risk events, approve interventions in one tap."
              cta="Open clinical dashboard"
              href="/login"
              hint="Demo: sign in as Dr. Priya Mehta"
              accent="bg-primary-container/10 text-primary-container"
            />
            <RoleCard
              index={1}
              icon={<HeartPulse size={22} />}
              title="Patient"
              body="Care Companion checks in with you on Telegram, in your language. Your dashboard shows your wellness journey."
              cta="Use demo patient view"
              href={`/patient?token=${DEMO_PATIENT_TOKEN}`}
              hint="Demo: opens Mrs. Asha Sharma's view"
              accent="bg-tertiary-fixed/40 text-tertiary"
            />
            <RoleCard
              index={2}
              icon={<Users size={22} />}
              title="Guardian"
              body="Quiet peace-of-mind. See how your loved one is doing without intruding on their day."
              cta="Use demo guardian view"
              href={`/guardian?token=${DEMO_GUARDIAN_TOKEN}`}
              hint="Demo: opens Rohan Sharma's view"
              accent="bg-secondary-container/60 text-on-secondary-container"
            />
          </div>
        </div>
      </section>

      <section className="px-6 md:px-10 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-on-surface">How it works</h2>
            <p className="mt-2 text-sm text-on-surface-variant">From a Telegram message to an approved intervention — in four steps.</p>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
            <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-outline-variant" />
            <Step n="01" title="Patient logs daily" body={<>Text, voice note, or photo via Telegram. Hindi, Kannada, or English — switchable mid-conversation.</>} />
            <Step n="02" title="AI detects patterns" body={<>14-day signal analysis across BP, glucose, adherence, and symptom load. Comorbidity-aware.</>} />
            <Step n="03" title="Clinician reviews" body={<>One screen shows the risk event with full reasoning trace and guideline citation.</>} />
            <Step n="04" title="Intervention reaches patient" body={<>Approved with one tap. Multilingual message lands on Telegram in seconds.</>} />
          </ol>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-10 border-t border-outline-variant/60 text-sm text-on-surface-variant">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <span>Built for the Anthropic Hackathon · Bangalore · 2026</span>
          <nav className="flex items-center gap-5 text-[12px]">
            <a className="inline-flex items-center gap-1 hover:text-on-surface" href="https://github.com/rohanbalu05/care-companion-vemana" target="_blank" rel="noreferrer"><ExternalLink size={14} /> GitHub</a>
            <Link className="hover:text-on-surface" to="/clinician">Clinical dashboard</Link>
            <a className="hover:text-on-surface" href="mailto:rohanbalu05@gmail.com">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function RoleCard({ index, icon, title, body, cta, href, hint, accent }: {
  index: number; icon: React.ReactNode; title: string; body: string; cta: string; href: string; hint: string; accent: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 22 } }}
      className="bg-surface-container-lowest border border-[#E7E5E4] rounded-xl p-6 flex flex-col gap-4 shadow-[0_1px_2px_rgba(28,25,23,0.02)] hover:shadow-[0_4px_12px_rgba(28,25,23,0.06)] transition-shadow w-full md:w-80"
    >
      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${accent}`}>{icon}</div>
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-on-surface">{title}</h3>
        <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">{body}</p>
      </div>
      <div className="mt-auto flex flex-col gap-1.5">
        <Link
          to={href}
          className="inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-md bg-primary-container text-on-primary font-medium text-sm hover:bg-primary transition-colors"
        >
          {cta} <ArrowRight size={14} />
        </Link>
        <span className="text-[11px] text-outline pl-1">{hint}</span>
      </div>
    </motion.article>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: React.ReactNode }) {
  return (
    <li className="relative flex flex-col items-start text-left gap-3">
      <div className="relative z-10 w-14 h-14 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center font-mono text-base font-semibold text-primary-container">
        {n}
      </div>
      <h3 className="font-semibold tracking-tight text-on-surface">{title}</h3>
      <p className="text-sm text-on-surface-variant leading-relaxed">{body}</p>
    </li>
  );
}
