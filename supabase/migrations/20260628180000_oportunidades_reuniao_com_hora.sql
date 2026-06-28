-- Comercial › Oportunidades — Regra 3 passa a preservar a HORA da reunião.
-- data_inicio/data_fim já são timestamp (migration do calendário com hora opcional),
-- então removemos o ::date que descartava a hora:
--   data_inicio = data_reuniao (com hora)
--   data_fim    = data_reuniao + 1h30 (com hora)
-- Regras 1 e 2 permanecem idênticas. Vale para Tráfego Pago e Prospeção Ativa.
CREATE OR REPLACE FUNCTION automatizar_oportunidade()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Nada a fazer se status não mudou
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
  --   → data_inicio = data da reunião (com hora); data_fim = data da reunião + 1h30 (com hora)
  IF OLD.status IN ('lead', 'a_prospectar', 'qualificacao') AND NEW.status = 'reuniao_agendada' THEN
    IF NEW.data_reuniao IS NOT NULL THEN
      NEW.data_inicio := NEW.data_reuniao;
      NEW.data_fim    := NEW.data_reuniao + interval '1 hour 30 minutes';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
