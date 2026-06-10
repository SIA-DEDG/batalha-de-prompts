-- Tabela de snapshots quantitativos por sessão de jogo
-- Execute no Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS event_snapshots (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  label           TEXT,                          -- ex: "Manhã 09/06", "Turma A"
  total_players   INT         NOT NULL DEFAULT 0,
  total_games     INT         NOT NULL DEFAULT 0,
  avg_score       INT         NOT NULL DEFAULT 0,
  max_score       INT         NOT NULL DEFAULT 0,
  schools         JSONB,                         -- { "Escola X": 12, "Escola Y": 8 }
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_snapshots_date
  ON event_snapshots (snapshot_date);

ALTER TABLE event_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON event_snapshots
  USING (true)
  WITH CHECK (true);
