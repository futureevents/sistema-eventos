-- Fornecedor: avaliação interna + localização / abrangência de atendimento
ALTER TABLE fornecedor
  ADD COLUMN IF NOT EXISTS avaliacao text,
  ADD COLUMN IF NOT EXISTS cidade_sede text,
  ADD COLUMN IF NOT EXISTS pracas_atendimento text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS abrangencia text;
