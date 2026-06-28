-- Comercial › Oportunidades — rastreia quando o status foi alterado pela última vez.
-- Usado para exibir "Tempo total no status" na visualização de lista.
ALTER TABLE task_oportunidade
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz DEFAULT now();

-- Inicializa registros existentes com a data de criação (melhor aproximação disponível)
UPDATE task_oportunidade
  SET status_changed_at = criado_em
  WHERE status_changed_at IS NULL;

-- Atualiza trigger: registra o momento exato de cada transição de status
CREATE OR REPLACE FUNCTION automatizar_oportunidade()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Stampa o momento de cada transição (base para "Tempo no status")
  NEW.status_changed_at := now();

  -- Regra 1: reunião agendada → reunião realizada
  IF OLD.status = 'reuniao_agendada' AND NEW.status = 'reuniao_realizada' THEN
    NEW.qualidade_reuniao := 'qualificada';
    NEW.reuniao_realizada := 'sim';
  END IF;

  -- Regra 2: reunião agendada → desqualificado
  IF OLD.status = 'reuniao_agendada' AND NEW.status = 'desqualificado' THEN
    NEW.qualidade_reuniao := 'desqualificada';
    NEW.reuniao_realizada := 'sim';
  END IF;

  -- Regra 3: status inicial (lead / a_prospectar) ou qualificação → reunião agendada
  IF OLD.status IN ('lead', 'a_prospectar', 'qualificacao') AND NEW.status = 'reuniao_agendada' THEN
    IF NEW.data_reuniao IS NOT NULL THEN
      NEW.data_inicio := NEW.data_reuniao::date;
      NEW.data_fim    := (NEW.data_reuniao + interval '1 hour 30 minutes')::date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
