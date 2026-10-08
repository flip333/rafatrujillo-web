-- Nuevo motivo de contacto: servicios de música para cine, publicidad y proyectos.
alter table public.contact_messages drop constraint if exists contact_messages_subject_check;
alter table public.contact_messages add constraint contact_messages_subject_check
  check (subject in ('booking', 'services', 'press', 'collab', 'other'));
