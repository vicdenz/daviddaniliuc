-- Existing usage belongs to Vercel. Keep both provider histories separate.
alter table public.prep_usage
  add column provider text not null default 'vercel' check (provider in ('vercel', 'modal')),
  add column wall_ms double precision check (wall_ms >= 0),
  add column estimated_cost_usd double precision check (estimated_cost_usd >= 0);
create index prep_usage_provider_started_idx on public.prep_usage(provider, started_at);
insert into public.prep_settings(key, value) values('modal_usage_tracking_started_at', to_jsonb(now()));

-- The existing production endpoint must continue excluding Modal preview runs.
create or replace function public.prep_usage_summary(zone text default 'America/Toronto') returns jsonb
language sql stable security definer set search_path = public as $$
  with entries as (
    select started_at,
      case when measurement = 'pending' and started_at < now() - interval '5 minutes'
        then 240000 else cpu_ms end as effective_cpu_ms,
      measurement = 'upper_bound' or (measurement = 'pending' and started_at < now() - interval '5 minutes') as estimated,
      measurement = 'pending' and started_at >= now() - interval '5 minutes' as pending
    from public.prep_usage where provider = 'vercel' and started_at >= now() - interval '30 days'
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

create function public.prep_modal_usage_summary(zone text default 'America/Toronto') returns jsonb
language sql stable security definer set search_path = public as $$
  with entries as (
    select started_at,
      -- A stale pending Sandbox reserves its entire four-minute resource budget.
      -- 0.5 physical CPU cores + 2 GiB at published Sandbox rates (2026-10-24).
      case when measurement = 'pending' then 240 * 0.00003305
        else coalesce(estimated_cost_usd, 240 * 0.00003305) end as cost,
      measurement = 'pending' and started_at >= now() - interval '5 minutes' as pending
    from public.prep_usage where provider = 'modal' and started_at >= now() - interval '30 days'
  )
  select jsonb_build_object(
    'todayCostUsd', coalesce(sum(cost) filter(where started_at >= (date_trunc('day', now() at time zone zone) at time zone zone)), 0),
    'rollingCostUsd', coalesce(sum(cost), 0),
    'todayEstimated', true,
    'rollingEstimated', true,
    'pending', count(*) filter(where pending),
    'trackingStartedAt', (select value from public.prep_settings where key = 'modal_usage_tracking_started_at')
  ) from entries;
$$;
revoke all on function public.prep_modal_usage_summary(text) from public, anon, authenticated;
grant execute on function public.prep_modal_usage_summary(text) to service_role;
-- CREATE OR REPLACE preserves the private grants on prep_usage_summary(text).
