-- 001 initial schema for Care Companion
-- B2B2C chronic care monitoring: clinics enrol patients, patients interact via
-- Telegram in en/hi/kn, clinicians review AI-assisted intervention recommendations.

create extension if not exists pgcrypto;

------------------------------------------------------------------------
-- 1. clinics
------------------------------------------------------------------------
create table clinics (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    address text,
    city text,
    state text,
    phone text,
    email text,
    created_at timestamptz not null default now()
);

------------------------------------------------------------------------
-- 2. clinicians
-- auth_user_id ties a clinician row to a Supabase Auth user. Nullable so
-- we can seed clinicians before their auth account is provisioned.
------------------------------------------------------------------------
create table clinicians (
    id uuid primary key default gen_random_uuid(),
    clinic_id uuid not null references clinics(id) on delete cascade,
    auth_user_id uuid references auth.users(id) on delete set null,
    full_name text not null,
    email text not null unique,
    role text not null check (role in ('doctor','nurse','admin')),
    specialty text,
    phone text,
    created_at timestamptz not null default now()
);

create index clinicians_clinic_id_idx on clinicians(clinic_id);
create index clinicians_auth_user_id_idx on clinicians(auth_user_id);

------------------------------------------------------------------------
-- 3. patients
-- preferred_language is the patient's stated default; last_detected_language
-- captures whatever language they actually used in their most recent message
-- (so the dashboard can flag drift, e.g. patient set 'en' but is typing in 'kn').
------------------------------------------------------------------------
create table patients (
    id uuid primary key default gen_random_uuid(),
    clinic_id uuid not null references clinics(id) on delete cascade,
    full_name text not null,
    dob date,
    sex text check (sex in ('male','female','other')),
    phone text,
    telegram_chat_id text unique,
    preferred_language text not null default 'en' check (preferred_language in ('en','hi','kn')),
    last_detected_language text,
    height_cm numeric,
    weight_kg numeric,
    address text,
    city text,
    allergies text[],
    family_history text,
    enrolled_by_clinician_id uuid references clinicians(id) on delete set null,
    enrolled_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index patients_clinic_id_idx on patients(clinic_id);
create index patients_enrolled_by_clinician_id_idx on patients(enrolled_by_clinician_id);
create index patients_telegram_chat_id_idx on patients(telegram_chat_id);

------------------------------------------------------------------------
-- 4. guardians
-- Family members (typically adult children) who get notified when the
-- patient stops responding to Saathi check-ins.
------------------------------------------------------------------------
create table guardians (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete cascade,
    auth_user_id uuid references auth.users(id) on delete set null,
    full_name text not null,
    phone text,
    telegram_chat_id text,
    relationship text,
    notify_on_non_response boolean not null default true,
    created_at timestamptz not null default now()
);

create index guardians_patient_id_idx on guardians(patient_id);
create index guardians_auth_user_id_idx on guardians(auth_user_id);

------------------------------------------------------------------------
-- 5. diagnoses
-- baseline_values stores the clinical numbers at time of diagnosis so we
-- can later show "baseline vs current" trends without recomputing.
------------------------------------------------------------------------
create table diagnoses (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete cascade,
    condition text not null,
    icd10_code text,
    diagnosed_on date,
    baseline_values jsonb,
    notes text,
    created_at timestamptz not null default now()
);

create index diagnoses_patient_id_idx on diagnoses(patient_id);

------------------------------------------------------------------------
-- 6. prescriptions
-- A scanned prescription image. parsed_medications is the OCR/LLM output
-- that a clinician then confirms (or rejects) before promoting to
-- individual medications rows.
------------------------------------------------------------------------
create table prescriptions (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete cascade,
    image_storage_path text,
    ocr_raw_text text,
    parsed_medications jsonb,
    status text not null check (status in ('pending_review','confirmed','rejected')),
    confirmed_by_clinician_id uuid references clinicians(id) on delete set null,
    confirmed_at timestamptz,
    notes text,
    created_at timestamptz not null default now()
);

create index prescriptions_patient_id_idx on prescriptions(patient_id);
create index prescriptions_confirmed_by_clinician_id_idx on prescriptions(confirmed_by_clinician_id);
create index prescriptions_status_idx on prescriptions(status);

------------------------------------------------------------------------
-- 7. medications
-- Active prescription lines. prescription_id links back to the source
-- scan if the medication came from one; nullable for manually-entered meds.
-- frequency uses standard Indian outpatient shorthand (OD/BD/TDS/QID/SOS/HS).
------------------------------------------------------------------------
create table medications (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete cascade,
    drug_name text not null,
    generic_name text,
    dose_amount numeric,
    dose_unit text check (dose_unit in ('mg','g','ml','unit')),
    frequency text check (frequency in ('OD','BD','TDS','QID','SOS','HS')),
    instructions text,
    prescribed_by_clinician_id uuid references clinicians(id) on delete set null,
    prescribed_on date,
    start_date date,
    end_date date,
    status text not null check (status in ('pending_confirmation','active','discontinued')),
    prescription_id uuid references prescriptions(id) on delete set null,
    created_at timestamptz not null default now()
);

create index medications_patient_id_idx on medications(patient_id);
create index medications_prescribed_by_clinician_id_idx on medications(prescribed_by_clinician_id);
create index medications_prescription_id_idx on medications(prescription_id);
create index medications_status_idx on medications(status);
create index medications_active_window_idx on medications(start_date, end_date);

------------------------------------------------------------------------
-- 8. vitals
-- BP uses systolic + diastolic; everything else uses value_numeric.
-- source records HOW the reading entered the system (photo OCR, voice
-- transcription, free text, or manual clinician entry).
------------------------------------------------------------------------
create table vitals (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete cascade,
    vital_type text not null check (vital_type in (
        'bp','glucose_fasting','glucose_postprandial','glucose_random',
        'spo2','weight','temperature','heart_rate'
    )),
    value_systolic numeric,
    value_diastolic numeric,
    value_numeric numeric,
    unit text,
    source text not null check (source in ('photo','voice','text','manual')),
    image_storage_path text,
    recorded_at timestamptz not null,
    notes text,
    created_at timestamptz not null default now()
);

create index vitals_patient_id_idx on vitals(patient_id);
create index vitals_recorded_at_idx on vitals(recorded_at);
create index vitals_patient_recorded_idx on vitals(patient_id, recorded_at desc);
create index vitals_vital_type_idx on vitals(vital_type);

------------------------------------------------------------------------
-- 9. adherence_events
-- One row per scheduled dose. Created up-front by a scheduler and then
-- updated to 'taken'/'missed'/'late' as evidence comes in. source records
-- whether the patient confirmed by tap, voice, or whether we inferred it.
------------------------------------------------------------------------
create table adherence_events (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete cascade,
    medication_id uuid not null references medications(id) on delete cascade,
    scheduled_at timestamptz not null,
    status text not null check (status in ('scheduled','taken','missed','late')),
    taken_at timestamptz,
    source text check (source in ('patient_confirmed','patient_voice','auto_inferred','guardian_confirmed')),
    notes text,
    created_at timestamptz not null default now()
);

create index adherence_events_patient_id_idx on adherence_events(patient_id);
create index adherence_events_medication_id_idx on adherence_events(medication_id);
create index adherence_events_scheduled_at_idx on adherence_events(scheduled_at);
create index adherence_events_patient_scheduled_idx on adherence_events(patient_id, scheduled_at desc);
create index adherence_events_status_idx on adherence_events(status);

------------------------------------------------------------------------
-- 10. symptoms
-- symptom_text_raw preserves the patient's words verbatim in their original
-- language for clinician review; symptom_text_normalized is the English
-- translation used for downstream rule firing.
------------------------------------------------------------------------
create table symptoms (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete cascade,
    symptom_text_raw text not null,
    symptom_text_normalized text,
    language_detected text check (language_detected in ('en','hi','kn','other')),
    severity text check (severity in ('mild','moderate','severe')),
    source text check (source in ('voice','text','saathi_prompt')),
    recorded_at timestamptz not null,
    created_at timestamptz not null default now()
);

create index symptoms_patient_id_idx on symptoms(patient_id);
create index symptoms_recorded_at_idx on symptoms(recorded_at);
create index symptoms_patient_recorded_idx on symptoms(patient_id, recorded_at desc);
create index symptoms_severity_idx on symptoms(severity);

------------------------------------------------------------------------
-- 11. risk_events
-- Each row is a fired rule. data_point_refs is a jsonb array of
-- {table, id} pointers to the underlying vitals/adherence/symptom rows
-- that triggered the rule -- this is what powers "tap to see why" in the UI.
-- llm_reasoning_trace is optional and only populated when an LLM was in the loop.
------------------------------------------------------------------------
create table risk_events (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete cascade,
    event_type text not null,
    severity text not null check (severity in ('info','low','medium','high','critical')),
    score_delta integer not null default 0,
    rule_fired text not null,
    data_point_refs jsonb,
    narrative_text text,
    guideline_citation text,
    llm_reasoning_trace jsonb,
    detected_at timestamptz not null,
    created_at timestamptz not null default now()
);

create index risk_events_patient_id_idx on risk_events(patient_id);
create index risk_events_detected_at_idx on risk_events(detected_at);
create index risk_events_patient_detected_idx on risk_events(patient_id, detected_at desc);
create index risk_events_severity_idx on risk_events(severity);
create index risk_events_event_type_idx on risk_events(event_type);

------------------------------------------------------------------------
-- 12. interventions
-- A clinician-reviewed recommendation. The full lifecycle is
-- pending_review -> approved -> sent (or rejected). sent_message_text holds
-- the actual rendered message in the patient's language at the time of send.
------------------------------------------------------------------------
create table interventions (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete cascade,
    triggered_by_risk_event_id uuid references risk_events(id) on delete set null,
    recommendation_text text not null,
    citation text,
    clinical_reasoning text,
    status text not null check (status in ('pending_review','approved','rejected','sent')),
    approved_by_clinician_id uuid references clinicians(id) on delete set null,
    approved_at timestamptz,
    sent_at timestamptz,
    sent_message_text text,
    created_at timestamptz not null default now()
);

create index interventions_patient_id_idx on interventions(patient_id);
create index interventions_triggered_by_risk_event_id_idx on interventions(triggered_by_risk_event_id);
create index interventions_approved_by_clinician_id_idx on interventions(approved_by_clinician_id);
create index interventions_status_idx on interventions(status);

------------------------------------------------------------------------
-- 13. wellness_scores
-- Pre-computed daily 0-100 score so the dashboard can render a sparkline
-- without re-aggregating raw events on every page load. calculation_breakdown
-- holds the raw counts so the UI can answer "How is this calculated?".
------------------------------------------------------------------------
create table wellness_scores (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete cascade,
    score integer not null check (score between 0 and 100),
    sub_score_adherence integer not null check (sub_score_adherence between 0 and 35),
    sub_score_vitals integer not null check (sub_score_vitals between 0 and 35),
    sub_score_engagement integer not null check (sub_score_engagement between 0 and 20),
    sub_score_symptom integer not null check (sub_score_symptom between 0 and 10),
    calculation_breakdown jsonb,
    calculated_for_date date not null,
    created_at timestamptz not null default now(),
    unique (patient_id, calculated_for_date)
);

create index wellness_scores_patient_id_idx on wellness_scores(patient_id);
create index wellness_scores_calculated_for_date_idx on wellness_scores(calculated_for_date);

------------------------------------------------------------------------
-- 14. audit_log
-- Polymorphic audit trail. target_id is a uuid pointing at a row in
-- target_table, but no FK is enforced (rows can be from any table and
-- must survive deletion of the target). actor_id is nullable for system actors.
------------------------------------------------------------------------
create table audit_log (
    id uuid primary key default gen_random_uuid(),
    actor_type text not null check (actor_type in ('clinician','patient','guardian','system','n8n')),
    actor_id uuid,
    action text not null,
    target_table text not null,
    target_id uuid not null,
    changes jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz not null default now()
);

create index audit_log_actor_id_idx on audit_log(actor_id);
create index audit_log_target_idx on audit_log(target_table, target_id);
create index audit_log_created_at_idx on audit_log(created_at);
create index audit_log_action_idx on audit_log(action);
