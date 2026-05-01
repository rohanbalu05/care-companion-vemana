-- 003 seed demo cohort
-- Synthetic demonstration patient (Asha Sharma) with a clinically realistic
-- 14-day decline trajectory: stable for the first stretch, two missed
-- antihypertensive doses on days -8/-7, BP rebound from day -8 onward,
-- glucose excursion on day -3, symptoms emerging from day -8, culminating
-- in a multi-factor pattern flagged on day -1.

-- Phase 1 schema for guardians did not include an address column;
-- Phase 3 spec asks us to store the guardian's implied city. Additive
-- column add (nullable, no default) is safe to apply over existing data.
alter table public.guardians add column if not exists address text;

do $$
declare
    v_clinic            uuid;
    v_clinician         uuid;
    v_patient           uuid;
    v_diag_t2dm         uuid;
    v_diag_htn          uuid;
    v_med_amlo          uuid;
    v_med_met           uuid;

    -- Vital ids (captured for risk_event data_point_refs)
    v_bp_d13 uuid;  v_fbg_d13 uuid;
    v_bp_d12 uuid;
    v_bp_d11 uuid;  v_fbg_d11 uuid;
    v_bp_d10 uuid;
    v_bp_d9  uuid;
    v_bp_d7  uuid;
    v_bp_d6  uuid;  v_fbg_d6  uuid;
    v_bp_d5  uuid;
    v_bp_d4  uuid;
    v_bp_d3  uuid;  v_ppbg_d3 uuid;
    v_bp_d2  uuid;  v_fbg_d2  uuid;
    v_bp_d1  uuid;

    -- Symptom ids (captured for risk_event data_point_refs)
    v_sym_d12 uuid;
    v_sym_d10 uuid;
    v_sym_d8  uuid;
    v_sym_d5  uuid;
    v_sym_d4  uuid;
    v_sym_d3  uuid;
    v_sym_d2  uuid;

    -- Adherence ids for the two missed amlodipine doses
    v_amlo_missed_d8 uuid;
    v_amlo_missed_d7 uuid;

    -- Risk event ids
    v_risk_adh     uuid;
    v_risk_bp      uuid;
    v_risk_glucose uuid;
    v_risk_multi   uuid;

    -- Wellness loop locals
    i                 int;
    v_date            date;
    v_window_start    date;
    v_adh_taken       int;
    v_adh_total       int;
    v_vit_in_range    int;
    v_vit_total       int;
    v_engagement_days int;
    v_moderate        int;
    v_severe          int;
    v_sub_adh         int;
    v_sub_vit         int;
    v_sub_eng         int;
    v_sub_sym         int;
    v_total           int;
begin
    ----------------------------------------------------------------
    -- 1. Clinic
    ----------------------------------------------------------------
    insert into clinics (name, city, state, email)
    values ('Sanjeevani Clinic', 'Mysuru', 'Karnataka', 'admin@sanjeevani.example')
    returning id into v_clinic;

    ----------------------------------------------------------------
    -- 2. Clinician (auth_user_id null until Supabase Auth wired)
    ----------------------------------------------------------------
    insert into clinicians (clinic_id, full_name, email, role, specialty)
    values (
        v_clinic,
        'Dr. Priya Mehta',
        'priya.mehta@sanjeevani.example',
        'doctor',
        'Internal Medicine'
    )
    returning id into v_clinician;

    ----------------------------------------------------------------
    -- 3. Patient
    ----------------------------------------------------------------
    insert into patients (
        clinic_id, full_name, dob, sex, city, preferred_language,
        height_cm, weight_kg, allergies, family_history,
        telegram_chat_id, enrolled_by_clinician_id, enrolled_at
    )
    values (
        v_clinic,
        'Asha Sharma',
        date '1963-08-15',
        'female',
        'Mysuru',
        'en',
        158, 68,
        array['sulfa']::text[],
        'Father — stroke at 71. No known maternal cardiovascular history.',
        'demo_patient_asha',
        v_clinician,
        now() - interval '90 days'
    )
    returning id into v_patient;

    ----------------------------------------------------------------
    -- 4. Guardian
    ----------------------------------------------------------------
    insert into guardians (
        patient_id, full_name, relationship, address, notify_on_non_response
    )
    values (v_patient, 'Rohan Sharma', 'son', 'Bangalore', true);

    ----------------------------------------------------------------
    -- 5. Diagnoses
    ----------------------------------------------------------------
    insert into diagnoses (patient_id, condition, icd10_code, diagnosed_on, baseline_values, notes)
    values (
        v_patient,
        'Type 2 Diabetes Mellitus',
        'E11',
        (current_date - interval '4 years')::date,
        '{"hba1c": 7.4, "fbg": 140}'::jsonb,
        'Diet-controlled initially; metformin added at year 2.'
    )
    returning id into v_diag_t2dm;

    insert into diagnoses (patient_id, condition, icd10_code, diagnosed_on, baseline_values, notes)
    values (
        v_patient,
        'Essential Hypertension',
        'I10',
        (current_date - interval '2 years')::date,
        '{"bp_sys": 138, "bp_dia": 86}'::jsonb,
        'Stage 1 HTN at diagnosis; started on amlodipine 5mg OD.'
    )
    returning id into v_diag_htn;

    ----------------------------------------------------------------
    -- 6. Medications
    ----------------------------------------------------------------
    insert into medications (
        patient_id, drug_name, generic_name, dose_amount, dose_unit, frequency,
        instructions, prescribed_by_clinician_id, prescribed_on, start_date, status
    )
    values (
        v_patient, 'Amlodipine', 'amlodipine besylate', 5, 'mg', 'OD',
        'Take once daily in the morning, with or without food.',
        v_clinician,
        (current_date - 14),
        (current_date - 14),
        'active'
    )
    returning id into v_med_amlo;

    insert into medications (
        patient_id, drug_name, generic_name, dose_amount, dose_unit, frequency,
        instructions, prescribed_by_clinician_id, prescribed_on, start_date, status
    )
    values (
        v_patient, 'Metformin', 'metformin hydrochloride', 500, 'mg', 'BD',
        'Take twice daily with meals (breakfast and dinner).',
        v_clinician,
        (current_date - 14),
        (current_date - 14),
        'active'
    )
    returning id into v_med_met;

    ----------------------------------------------------------------
    -- 7. Vitals (12 BP + 4 FBG + 1 PPBG = 17 readings)
    -- Source: photo for BP cuff readings and glucometer photos.
    ----------------------------------------------------------------
    -- Day -13
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 138, 85, 'mmHg', 'photo',
            ((current_date - 13)::timestamp + interval '8 hours 10 minutes')::timestamptz)
    returning id into v_bp_d13;
    insert into vitals (patient_id, vital_type, value_numeric, unit, source, recorded_at)
    values (v_patient, 'glucose_fasting', 142, 'mg/dL', 'photo',
            ((current_date - 13)::timestamp + interval '7 hours 30 minutes')::timestamptz)
    returning id into v_fbg_d13;

    -- Day -12
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 136, 84, 'mmHg', 'photo',
            ((current_date - 12)::timestamp + interval '8 hours 15 minutes')::timestamptz)
    returning id into v_bp_d12;

    -- Day -11
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 140, 86, 'mmHg', 'photo',
            ((current_date - 11)::timestamp + interval '8 hours 8 minutes')::timestamptz)
    returning id into v_bp_d11;
    insert into vitals (patient_id, vital_type, value_numeric, unit, source, recorded_at)
    values (v_patient, 'glucose_fasting', 138, 'mg/dL', 'photo',
            ((current_date - 11)::timestamp + interval '7 hours 25 minutes')::timestamptz)
    returning id into v_fbg_d11;

    -- Day -10
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 137, 85, 'mmHg', 'photo',
            ((current_date - 10)::timestamp + interval '8 hours 20 minutes')::timestamptz)
    returning id into v_bp_d10;

    -- Day -9
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 142, 87, 'mmHg', 'photo',
            ((current_date - 9)::timestamp + interval '8 hours 14 minutes')::timestamptz)
    returning id into v_bp_d9;

    -- Day -8 (no vitals)
    -- Day -7
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 146, 89, 'mmHg', 'photo',
            ((current_date - 7)::timestamp + interval '8 hours 30 minutes')::timestamptz)
    returning id into v_bp_d7;

    -- Day -6
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 148, 91, 'mmHg', 'photo',
            ((current_date - 6)::timestamp + interval '8 hours 12 minutes')::timestamptz)
    returning id into v_bp_d6;
    insert into vitals (patient_id, vital_type, value_numeric, unit, source, recorded_at)
    values (v_patient, 'glucose_fasting', 155, 'mg/dL', 'photo',
            ((current_date - 6)::timestamp + interval '7 hours 30 minutes')::timestamptz)
    returning id into v_fbg_d6;

    -- Day -5
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 149, 92, 'mmHg', 'photo',
            ((current_date - 5)::timestamp + interval '8 hours 18 minutes')::timestamptz)
    returning id into v_bp_d5;

    -- Day -4
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 152, 94, 'mmHg', 'photo',
            ((current_date - 4)::timestamp + interval '8 hours 10 minutes')::timestamptz)
    returning id into v_bp_d4;

    -- Day -3
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 156, 96, 'mmHg', 'photo',
            ((current_date - 3)::timestamp + interval '8 hours 25 minutes')::timestamptz)
    returning id into v_bp_d3;
    insert into vitals (patient_id, vital_type, value_numeric, unit, source, recorded_at, notes)
    values (v_patient, 'glucose_postprandial', 218, 'mg/dL', 'photo',
            ((current_date - 3)::timestamp + interval '14 hours 30 minutes')::timestamptz,
            'Post-lunch reading; lunch was heavy carbohydrate intake.')
    returning id into v_ppbg_d3;

    -- Day -2
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 158, 97, 'mmHg', 'photo',
            ((current_date - 2)::timestamp + interval '8 hours 15 minutes')::timestamptz)
    returning id into v_bp_d2;
    insert into vitals (patient_id, vital_type, value_numeric, unit, source, recorded_at)
    values (v_patient, 'glucose_fasting', 168, 'mg/dL', 'photo',
            ((current_date - 2)::timestamp + interval '7 hours 35 minutes')::timestamptz)
    returning id into v_fbg_d2;

    -- Day -1
    insert into vitals (patient_id, vital_type, value_systolic, value_diastolic, unit, source, recorded_at)
    values (v_patient, 'bp', 160, 100, 'mmHg', 'photo',
            ((current_date - 1)::timestamp + interval '8 hours 20 minutes')::timestamptz)
    returning id into v_bp_d1;

    ----------------------------------------------------------------
    -- 8. Adherence events (14 days x 3 doses = 42 rows)
    -- Amlodipine OD scheduled at 08:00, Metformin BD at 08:30 and 20:30.
    -- Days -8 and -7 have a missed amlodipine; day -9 amlodipine taken late.
    -- Day 0 (today) doses are status='scheduled' (not yet due/confirmed).
    ----------------------------------------------------------------
    -- Days -13 through -10: all taken on time
    insert into adherence_events (patient_id, medication_id, scheduled_at, status, taken_at, source)
    select v_patient, v_med_amlo,
           ((current_date - d)::timestamp + interval '8 hours')::timestamptz,
           'taken',
           ((current_date - d)::timestamp + interval '8 hours')::timestamptz,
           'patient_confirmed'
    from generate_series(10, 13) as d;

    -- Day -9: amlodipine taken late (09:45)
    insert into adherence_events (patient_id, medication_id, scheduled_at, status, taken_at, source, notes)
    values (v_patient, v_med_amlo,
            ((current_date - 9)::timestamp + interval '8 hours')::timestamptz,
            'late',
            ((current_date - 9)::timestamp + interval '9 hours 45 minutes')::timestamptz,
            'patient_confirmed',
            'Patient confirmed via voice that she got busy and took it late.');

    -- Day -8 and -7: amlodipine missed (auto-inferred from no confirmation by deadline)
    insert into adherence_events (patient_id, medication_id, scheduled_at, status, source, notes)
    values (v_patient, v_med_amlo,
            ((current_date - 8)::timestamp + interval '8 hours')::timestamptz,
            'missed', 'auto_inferred',
            'No patient confirmation by 12:00; auto-marked missed.')
    returning id into v_amlo_missed_d8;

    insert into adherence_events (patient_id, medication_id, scheduled_at, status, source, notes)
    values (v_patient, v_med_amlo,
            ((current_date - 7)::timestamp + interval '8 hours')::timestamptz,
            'missed', 'auto_inferred',
            'Second consecutive missed dose; auto-marked.')
    returning id into v_amlo_missed_d7;

    -- Days -6 through -1: amlodipine taken on time (rebound period, but compliant again)
    insert into adherence_events (patient_id, medication_id, scheduled_at, status, taken_at, source)
    select v_patient, v_med_amlo,
           ((current_date - d)::timestamp + interval '8 hours')::timestamptz,
           'taken',
           ((current_date - d)::timestamp + interval '8 hours')::timestamptz,
           'patient_confirmed'
    from generate_series(1, 6) as d;

    -- Day 0 amlodipine: scheduled (not yet due/confirmed)
    insert into adherence_events (patient_id, medication_id, scheduled_at, status)
    values (v_patient, v_med_amlo,
            (current_date::timestamp + interval '8 hours')::timestamptz,
            'scheduled');

    -- Metformin: morning dose for days -13 through -1 (all taken)
    insert into adherence_events (patient_id, medication_id, scheduled_at, status, taken_at, source)
    select v_patient, v_med_met,
           ((current_date - d)::timestamp + interval '8 hours 30 minutes')::timestamptz,
           'taken',
           ((current_date - d)::timestamp + interval '8 hours 30 minutes')::timestamptz,
           'patient_confirmed'
    from generate_series(1, 13) as d;

    -- Metformin morning dose day 0: scheduled
    insert into adherence_events (patient_id, medication_id, scheduled_at, status)
    values (v_patient, v_med_met,
            (current_date::timestamp + interval '8 hours 30 minutes')::timestamptz,
            'scheduled');

    -- Metformin: evening dose for days -13 through -1 (all taken)
    insert into adherence_events (patient_id, medication_id, scheduled_at, status, taken_at, source)
    select v_patient, v_med_met,
           ((current_date - d)::timestamp + interval '20 hours 30 minutes')::timestamptz,
           'taken',
           ((current_date - d)::timestamp + interval '20 hours 30 minutes')::timestamptz,
           'patient_confirmed'
    from generate_series(1, 13) as d;

    -- Metformin evening dose day 0: scheduled
    insert into adherence_events (patient_id, medication_id, scheduled_at, status)
    values (v_patient, v_med_met,
            (current_date::timestamp + interval '20 hours 30 minutes')::timestamptz,
            'scheduled');

    ----------------------------------------------------------------
    -- 9. Symptoms (7 entries)
    -- Non-English entries arrive via voice transcription; English text via the
    -- text channel. symptom_text_normalized is the English version that
    -- downstream rules consume.
    ----------------------------------------------------------------
    insert into symptoms (
        patient_id, symptom_text_raw, symptom_text_normalized,
        language_detected, severity, source, recorded_at
    )
    values (
        v_patient, 'fine, slept well', 'fine, slept well',
        'en', 'mild', 'text',
        ((current_date - 12)::timestamp + interval '9 hours')::timestamptz
    )
    returning id into v_sym_d12;

    insert into symptoms (
        patient_id, symptom_text_raw, symptom_text_normalized,
        language_detected, severity, source, recorded_at
    )
    values (
        v_patient, 'ठीक हूँ, बस थोड़ी थकान', 'fine, slight fatigue',
        'hi', 'mild', 'voice',
        ((current_date - 10)::timestamp + interval '9 hours 10 minutes')::timestamptz
    )
    returning id into v_sym_d10;

    insert into symptoms (
        patient_id, symptom_text_raw, symptom_text_normalized,
        language_detected, severity, source, recorded_at
    )
    values (
        v_patient, 'भूल गयी', 'forgot to take medication',
        'hi', 'mild', 'voice',
        ((current_date - 8)::timestamp + interval '12 hours')::timestamptz
    )
    returning id into v_sym_d8;

    insert into symptoms (
        patient_id, symptom_text_raw, symptom_text_normalized,
        language_detected, severity, source, recorded_at
    )
    values (
        v_patient, 'ತಲೆ ಭಾರವಾಗಿದೆ', 'head feels heavy',
        'kn', 'moderate', 'voice',
        ((current_date - 5)::timestamp + interval '10 hours 30 minutes')::timestamptz
    )
    returning id into v_sym_d5;

    insert into symptoms (
        patient_id, symptom_text_raw, symptom_text_normalized,
        language_detected, severity, source, recorded_at
    )
    values (
        v_patient,
        'neighbor''s wedding, ate a lot',
        'attended a wedding, ate large/salty meal -- lifestyle trigger flagged',
        'hi', 'mild', 'voice',
        ((current_date - 4)::timestamp + interval '21 hours')::timestamptz
    )
    returning id into v_sym_d4;

    insert into symptoms (
        patient_id, symptom_text_raw, symptom_text_normalized,
        language_detected, severity, source, recorded_at
    )
    values (
        v_patient, 'ಭಾರಿ ಸುಸ್ತು', 'very tired',
        'kn', 'moderate', 'voice',
        ((current_date - 3)::timestamp + interval '15 hours')::timestamptz
    )
    returning id into v_sym_d3;

    insert into symptoms (
        patient_id, symptom_text_raw, symptom_text_normalized,
        language_detected, severity, source, recorded_at
    )
    values (
        v_patient, 'thoda ghabrahat', 'some restlessness/anxiety',
        'hi', 'moderate', 'voice',
        ((current_date - 2)::timestamp + interval '11 hours')::timestamptz
    )
    returning id into v_sym_d2;

    ----------------------------------------------------------------
    -- 10. Risk events (4 fired rules)
    ----------------------------------------------------------------
    -- (a) Adherence gap (fired on day -7, after the second consecutive miss)
    insert into risk_events (
        patient_id, event_type, severity, score_delta, rule_fired,
        data_point_refs, narrative_text, guideline_citation, detected_at
    )
    values (
        v_patient, 'adherence_gap_critical', 'high', 20,
        'consecutive_missed_antihypertensive',
        jsonb_build_array(
            jsonb_build_object('table', 'adherence_events', 'id', v_amlo_missed_d8),
            jsonb_build_object('table', 'adherence_events', 'id', v_amlo_missed_d7)
        ),
        'Asha has missed two consecutive amlodipine 5mg doses (day -8 and day -7). '
        || 'Antihypertensive non-adherence in a T2DM-HTN comorbid patient sharply '
        || 'increases short-term risk of BP rebound and end-organ stress.',
        'RSSDI 2022 §8.4 — antihypertensive adherence in T2DM comorbidity',
        ((current_date - 7)::timestamp + interval '12 hours')::timestamptz
    )
    returning id into v_risk_adh;

    -- (b) BP threshold breach (fired on day -3)
    insert into risk_events (
        patient_id, event_type, severity, score_delta, rule_fired,
        data_point_refs, narrative_text, guideline_citation, detected_at
    )
    values (
        v_patient, 'bp_threshold_breach', 'high', 25,
        'bp_sustained_above_140',
        jsonb_build_array(
            jsonb_build_object('table', 'vitals', 'id', v_bp_d6),
            jsonb_build_object('table', 'vitals', 'id', v_bp_d5),
            jsonb_build_object('table', 'vitals', 'id', v_bp_d4),
            jsonb_build_object('table', 'vitals', 'id', v_bp_d3)
        ),
        'Four consecutive morning readings (148/91, 149/92, 152/94, 156/96) all '
        || 'breach the 140/90 systolic/diastolic threshold. Sustained elevation '
        || 'over four days in a diabetic patient is grade 1 hypertensive escalation '
        || 'warranting same-week clinical review.',
        'ICMR-NCD HTN Protocol §3.2',
        ((current_date - 3)::timestamp + interval '9 hours')::timestamptz
    )
    returning id into v_risk_bp;

    -- (c) Glucose excursion (PPBG 218 on day -3)
    insert into risk_events (
        patient_id, event_type, severity, score_delta, rule_fired,
        data_point_refs, narrative_text, guideline_citation, detected_at
    )
    values (
        v_patient, 'glucose_excursion', 'medium', 15,
        'ppbg_above_200',
        jsonb_build_array(
            jsonb_build_object('table', 'vitals', 'id', v_ppbg_d3)
        ),
        'Post-prandial glucose of 218 mg/dL on day -3 is above the 180 mg/dL target. '
        || 'Patient self-reported a heavy carbohydrate lunch the same day, suggesting '
        || 'a lifestyle-driven excursion rather than an underlying control change.',
        'RSSDI 2022 §5.1 — postprandial glucose targets',
        ((current_date - 3)::timestamp + interval '14 hours 35 minutes')::timestamptz
    )
    returning id into v_risk_glucose;

    -- (d) Multi-factor pattern (fired on day -1)
    insert into risk_events (
        patient_id, event_type, severity, score_delta, rule_fired,
        data_point_refs, narrative_text, guideline_citation, detected_at
    )
    values (
        v_patient, 'multi_factor_pattern', 'critical', 35,
        'compound_decline',
        jsonb_build_array(
            jsonb_build_object('table', 'adherence_events', 'id', v_amlo_missed_d8),
            jsonb_build_object('table', 'adherence_events', 'id', v_amlo_missed_d7),
            jsonb_build_object('table', 'vitals', 'id', v_bp_d6),
            jsonb_build_object('table', 'vitals', 'id', v_bp_d5),
            jsonb_build_object('table', 'vitals', 'id', v_bp_d4),
            jsonb_build_object('table', 'vitals', 'id', v_bp_d3),
            jsonb_build_object('table', 'vitals', 'id', v_bp_d2),
            jsonb_build_object('table', 'vitals', 'id', v_bp_d1),
            jsonb_build_object('table', 'vitals', 'id', v_ppbg_d3),
            jsonb_build_object('table', 'vitals', 'id', v_fbg_d2),
            jsonb_build_object('table', 'symptoms', 'id', v_sym_d4),
            jsonb_build_object('table', 'symptoms', 'id', v_sym_d3),
            jsonb_build_object('table', 'symptoms', 'id', v_sym_d2)
        ),
        'A compound decline pattern is now visible. Two missed amlodipine doses on '
        || 'days -8 and -7 were followed by sustained BP rebound (148/91 → 160/100 '
        || 'over the past six days). A dietary trigger (wedding meal, day -4) '
        || 'preceded a postprandial glucose excursion (218 mg/dL, day -3) and a '
        || 'subsequent fasting glucose drift (168 mg/dL, day -2). The patient is '
        || 'reporting moderate fatigue and restlessness. This is the classic '
        || 'adherence-lapse → BP-rebound → metabolic-stress sequence; without '
        || 'intervention a hypertensive urgency or hyperglycaemic event is plausible '
        || 'within the next 7 days.',
        'RSSDI 2022 §8 + ICMR-NCD HTN §3',
        ((current_date - 1)::timestamp + interval '9 hours')::timestamptz
    )
    returning id into v_risk_multi;

    ----------------------------------------------------------------
    -- 11. Pending intervention (triggered by the multi-factor pattern)
    ----------------------------------------------------------------
    insert into interventions (
        patient_id, triggered_by_risk_event_id,
        recommendation_text, citation, clinical_reasoning, status
    )
    values (
        v_patient, v_risk_multi,
        'Send Asha-ji a same-day Telegram check-in: confirm she has amlodipine in '
        || 'stock, ask about salt intake at the recent wedding meal, and schedule a '
        || 'video review for tomorrow morning if BP > 150 again.',
        'RSSDI 2022 §8.4, ICMR-NCD HTN Protocol §3.2',
        'The two missed amlodipine doses on days -8/-7 plausibly initiated the BP '
        || 'rebound now sustained above 150/95. The dietary trigger on day -4 '
        || 'overlaid an additional metabolic stressor, evidenced by the day -3 PPBG '
        || 'spike and day -2 fasting drift. Confirming amlodipine availability and '
        || 'salt-intake context resolves the two most-likely modifiable causes '
        || 'before escalating to a medication change.',
        'pending_review'
    );

    ----------------------------------------------------------------
    -- 12. Wellness scores (14 daily rows: today and previous 13 days)
    -- Window for day d is the preceding 7 days (d-6 .. d, inclusive).
    -- Sub-scores use the formula in the spec; floor() for integer scores.
    ----------------------------------------------------------------
    for i in 0..13 loop
        v_date := current_date - i;
        v_window_start := v_date - 6;

        -- Adherence: numerator = taken; denominator = events with non-scheduled status
        select
            count(*) filter (where status = 'taken'),
            count(*) filter (where status in ('taken','missed','late'))
        into v_adh_taken, v_adh_total
        from adherence_events
        where patient_id = v_patient
          and (scheduled_at at time zone 'UTC')::date between v_window_start and v_date;

        -- Vitals: in-range = BP <140/90, FBG <130, PPBG/random <180
        select
            count(*) filter (where
                (vital_type = 'bp' and value_systolic < 140 and value_diastolic < 90)
                or (vital_type = 'glucose_fasting' and value_numeric < 130)
                or (vital_type in ('glucose_postprandial','glucose_random') and value_numeric < 180)
            ),
            count(*) filter (where vital_type in (
                'bp','glucose_fasting','glucose_postprandial','glucose_random'
            ))
        into v_vit_in_range, v_vit_total
        from vitals
        where patient_id = v_patient
          and (recorded_at at time zone 'UTC')::date between v_window_start and v_date;

        -- Engagement: distinct days in window with any patient input
        -- (a confirmed dose, a vital reading, or a reported symptom)
        select count(distinct event_date) into v_engagement_days
        from (
            select (recorded_at at time zone 'UTC')::date as event_date
              from vitals
             where patient_id = v_patient
               and (recorded_at at time zone 'UTC')::date between v_window_start and v_date
            union
            select (scheduled_at at time zone 'UTC')::date
              from adherence_events
             where patient_id = v_patient
               and status in ('taken','late')
               and (scheduled_at at time zone 'UTC')::date between v_window_start and v_date
            union
            select (recorded_at at time zone 'UTC')::date
              from symptoms
             where patient_id = v_patient
               and (recorded_at at time zone 'UTC')::date between v_window_start and v_date
        ) e;

        -- Symptom severity counts in window
        select
            count(*) filter (where severity = 'moderate'),
            count(*) filter (where severity = 'severe')
        into v_moderate, v_severe
        from symptoms
        where patient_id = v_patient
          and (recorded_at at time zone 'UTC')::date between v_window_start and v_date;

        v_sub_adh := case when v_adh_total > 0
                          then floor(35.0 * v_adh_taken / v_adh_total)::int
                          else 0 end;
        v_sub_vit := case when v_vit_total > 0
                          then floor(35.0 * v_vit_in_range / v_vit_total)::int
                          else 0 end;
        v_sub_eng := floor(20.0 * v_engagement_days / 7.0)::int;
        v_sub_sym := greatest(0, 10 - (2 * v_moderate + 4 * v_severe));
        v_total   := least(100, greatest(0, v_sub_adh + v_sub_vit + v_sub_eng + v_sub_sym));

        insert into wellness_scores (
            patient_id, score, sub_score_adherence, sub_score_vitals,
            sub_score_engagement, sub_score_symptom, calculation_breakdown,
            calculated_for_date
        )
        values (
            v_patient, v_total, v_sub_adh, v_sub_vit, v_sub_eng, v_sub_sym,
            jsonb_build_object(
                'window_start', v_window_start,
                'window_end',   v_date,
                'adherence',    jsonb_build_object('taken', v_adh_taken, 'total', v_adh_total),
                'vitals',       jsonb_build_object('in_range', v_vit_in_range, 'total', v_vit_total),
                'engagement',   jsonb_build_object('days_with_input', v_engagement_days, 'window_days', 7),
                'symptoms',     jsonb_build_object('moderate', v_moderate, 'severe', v_severe)
            ),
            v_date
        );
    end loop;
end $$;
