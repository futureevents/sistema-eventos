-- Comercial › Oportunidades — tabela única de leads/oportunidades (CRM).
--
-- Uma só tabela (task_oportunidade) serve as 2 Lists do Folder Oportunidades,
-- discriminadas pela coluna `tipo`:
--   trafego_pago      → Comercial › Oportunidades › Tráfego Pago (inbound de anúncios)
--   prospeccao_ativa  → Comercial › Oportunidades › Prospeção Ativa (outbound)
--
-- Nome da Task = EMPRESA (igual à List Clientes); o contato (pessoa) vai em
-- nome_contato e aparece como subtítulo. `status` é TEXT sem CHECK rígido porque
-- cada List tem seu próprio pipeline (o da Prospeção Ativa ainda será definido) —
-- a validação de valores fica na config de cada List, e novos status entram sem
-- migration.

CREATE TABLE IF NOT EXISTS task_oportunidade (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo           text NOT NULL CHECK (tipo IN ('trafego_pago', 'prospeccao_ativa')),
  nome           text NOT NULL DEFAULT '',          -- Nome da Task = Empresa
  status         text NOT NULL DEFAULT 'lead',       -- estágio do pipeline (por List)
  nome_contato   text,                               -- pessoa / contato do lead
  whatsapp       text,
  telefone       text,
  email          text,
  -- UTM (rastreio de origem; sobretudo no Tráfego Pago)
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  utm_term       text,
  utm_content    text,
  responsavel_id uuid,                               -- assignee padrão da Task
  prioridade     prioridade_task NOT NULL DEFAULT 'media',
  data_inicio    date,                               -- entrada do lead
  data_fim       date,
  descricao      text,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_oportunidade_tipo_idx ON task_oportunidade (tipo);

ALTER TABLE task_oportunidade ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_oportunidade' AND policyname = 'auth users full access'
  ) THEN
    CREATE POLICY "auth users full access" ON task_oportunidade FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END$$;

CREATE TRIGGER trg_task_oportunidade_atualizado_em
  BEFORE UPDATE ON task_oportunidade
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
