-- Mensajes del formulario de booking / prensa (sección "Prensa").
-- Se guardan siempre; además se reenvían por correo a CONTACT_EMAIL si está configurado.
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  email       extensions.citext not null check (char_length(email) between 3 and 254),
  subject     text not null check (subject in ('booking', 'press', 'collab', 'other')),
  message     text not null check (char_length(message) between 10 and 3000),
  locale      text not null default 'es' check (locale in ('es', 'en')),
  ip_hash     text,
  emailed_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists contact_messages_ip_time_idx on public.contact_messages (ip_hash, created_at desc);
create index if not exists contact_messages_time_idx    on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
