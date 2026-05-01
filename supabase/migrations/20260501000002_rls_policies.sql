-- 002 row level security
-- Three principal classes of authenticated users:
--   1. Clinicians  -- linked via clinicians.auth_user_id = auth.uid()
--   2. Patients    -- linked via the JWT claim 'patient_id' (set by the
--                     bot/edge function when minting a patient session token).
--                     Patients have no Supabase Auth account in the hackathon
--                     build -- they interact via Telegram -- so we use a JWT
--                     claim rather than a column on the patients table.
--   3. Guardians   -- linked via guardians.auth_user_id = auth.uid()
-- The service_role key bypasses RLS automatically and is what n8n flows use.

------------------------------------------------------------------------
-- Helper functions
-- All membership-resolving helpers are SECURITY DEFINER so they bypass
-- RLS during the lookup (otherwise we'd recurse: a policy on patients
-- calls a function that reads clinicians, which has its own policy, etc.).
-- search_path is pinned to public to defend against search-path injection.
-- auth_patient_id() does not need SECURITY DEFINER -- it reads only the
-- caller's own JWT.
------------------------------------------------------------------------

create or replace function public.auth_clinician_clinic_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
    select clinic_id
    from public.clinicians
    where auth_user_id = auth.uid()
    limit 1;
$$;

create or replace function public.auth_clinician_owns_patient(p_patient_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select exists (
        select 1 from public.patients
        where id = p_patient_id
          and clinic_id = public.auth_clinician_clinic_id()
    );
$$;

create or replace function public.auth_guardian_can_view_patient(p_patient_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select exists (
        select 1 from public.guardians
        where patient_id = p_patient_id
          and auth_user_id = auth.uid()
    );
$$;

create or replace function public.auth_patient_id()
returns uuid
language sql
stable
as $$
    select nullif(auth.jwt() ->> 'patient_id', '')::uuid;
$$;

-- Polymorphic target -> clinic resolver for audit_log reads.
-- Walks the target row back to its owning clinic so a clinician only sees
-- audit entries that touched their clinic's data. Returns false for
-- unknown target_table values, so adding a new table later requires
-- explicitly extending this function (fail-closed).
create or replace function public.audit_log_target_in_caller_clinic(
    p_target_table text,
    p_target_id uuid
)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
    v_clinic uuid := public.auth_clinician_clinic_id();
begin
    if v_clinic is null then
        return false;
    end if;

    case p_target_table
        when 'clinics' then
            return p_target_id = v_clinic;
        when 'clinicians' then
            return exists (
                select 1 from public.clinicians
                where id = p_target_id and clinic_id = v_clinic
            );
        when 'patients' then
            return exists (
                select 1 from public.patients
                where id = p_target_id and clinic_id = v_clinic
            );
        when 'guardians' then
            return exists (
                select 1 from public.guardians g
                join public.patients p on p.id = g.patient_id
                where g.id = p_target_id and p.clinic_id = v_clinic
            );
        when 'diagnoses' then
            return exists (
                select 1 from public.diagnoses x
                join public.patients p on p.id = x.patient_id
                where x.id = p_target_id and p.clinic_id = v_clinic
            );
        when 'prescriptions' then
            return exists (
                select 1 from public.prescriptions x
                join public.patients p on p.id = x.patient_id
                where x.id = p_target_id and p.clinic_id = v_clinic
            );
        when 'medications' then
            return exists (
                select 1 from public.medications x
                join public.patients p on p.id = x.patient_id
                where x.id = p_target_id and p.clinic_id = v_clinic
            );
        when 'vitals' then
            return exists (
                select 1 from public.vitals x
                join public.patients p on p.id = x.patient_id
                where x.id = p_target_id and p.clinic_id = v_clinic
            );
        when 'adherence_events' then
            return exists (
                select 1 from public.adherence_events x
                join public.patients p on p.id = x.patient_id
                where x.id = p_target_id and p.clinic_id = v_clinic
            );
        when 'symptoms' then
            return exists (
                select 1 from public.symptoms x
                join public.patients p on p.id = x.patient_id
                where x.id = p_target_id and p.clinic_id = v_clinic
            );
        when 'risk_events' then
            return exists (
                select 1 from public.risk_events x
                join public.patients p on p.id = x.patient_id
                where x.id = p_target_id and p.clinic_id = v_clinic
            );
        when 'interventions' then
            return exists (
                select 1 from public.interventions x
                join public.patients p on p.id = x.patient_id
                where x.id = p_target_id and p.clinic_id = v_clinic
            );
        when 'wellness_scores' then
            return exists (
                select 1 from public.wellness_scores x
                join public.patients p on p.id = x.patient_id
                where x.id = p_target_id and p.clinic_id = v_clinic
            );
        else
            return false;
    end case;
end;
$$;

revoke all on function public.auth_clinician_clinic_id()                          from public;
revoke all on function public.auth_clinician_owns_patient(uuid)                   from public;
revoke all on function public.auth_guardian_can_view_patient(uuid)                from public;
revoke all on function public.auth_patient_id()                                   from public;
revoke all on function public.audit_log_target_in_caller_clinic(text, uuid)       from public;

grant execute on function public.auth_clinician_clinic_id()                       to authenticated;
grant execute on function public.auth_clinician_owns_patient(uuid)                to authenticated;
grant execute on function public.auth_guardian_can_view_patient(uuid)             to authenticated;
grant execute on function public.auth_patient_id()                                to authenticated;
grant execute on function public.audit_log_target_in_caller_clinic(text, uuid)    to authenticated;

------------------------------------------------------------------------
-- Enable RLS on all 14 tables
------------------------------------------------------------------------
alter table public.clinics           enable row level security;
alter table public.clinicians        enable row level security;
alter table public.patients          enable row level security;
alter table public.guardians         enable row level security;
alter table public.diagnoses         enable row level security;
alter table public.prescriptions     enable row level security;
alter table public.medications       enable row level security;
alter table public.vitals            enable row level security;
alter table public.adherence_events  enable row level security;
alter table public.symptoms          enable row level security;
alter table public.risk_events       enable row level security;
alter table public.interventions     enable row level security;
alter table public.wellness_scores   enable row level security;
alter table public.audit_log         enable row level security;

------------------------------------------------------------------------
-- 1. clinics
-- Clinicians can read/update their own clinic row only.
------------------------------------------------------------------------
create policy clinics_clinician_all on public.clinics
    for all to authenticated
    using (id = public.auth_clinician_clinic_id())
    with check (id = public.auth_clinician_clinic_id());

------------------------------------------------------------------------
-- 2. clinicians
-- Clinicians can read/write rows for colleagues in the same clinic
-- (covers admin onboarding of nurses/doctors).
------------------------------------------------------------------------
create policy clinicians_same_clinic_all on public.clinicians
    for all to authenticated
    using (clinic_id = public.auth_clinician_clinic_id())
    with check (clinic_id = public.auth_clinician_clinic_id());

------------------------------------------------------------------------
-- 3. patients
------------------------------------------------------------------------
create policy patients_clinician_all on public.patients
    for all to authenticated
    using (clinic_id = public.auth_clinician_clinic_id())
    with check (clinic_id = public.auth_clinician_clinic_id());

create policy patients_self_read on public.patients
    for select to authenticated
    using (id = public.auth_patient_id());

create policy patients_guardian_read on public.patients
    for select to authenticated
    using (public.auth_guardian_can_view_patient(id));

------------------------------------------------------------------------
-- 4. guardians
------------------------------------------------------------------------
create policy guardians_clinician_all on public.guardians
    for all to authenticated
    using (public.auth_clinician_owns_patient(patient_id))
    with check (public.auth_clinician_owns_patient(patient_id));

create policy guardians_self_read on public.guardians
    for select to authenticated
    using (auth_user_id = auth.uid());

------------------------------------------------------------------------
-- 5. diagnoses
------------------------------------------------------------------------
create policy diagnoses_clinician_all on public.diagnoses
    for all to authenticated
    using (public.auth_clinician_owns_patient(patient_id))
    with check (public.auth_clinician_owns_patient(patient_id));

create policy diagnoses_patient_self_read on public.diagnoses
    for select to authenticated
    using (patient_id = public.auth_patient_id());

create policy diagnoses_guardian_read on public.diagnoses
    for select to authenticated
    using (public.auth_guardian_can_view_patient(patient_id));

------------------------------------------------------------------------
-- 6. prescriptions
------------------------------------------------------------------------
create policy prescriptions_clinician_all on public.prescriptions
    for all to authenticated
    using (public.auth_clinician_owns_patient(patient_id))
    with check (public.auth_clinician_owns_patient(patient_id));

create policy prescriptions_patient_self_read on public.prescriptions
    for select to authenticated
    using (patient_id = public.auth_patient_id());

create policy prescriptions_guardian_read on public.prescriptions
    for select to authenticated
    using (public.auth_guardian_can_view_patient(patient_id));

------------------------------------------------------------------------
-- 7. medications
------------------------------------------------------------------------
create policy medications_clinician_all on public.medications
    for all to authenticated
    using (public.auth_clinician_owns_patient(patient_id))
    with check (public.auth_clinician_owns_patient(patient_id));

create policy medications_patient_self_read on public.medications
    for select to authenticated
    using (patient_id = public.auth_patient_id());

create policy medications_guardian_read on public.medications
    for select to authenticated
    using (public.auth_guardian_can_view_patient(patient_id));

------------------------------------------------------------------------
-- 8. vitals
------------------------------------------------------------------------
create policy vitals_clinician_all on public.vitals
    for all to authenticated
    using (public.auth_clinician_owns_patient(patient_id))
    with check (public.auth_clinician_owns_patient(patient_id));

create policy vitals_patient_self_read on public.vitals
    for select to authenticated
    using (patient_id = public.auth_patient_id());

create policy vitals_guardian_read on public.vitals
    for select to authenticated
    using (public.auth_guardian_can_view_patient(patient_id));

------------------------------------------------------------------------
-- 9. adherence_events
------------------------------------------------------------------------
create policy adherence_events_clinician_all on public.adherence_events
    for all to authenticated
    using (public.auth_clinician_owns_patient(patient_id))
    with check (public.auth_clinician_owns_patient(patient_id));

create policy adherence_events_patient_self_read on public.adherence_events
    for select to authenticated
    using (patient_id = public.auth_patient_id());

create policy adherence_events_guardian_read on public.adherence_events
    for select to authenticated
    using (public.auth_guardian_can_view_patient(patient_id));

------------------------------------------------------------------------
-- 10. symptoms
------------------------------------------------------------------------
create policy symptoms_clinician_all on public.symptoms
    for all to authenticated
    using (public.auth_clinician_owns_patient(patient_id))
    with check (public.auth_clinician_owns_patient(patient_id));

create policy symptoms_patient_self_read on public.symptoms
    for select to authenticated
    using (patient_id = public.auth_patient_id());

create policy symptoms_guardian_read on public.symptoms
    for select to authenticated
    using (public.auth_guardian_can_view_patient(patient_id));

------------------------------------------------------------------------
-- 11. risk_events
------------------------------------------------------------------------
create policy risk_events_clinician_all on public.risk_events
    for all to authenticated
    using (public.auth_clinician_owns_patient(patient_id))
    with check (public.auth_clinician_owns_patient(patient_id));

create policy risk_events_patient_self_read on public.risk_events
    for select to authenticated
    using (patient_id = public.auth_patient_id());

create policy risk_events_guardian_read on public.risk_events
    for select to authenticated
    using (public.auth_guardian_can_view_patient(patient_id));

------------------------------------------------------------------------
-- 12. interventions
------------------------------------------------------------------------
create policy interventions_clinician_all on public.interventions
    for all to authenticated
    using (public.auth_clinician_owns_patient(patient_id))
    with check (public.auth_clinician_owns_patient(patient_id));

create policy interventions_patient_self_read on public.interventions
    for select to authenticated
    using (patient_id = public.auth_patient_id());

create policy interventions_guardian_read on public.interventions
    for select to authenticated
    using (public.auth_guardian_can_view_patient(patient_id));

------------------------------------------------------------------------
-- 13. wellness_scores
------------------------------------------------------------------------
create policy wellness_scores_clinician_all on public.wellness_scores
    for all to authenticated
    using (public.auth_clinician_owns_patient(patient_id))
    with check (public.auth_clinician_owns_patient(patient_id));

create policy wellness_scores_patient_self_read on public.wellness_scores
    for select to authenticated
    using (patient_id = public.auth_patient_id());

create policy wellness_scores_guardian_read on public.wellness_scores
    for select to authenticated
    using (public.auth_guardian_can_view_patient(patient_id));

------------------------------------------------------------------------
-- 14. audit_log
-- Insert-only from any authenticated role; absence of update/delete
-- policies blocks those operations outright (RLS is fail-closed).
-- A clinician can read an entry only when:
--   (a) they performed the action themselves (actor_id = auth.uid()), OR
--   (b) the target row is in their clinic (polymorphic resolution).
-- This means a target deleted from its source table becomes invisible
-- to all clinicians except the original actor -- acceptable trade-off
-- for hackathon; production would denormalize clinic_id onto audit_log.
------------------------------------------------------------------------
create policy audit_log_authenticated_insert on public.audit_log
    for insert to authenticated
    with check (true);

create policy audit_log_clinician_read on public.audit_log
    for select to authenticated
    using (
        public.auth_clinician_clinic_id() is not null
        and (
            actor_id = auth.uid()
            or public.audit_log_target_in_caller_clinic(target_table, target_id)
        )
    );
