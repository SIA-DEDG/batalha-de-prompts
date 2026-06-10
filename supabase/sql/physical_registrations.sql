-- Tabela de inscrições físicas do evento (independente do jogo)
-- Execute no Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS physical_registrations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  phone       TEXT,
  school      TEXT,
  event_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para buscas por data
CREATE INDEX IF NOT EXISTS idx_physical_registrations_event_date
  ON physical_registrations (event_date);

-- Habilitar Row Level Security
ALTER TABLE physical_registrations ENABLE ROW LEVEL SECURITY;

-- Permitir leitura/escrita apenas com a service_role (admin)
-- Ajuste a política conforme necessário
CREATE POLICY "Admin full access" ON physical_registrations
  USING (true)
  WITH CHECK (true);
