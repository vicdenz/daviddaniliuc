create table public.prep_usage (
  id uuid primary key,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  cpu_ms double precision not null default 0 check(cpu_ms >= 0),
  measurement text not null check(measurement in ('pending', 'measured', 'upper_bound'))
);
create index prep_usage_started_idx on public.prep_usage(started_at);
alter table public.prep_usage enable row level security;
revoke all on public.prep_usage from anon, authenticated;
grant select, insert, update on public.prep_usage to service_role;
insert into public.prep_settings(key, value) values('usage_tracking_started_at', to_jsonb(now()));

create function public.prep_usage_summary(zone text default 'America/Toronto') returns jsonb
language sql stable security definer set search_path = public as $$
  with entries as (
    select started_at,
      case when measurement = 'pending' and started_at < now() - interval '5 minutes'
        then 240000 else cpu_ms end as effective_cpu_ms,
      measurement = 'upper_bound' or (measurement = 'pending' and started_at < now() - interval '5 minutes') as estimated,
      measurement = 'pending' and started_at >= now() - interval '5 minutes' as pending
    from public.prep_usage where started_at >= now() - interval '30 days'
  )
  select jsonb_build_object(
    'todayCpuMs', coalesce(sum(effective_cpu_ms) filter(where started_at >= (date_trunc('day', now() at time zone zone) at time zone zone)), 0),
    'rollingCpuMs', coalesce(sum(effective_cpu_ms), 0),
    'todayEstimated', coalesce(bool_or(estimated) filter(where started_at >= (date_trunc('day', now() at time zone zone) at time zone zone)), false),
    'rollingEstimated', coalesce(bool_or(estimated), false),
    'pending', count(*) filter(where pending),
    'trackingStartedAt', (select value from public.prep_settings where key = 'usage_tracking_started_at')
  ) from entries;
$$;
revoke all on function public.prep_usage_summary(text) from public, anon, authenticated;
grant execute on function public.prep_usage_summary(text) to service_role;
