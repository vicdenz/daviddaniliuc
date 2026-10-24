alter table public.prep_jobs add column case_revisions jsonb not null default '{}';
create or replace view public.prep_case_summaries with (security_invoker = true) as
select id, problem_id, position, deleted,
  payload - 'input' - 'expected' - 'growthInput' - 'growthExpected' as payload,
  md5(payload::text) as revision
from public.prep_cases;

-- Finalization is one transaction, and replaying it returns the same submission.
-- Editor autosave owns prep_work; finishing an older run must never overwrite it.
create function public.prep_finish_job(job_id uuid, lease_token bigint, final_result jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare job public.prep_jobs%rowtype; saved_id bigint; saved_result jsonb; next_status text;
begin
  select * into job from public.prep_jobs where id = job_id for update;
  if not found then raise exception 'Run not found'; end if;
  if job.state = 'complete' then
    select result into saved_result from public.prep_submissions where id = job.submission_id;
    return saved_result || jsonb_build_object('submissionId', job.submission_id);
  end if;
  if job.lease_expires <> lease_token then raise exception 'Run lease changed; retry the request'; end if;
  if exists (
    select 1 from jsonb_each_text(job.case_revisions) snapshot
    left join public.prep_cases c on c.id = snapshot.key and c.problem_id = job.problem_id
    where c.id is null or c.deleted or md5(c.payload::text) <> snapshot.value
  ) then raise exception 'A selected test changed during this run. Start the run again.'; end if;
  if jsonb_array_length(final_result->'results') <> jsonb_array_length(job.case_ids)
    then raise exception 'The complete visible suite has not finished'; end if;

  insert into public.prep_submissions(problem_id, language, code, mode, result)
  values(job.problem_id, job.language, job.code, job.mode, final_result) returning id into saved_id;
  next_status := case when job.mode = 'submit' and (final_result->>'accepted')::boolean then 'solved' else 'attempted' end;
  insert into public.prep_progress(problem_id, status) values(job.problem_id, next_status)
  on conflict(problem_id) do update set
    status = case when excluded.status = 'solved' then 'solved'
      when prep_progress.status = 'todo' then 'attempted' else prep_progress.status end,
    updated = now();
  -- Results/code already exist in the submission; keep only a lightweight job record.
  update public.prep_jobs set state = 'complete', submission_id = saved_id,
    cursor = jsonb_array_length(job.case_ids), results = '[]', code = '',
    case_ids = '[]', case_revisions = '{}', lease_expires = 0, updated = now()
  where id = job_id;
  return final_result || jsonb_build_object('submissionId', saved_id);
end; $$;
revoke all on function public.prep_finish_job(uuid, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.prep_finish_job(uuid, bigint, jsonb) to service_role;
