-- Migration: 005 - multi-disease attribution + Telegram deep-link onboarding
--
-- Adds:
--   * patients.telegram_link_token, telegram_linked_at
--       (one-time signed token for /start <token> deep link onboarding)
--   * risk_events.primary_diagnosis_id, involved_diagnosis_ids
--       (which condition(s) a risk event implicates - multi-factor patterns
--        can implicate multiple diagnoses simultaneously)
--   * interventions.diagnosis_id
--       (which condition the AI-drafted message is addressing)
--   * medications.diagnosis_id
--       (which condition each drug treats - Amlodipine -> HTN, Metformin -> T2DM)
-- Plus:
--   * Corrects Asha Sharma's preferred_language from 'en' to 'hi' (Hindi-native per persona)

BEGIN;

-- 1. patients: telegram linking columns
ALTER TABLE patients
  ADD COLUMN telegram_link_token text UNIQUE,
  ADD COLUMN telegram_linked_at  timestamptz;

-- 2. risk_events: multi-disease attribution
ALTER TABLE risk_events
  ADD COLUMN primary_diagnosis_id   uuid REFERENCES diagnoses(id) ON DELETE SET NULL,
  ADD COLUMN involved_diagnosis_ids uuid[] DEFAULT '{}';

CREATE INDEX risk_events_primary_diagnosis_idx
  ON risk_events(primary_diagnosis_id);

CREATE INDEX risk_events_involved_diagnosis_idx
  ON risk_events USING GIN(involved_diagnosis_ids);

-- 3. interventions: tie message to a specific condition
ALTER TABLE interventions
  ADD COLUMN diagnosis_id uuid REFERENCES diagnoses(id) ON DELETE SET NULL;

CREATE INDEX interventions_diagnosis_idx
  ON interventions(diagnosis_id);

-- 4. medications: each drug regimen entry maps to one diagnosis.
--    Prescriptions stay condition-agnostic since one OCR'd Rx may cover multiple conditions.
ALTER TABLE medications
  ADD COLUMN diagnosis_id uuid REFERENCES diagnoses(id) ON DELETE SET NULL;

CREATE INDEX medications_diagnosis_idx
  ON medications(diagnosis_id);

-- 5. Data fix: Asha Sharma is Hindi-native per CLAUDE.md persona.
UPDATE patients
SET preferred_language = 'hi'
WHERE full_name = 'Asha Sharma';

COMMIT;
