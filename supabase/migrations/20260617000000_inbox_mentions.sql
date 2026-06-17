-- Adiciona suporte a menções em comentários
ALTER TABLE task_comment ADD COLUMN IF NOT EXISTS mentions text[] NOT NULL DEFAULT '{}';

-- Índice para inbox: buscar rapidamente comentários onde um usuário foi mencionado
CREATE INDEX IF NOT EXISTS idx_task_comment_mentions ON task_comment USING gin(mentions);
