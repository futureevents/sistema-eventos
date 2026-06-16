-- Fatia 6: descrição rich text também em cliente e fornecedor.
-- Armazena HTML gerado pelo editor (títulos, negrito, itálico, cor, listas).
ALTER TABLE cliente    ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE fornecedor ADD COLUMN IF NOT EXISTS descricao text;
