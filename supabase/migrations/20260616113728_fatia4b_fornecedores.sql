CREATE TABLE IF NOT EXISTS fornecedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  responsavel text,
  categorias text[] NOT NULL DEFAULT '{}',
  cnpj_cpf text,
  whatsapp text,
  telefone text,
  email text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE fornecedor ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fornecedor' AND policyname = 'auth users full access'
  ) THEN
    CREATE POLICY "auth users full access" ON fornecedor FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END$$;
