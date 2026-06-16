DO $$ BEGIN
  CREATE TYPE prioridade_task AS ENUM ('baixa', 'media', 'alta', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

DO $$ BEGIN
  CREATE TYPE status_task AS ENUM ('a_fazer', 'em_andamento', 'concluida', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

DO $$ BEGIN
  CREATE TYPE tipo_task_projeto AS ENUM ('pre_evento', 'intra_evento', 'pos_evento');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

CREATE TABLE IF NOT EXISTS task_projeto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo tipo_task_projeto NOT NULL,
  evento_id uuid REFERENCES evento(id) ON DELETE SET NULL,
  responsavel_id uuid,
  data_fim date,
  prioridade prioridade_task NOT NULL DEFAULT 'media',
  status status_task NOT NULL DEFAULT 'a_fazer',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_projeto ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_projeto' AND policyname = 'auth users full access'
  ) THEN
    CREATE POLICY "auth users full access" ON task_projeto FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END$$;

CREATE OR REPLACE VIEW public.membros AS
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)) AS nome
FROM auth.users;

GRANT SELECT ON public.membros TO authenticated;
