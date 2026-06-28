-- Comercial › Oportunidades — campos de qualificação e reunião + automações.

-- ── Novos campos ────────────────────────────────────────────────────────────
ALTER TABLE task_oportunidade
  ADD COLUMN IF NOT EXISTS reuniao_realizada text NOT NULL DEFAULT 'nao'
    CHECK (reuniao_realizada IN ('sim', 'nao')),
  ADD COLUMN IF NOT EXISTS qualidade_reuniao text
    CHECK (qualidade_reuniao IN ('qualificada', 'desqualificada')),
  ADD COLUMN IF NOT EXISTS qualidade_lead text
    CHECK (qualidade_lead IN ('qualificado', 'desqualificado')),
  -- timestamptz para guardar data + hora; o motor exibe como date (date picker),
  -- mas o trigger usa a granularidade de hora para calcular data_fim.
  ADD COLUMN IF NOT EXISTS data_reuniao timestamptz;

-- ── Automações de CRM ────────────────────────────────────────────────────────
-- Trigger BEFORE UPDATE; age apenas quando o status muda.
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

  -- Regra 3: lead ou qualificação → reunião agendada
  --   → data_inicio = data da call; data_fim = data da call + 1h30
  --   (data_inicio/data_fim são `date`; o time component fica em data_reuniao)
  IF OLD.status IN ('lead', 'qualificacao') AND NEW.status = 'reuniao_agendada' THEN
    IF NEW.data_reuniao IS NOT NULL THEN
      NEW.data_inicio := NEW.data_reuniao::date;
      NEW.data_fim    := (NEW.data_reuniao + interval '1 hour 30 minutes')::date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_automatizar_oportunidade ON task_oportunidade;
CREATE TRIGGER trg_automatizar_oportunidade
  BEFORE UPDATE ON task_oportunidade
  FOR EACH ROW EXECUTE FUNCTION automatizar_oportunidade();
