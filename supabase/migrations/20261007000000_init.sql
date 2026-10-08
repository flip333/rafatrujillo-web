-- ════════════════════════════════════════════════════════════════════
-- rafatrujillo-web · esquema inicial
--   · subscribers  → lista de correo con doble opt-in
--   · events       → métricas propias (eventos de producto)
--
-- Seguridad: RLS activado SIN políticas para anon/authenticated.
-- Ninguna tabla es accesible con la anon key; solo el backend
-- (route handlers de Next en Vercel) escribe/lee con la service_role.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists citext with schema extensions;

-- ─── updated_at automático ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Suscriptores ────────────────────────────────────────────────────
create table if not exists public.subscribers (
  id                 uuid primary key default gen_random_uuid(),
  email              extensions.citext not null unique
                       check (char_length(email) between 3 and 254),
  name               text check (char_length(name) <= 80),
  status             text not null default 'pending'
                       check (status in ('pending', 'confirmed', 'unsubscribed')),
  source             text not null default 'web'
                       check (char_length(source) <= 40),
  confirm_token      uuid not null default gen_random_uuid() unique,
  unsubscribe_token  uuid not null default gen_random_uuid() unique,
  consent_at         timestamptz not null default now(),
  confirmation_sent_at timestamptz,
  confirmed_at       timestamptz,
  welcome_sent_at    timestamptz,
  unsubscribed_at    timestamptz,
  ip_hash            text,          -- SHA-256 con sal; nunca la IP en claro
  user_agent         text check (char_length(user_agent) <= 300),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists subscribers_status_idx  on public.subscribers (status);
create index if not exists subscribers_ip_time_idx on public.subscribers (ip_hash, created_at desc);

drop trigger if exists subscribers_updated_at on public.subscribers;
create trigger subscribers_updated_at
  before update on public.subscribers
  for each row execute function public.set_updated_at();

alter table public.subscribers enable row level security;
revoke all on public.subscribers from anon, authenticated;

-- ─── Eventos (métricas propias) ──────────────────────────────────────
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  name        text not null check (name ~ '^[a-z][a-z0-9_]{1,39}$'),
  props       jsonb not null default '{}'::jsonb
                check (pg_column_size(props) <= 2048),
  path        text check (char_length(path) <= 200),
  referrer    text check (char_length(referrer) <= 300),
  session_id  text check (char_length(session_id) <= 64),
  country     text check (char_length(country) <= 2),
  device      text check (device in ('mobile', 'tablet', 'desktop', 'unknown')),
  created_at  timestamptz not null default now()
);

create index if not exists events_name_time_idx on public.events (name, created_at desc);
create index if not exists events_time_idx      on public.events (created_at desc);

alter table public.events enable row level security;
revoke all on public.events from anon, authenticated;

-- ─── Vistas de reporte (solo service_role / dashboard) ───────────────
create or replace view public.subscriber_daily
with (security_invoker = on) as
select
  date_trunc('day', created_at)::date               as day,
  count(*)                                          as signups,
  count(*) filter (where status = 'confirmed')      as confirmed,
  count(*) filter (where status = 'unsubscribed')   as unsubscribed
from public.subscribers
group by 1
order by 1 desc;

create or replace view public.event_daily
with (security_invoker = on) as
select
  date_trunc('day', created_at)::date as day,
  name,
  count(*)                            as total,
  count(distinct session_id)          as sessions
from public.events
group by 1, 2
order by 1 desc, 3 desc;

revoke all on public.subscriber_daily from anon, authenticated;
revoke all on public.event_daily      from anon, authenticated;
