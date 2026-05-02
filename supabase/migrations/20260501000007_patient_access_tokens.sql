-- Migration: 007 - patient + guardian dashboard access tokens
--
-- Adds stable, share-via-link access tokens for the patient and guardian
-- web dashboards. These are NOT the Telegram link tokens (single-use),
-- and NOT auth.users sessions; they're long-lived URL-shareable IDs the
-- clinic hands out so patients/guardians can open their own view without
-- needing to log in. Server-side (/api/dashboard-data) resolves token
-- to patient_id and uses service_role to scope the response payload.

BEGIN;

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS access_token text UNIQUE;

ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS access_token text UNIQUE;

UPDATE patients
SET access_token = 'demo-asha-2026'
WHERE full_name = 'Asha Sharma' AND access_token IS NULL;

INSERT INTO guardians (patient_id, full_name, phone, relationship, notify_on_non_response, access_token)
SELECT p.id, 'Rohan Sharma', '+91 98870 12345', 'son', true, 'demo-rohan-2026'
FROM patients p
WHERE p.full_name = 'Asha Sharma'
  AND NOT EXISTS (SELECT 1 FROM guardians g WHERE g.patient_id = p.id AND g.full_name = 'Rohan Sharma');

UPDATE guardians g
SET access_token = 'demo-rohan-2026'
FROM patients p
WHERE g.patient_id = p.id
  AND p.full_name = 'Asha Sharma'
  AND g.access_token IS NULL;

COMMIT;
