-- Base de datos D1 de los microservicios del panel (rafa-admin).
-- Solo la usa el Worker; el navegador nunca accede directamente.

-- Perfil de voz de Rafa (respuestas del onboarding). Una sola fila.
CREATE TABLE IF NOT EXISTS voice (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  answers     TEXT    NOT NULL DEFAULT '{}',
  completed   INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT    NOT NULL
);

-- Insights manuales y referentes (links analizados).
CREATE TABLE IF NOT EXISTS insights (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('insight', 'reference')),
  text        TEXT,
  url         TEXT,
  analysis    TEXT,
  created_at  TEXT NOT NULL
);

-- Estado de cada sugerencia de contenido (hecho / descartado).
CREATE TABLE IF NOT EXISTS content_state (
  id          TEXT PRIMARY KEY,
  status      TEXT NOT NULL CHECK (status IN ('pendiente', 'hecho', 'descartado')),
  updated_at  TEXT NOT NULL
);

-- Borradores generados con IA (cuando hay ANTHROPIC_API_KEY).
CREATE TABLE IF NOT EXISTS drafts (
  id             TEXT PRIMARY KEY,
  suggestion_id  TEXT,
  format         TEXT,
  title          TEXT,
  body           TEXT NOT NULL,
  model          TEXT,
  created_at     TEXT NOT NULL
);

-- Caché de pauta (Google Ads / Meta Ads) para no consultar las APIs en cada visita.
CREATE TABLE IF NOT EXISTS ads_cache (
  key         TEXT PRIMARY KEY,
  payload     TEXT NOT NULL,
  fetched_at  TEXT NOT NULL
);

-- ── Calendario colaborativo ──
-- Actividades (cronograma + pipeline) y tareas pendientes.
CREATE TABLE IF NOT EXISTS board_items (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('actividad', 'tarea')),
  title       TEXT NOT NULL,
  type        TEXT NOT NULL,
  stage       TEXT NOT NULL,
  start_date  TEXT,
  end_date    TEXT,
  owner       TEXT,
  notes       TEXT,
  link        TEXT,
  priority    INTEGER NOT NULL DEFAULT 2,
  meeting_id  TEXT,
  source      TEXT,
  created_by  TEXT,
  updated_by  TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS board_items_dates ON board_items (start_date, end_date);

-- Resúmenes de reuniones.
CREATE TABLE IF NOT EXISTS meetings (
  id          TEXT PRIMARY KEY,
  date        TEXT NOT NULL,
  title       TEXT NOT NULL,
  attendees   TEXT,
  summary     TEXT,
  decisions   TEXT,
  created_by  TEXT,
  updated_by  TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Versión del tablero (para sincronizar entre pantallas) y registro de cambios.
CREATE TABLE IF NOT EXISTS board_meta (
  id       INTEGER PRIMARY KEY CHECK (id = 1),
  version  INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS board_log (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  at     TEXT NOT NULL,
  who    TEXT NOT NULL,
  action TEXT NOT NULL,
  title  TEXT NOT NULL
);

-- ── Asistente con herramientas ──
-- Skills activas (de Anthropic o propias revisadas desde GitHub).
CREATE TABLE IF NOT EXISTS skills (
  skill_id    TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('anthropic', 'custom')),
  name        TEXT NOT NULL,
  description TEXT,
  origin      TEXT,
  enabled     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL
);
-- Conversaciones con el asistente (texto, fuentes y archivos generados).
CREATE TABLE IF NOT EXISTS assistant_threads (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  messages    TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
-- Archivos creados por el asistente (lista blanca para descargas).
CREATE TABLE IF NOT EXISTS assistant_files (
  id          TEXT PRIMARY KEY,
  filename    TEXT,
  created_at  TEXT NOT NULL
);

-- Conexiones configuradas desde el panel (/admin → Conexiones).
-- Los secretos (secret = 1) van cifrados con AES-GCM (llave CONFIG_KEY del Worker).
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT    NOT NULL,
  secret      INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT    NOT NULL
);
