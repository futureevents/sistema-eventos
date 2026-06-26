-- Marketing › Criação — tabela única das Lists de criação + automações de fluxo.
--
-- Uma só tabela (task_marketing) serve 4 Lists, discriminadas pela coluna `tipo`:
--   copy       → Marketing › Criação › Processo de copy
--   design     → Marketing › Criação › Design e criação
--   publicacao → Marketing › Criação › Publicações e disparos
--   landing    → Marketing › Desenvolvimento web › Landing pages e websites
--
-- Mover uma Task entre Lists = trocar `tipo` na MESMA linha. Como o id é
-- preservado, custom fields, descrição e anexos (polimórficos via task_table)
-- permanecem intactos — exatamente o que as automações exigem.

-- ── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE tipo_lista_marketing AS ENUM ('copy', 'design', 'publicacao', 'landing');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

-- Superset de status; cada List declara o subconjunto que exibe na sua config.
DO $$ BEGIN
  CREATE TYPE status_marketing AS ENUM (
    'para_fazer', 'para_gravar', 'em_andamento', 'em_aprovacao',
    'em_alteracao', 'descartado', 'finalizado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

DO $$ BEGIN
  CREATE TYPE tipo_conteudo_marketing AS ENUM (
    'email', 'post', 'anuncio', 'landing_page', 'formulario', 'mensagem'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

DO $$ BEGIN
  CREATE TYPE formato_conteudo_marketing AS ENUM (
    'feed', 'story', 'reels', 'estatico', 'video', 'carrossel',
    'audio', 'texto', 'thumb', 'web', 'formulario'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

-- ── Tabela ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_marketing (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             text NOT NULL,
  tipo             tipo_lista_marketing NOT NULL,
  status           status_marketing NOT NULL DEFAULT 'para_fazer',
  responsavel_id   uuid,                                   -- assignee padrão da Task
  designer_id      uuid,                                   -- Designer / Editor de vídeos
  canais_publicacao text[] NOT NULL DEFAULT '{}',          -- Instagram, WhatsApp, Web, YouTube, Formy
  tipo_conteudo    tipo_conteudo_marketing,
  formato_conteudo formato_conteudo_marketing,
  data_publicacao  date,                                   -- custom field: data única de publicação
  data_inicio      date,
  data_fim         date,
  prioridade       prioridade_task NOT NULL DEFAULT 'media',
  descricao        text,
  criado_em        timestamptz NOT NULL DEFAULT now(),
  atualizado_em    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_marketing_tipo_idx ON task_marketing (tipo);

ALTER TABLE task_marketing ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_marketing' AND policyname = 'auth users full access'
  ) THEN
    CREATE POLICY "auth users full access" ON task_marketing FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END$$;

CREATE TRIGGER trg_task_marketing_atualizado_em
  BEFORE UPDATE ON task_marketing
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ── Automações de fluxo (mudança de status → move entre Lists) ───────────────
-- Gatilho: ao marcar uma Task como "finalizado", ela é movida para a próxima
-- List (mesma linha, só muda `tipo`/`status`/datas), com:
--   data_inicio = data do gatilho (hoje)
--   data_fim    = data_publicacao (custom field)
CREATE OR REPLACE FUNCTION mover_task_marketing()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'finalizado' AND OLD.status IS DISTINCT FROM 'finalizado' THEN

    -- Processo de copy → Design e criação  (ou Landing pages, conforme o tipo)
    IF OLD.tipo = 'copy' THEN
      IF NEW.tipo_conteudo IN ('email', 'post', 'anuncio', 'mensagem') THEN
        NEW.tipo        := 'design';
        -- Vídeo entra em Design já com "Para gravar"; o resto com "Para fazer".
        NEW.status      := CASE WHEN NEW.formato_conteudo = 'video' THEN 'para_gravar' ELSE 'para_fazer' END;
        NEW.data_inicio := CURRENT_DATE;
        NEW.data_fim    := NEW.data_publicacao;
      ELSIF NEW.tipo_conteudo IN ('landing_page', 'formulario') THEN
        NEW.tipo        := 'landing';
        NEW.status      := 'para_fazer';
        NEW.data_inicio := CURRENT_DATE;
        NEW.data_fim    := NEW.data_publicacao;
      END IF;
      -- Demais tipos de conteúdo permanecem como "finalizado" em Processo de copy.

    -- Design e criação → Publicações e disparos
    ELSIF OLD.tipo = 'design' THEN
      NEW.tipo        := 'publicacao';
      NEW.status      := 'para_fazer';
      NEW.data_inicio := CURRENT_DATE;
      NEW.data_fim    := NEW.data_publicacao;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mover_task_marketing ON task_marketing;
CREATE TRIGGER trg_mover_task_marketing
  BEFORE UPDATE ON task_marketing
  FOR EACH ROW EXECUTE FUNCTION mover_task_marketing();
