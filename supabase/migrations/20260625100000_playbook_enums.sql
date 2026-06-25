-- Playbook de eventos — enums.
-- Mantido em arquivo próprio porque ALTER TYPE ... ADD VALUE precisa ser
-- commitado antes de ser usado (não pode aparecer na mesma transação que o usa).

-- A List "Tarefas de onboarding" reusa task_projeto via o tipo 'onboarding'.
ALTER TYPE tipo_task_projeto ADD VALUE IF NOT EXISTS 'onboarding';

-- Âncoras de data do playbook (mapeiam para colunas de data do evento).
DO $$ BEGIN
  CREATE TYPE ancora_playbook AS ENUM (
    'inicio_organizacao',
    'realizacao_inicio',
    'data_montagem',
    'realizacao_fim'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END$$;
