-- Comercial › Oportunidades — campo Oportunidade (valor estimado do negócio em R$)
ALTER TABLE task_oportunidade
  ADD COLUMN IF NOT EXISTS oportunidade numeric(12,2);
