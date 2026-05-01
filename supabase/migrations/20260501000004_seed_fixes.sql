-- 004 seed fixes
-- Audit on 2026-05-01 found three drifts in the demo seed against CLAUDE.md.
-- All fixes are surgical UPDATEs; no schema changes.
--
--   Fix 1: wellness_scores trajectory was flat (64..55) but the demo's hero
--          metric needs the locked high-80s -> low-60s decline. 14 rows updated
--          with re-derived sub-scores summing exactly to the new totals and a
--          fresh calculation_breakdown jsonb.
--   Fix 2: day -9 (2026-04-22) had amlodipine flagged 'late' and metformin
--          clean. CLAUDE.md §4 puts the wobble on metformin. Amlodipine flips
--          to 'taken' at scheduled_at; metformin morning dose flips to 'late'
--          at scheduled_at + 90 min.
--   Fix 3: guardians.phone was null for Rohan Sharma -- non-response alert
--          routing needs a number.

do $$
declare
    v_patient        uuid;
    v_amlo           uuid;
    v_met            uuid;
    v_met_morning_ts timestamptz;
begin
    select id into v_patient
    from public.patients
    where full_name = 'Asha Sharma'
    limit 1;

    if v_patient is null then
        raise exception '004_seed_fixes: Asha Sharma not found; aborting';
    end if;

    select id into v_amlo
    from public.medications
    where patient_id = v_patient and drug_name = 'Amlodipine'
    limit 1;

    select id into v_met
    from public.medications
    where patient_id = v_patient and drug_name = 'Metformin'
    limit 1;

    ----------------------------------------------------------------
    -- Fix 2: day -9 adherence flip (2026-04-22)
    ----------------------------------------------------------------
    update public.adherence_events
    set status   = 'taken',
        taken_at = scheduled_at,
        source   = 'patient_confirmed'
    where patient_id    = v_patient
      and medication_id = v_amlo
      and scheduled_at::date = date '2026-04-22';

    select scheduled_at into v_met_morning_ts
    from public.adherence_events
    where patient_id    = v_patient
      and medication_id = v_met
      and scheduled_at::date = date '2026-04-22'
    order by scheduled_at
    limit 1;

    update public.adherence_events
    set status   = 'late',
        taken_at = scheduled_at + interval '90 minutes',
        source   = 'patient_confirmed'
    where patient_id    = v_patient
      and medication_id = v_met
      and scheduled_at  = v_met_morning_ts;

    ----------------------------------------------------------------
    -- Fix 3: Guardian phone
    ----------------------------------------------------------------
    update public.guardians
    set phone = '+91 98450 12345'
    where patient_id = v_patient
      and full_name  = 'Rohan Sharma';

    ----------------------------------------------------------------
    -- Fix 1: Wellness trajectory
    -- Single UPDATE..FROM(VALUES) rewrites the whole 14-day curve.
    -- Columns: d, score, adh, vit, eng, sym, adh_pct, vit_pct,
    --          eng_n (checkins/window), sym_mod, sym_sev, note
    ----------------------------------------------------------------
    update public.wellness_scores w
    set score                 = v.score,
        sub_score_adherence   = v.adh,
        sub_score_vitals      = v.vit,
        sub_score_engagement  = v.eng,
        sub_score_symptom     = v.sym,
        calculation_breakdown = jsonb_build_object(
            'components', jsonb_build_object(
                'adherence',       jsonb_build_object('score', v.adh, 'max', 35, 'window_days', 7,  'rate_pct', v.adh_pct),
                'vitals_in_range', jsonb_build_object('score', v.vit, 'max', 35, 'window_days', 7,  'rate_pct', v.vit_pct,
                                                      'thresholds', jsonb_build_object('bp','<140/90','fbg','<130','ppbg','<180')),
                'engagement',      jsonb_build_object('score', v.eng, 'max', 20, 'window_days', 7,  'checkins', v.eng_n),
                'symptom_load',    jsonb_build_object('score', v.sym, 'max', 10, 'window_hours', 72,'moderate_count', v.sym_mod, 'severe_count', v.sym_sev)
            ),
            'total', v.score,
            'note',  v.note
        )
    from (values
        (date '2026-04-18', 88, 33, 33, 18, 4,  94, 50,  1, 0, 0, 'baseline; FBG above 130'),
        (date '2026-04-19', 87, 33, 32, 18, 4,  94, 67,  2, 0, 0, 'BP/FBG mostly in range'),
        (date '2026-04-20', 85, 33, 30, 18, 4,  94, 60,  3, 0, 0, 'BP nudging 140/86; FBG 138 above'),
        (date '2026-04-21', 83, 32, 29, 18, 4,  90, 57,  4, 0, 0, 'fatigue noted; vitals stable'),
        (date '2026-04-22', 80, 30, 28, 18, 4,  86, 50,  5, 0, 0, 'metformin morning late; BP 142/87 above'),
        (date '2026-04-23', 73, 25, 26, 18, 4,  76, 50,  5, 0, 0, 'missed amlodipine #1'),
        (date '2026-04-24', 68, 20, 24, 20, 4,  62, 50,  6, 0, 0, 'missed amlodipine #2; BP 146/89; adherence rule fires'),
        (date '2026-04-25', 71, 22, 22, 20, 7,  67, 40,  7, 0, 0, 'resumes; BP 148/91 + FBG 155 out'),
        (date '2026-04-26', 69, 24, 21, 20, 4,  71, 40,  7, 1, 0, 'first KN moderate symptom -- head heavy'),
        (date '2026-04-27', 67, 26, 19, 18, 4,  76, 33,  6, 1, 0, 'wedding meal lifestyle trigger'),
        (date '2026-04-28', 64, 28, 14, 19, 3,  81, 25,  7, 2, 0, 'glucose excursion PPBG 218 + KN very tired'),
        (date '2026-04-29', 62, 30, 12, 18, 2,  86, 20,  6, 2, 0, 'FBG 168, BP 158/97; ghabrahat'),
        (date '2026-04-30', 60, 32, 8,  18, 2,  90, 14,  6, 2, 0, 'BP 160/100 -- threshold breach'),
        (date '2026-05-01', 59, 33, 6,  18, 2,  94, 10,  6, 2, 0, 'demo day; intervention pending review')
    ) as v(d, score, adh, vit, eng, sym, adh_pct, vit_pct, eng_n, sym_mod, sym_sev, note)
    where w.patient_id          = v_patient
      and w.calculated_for_date = v.d;
end $$;
