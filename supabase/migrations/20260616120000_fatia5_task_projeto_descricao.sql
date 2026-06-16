-- Fatia 5: descrição rich text das tasks de projeto.
-- Armazena HTML gerado pelo editor (títulos, negrito, itálico, cor, listas).
ALTER TABLE task_projeto ADD COLUMN IF NOT EXISTS descricao text;
