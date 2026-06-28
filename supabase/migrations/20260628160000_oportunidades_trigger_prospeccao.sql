-- Comercial › Oportunidades — atualiza trigger para cobrir Prospeção Ativa.
-- Regra 3: inclui 'a_prospectar' (status inicial da Prospeção Ativa) além de
-- 'lead' (status inicial do Tráfego Pago) como origem válida para reunião_agendada.
CREATE OR REPLACE FUNCTION automatizar_oportunidade()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Nada a fazer se status não mudou
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Regra 1: reunião agendada → reunião realizada
  --   → qualidade_reuniao = qualificada, reuniao_realizada = sim
  IF OLD.status = 'reuniao_agendada' AND NEW.status = 'reuniao_realizada' THEN
    NEW.qualidade_reuniao := 'qualificada';
    NEW.reuniao_realizada := 'sim';
  END IF;

  -- Regra 2: reunião agendada → desqualificado
  --   → qualidade_reuniao = desqualificada, reuniao_realizada = sim
  IF OLD.status = 'reuniao_agendada' AND NEW.status = 'desqualificado' THEN
    NEW.qualidade_reuniao := 'desqualificada';
    NEW.reuniao_realizada := 'sim';
  END IF;

  -- Regra 3: status inicial (lead / a_prospectar) ou qualificação → reunião agendada
  --   → data_inicio = data da call; data_fim = data da call + 1h30
  --   'a_prospectar' é o status inicial da Prospeção Ativa (equivalente a 'lead')
  IF OLD.status IN ('lead', 'a_prospectar', 'qualificacao') AND NEW.status = 'reuniao_agendada' THEN
    IF NEW.data_reuniao IS NOT NULL THEN
      NEW.data_inicio := NEW.data_reuniao::date;
      NEW.data_fim    := (NEW.data_reuniao + interval '1 hour 30 minutes')::date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
