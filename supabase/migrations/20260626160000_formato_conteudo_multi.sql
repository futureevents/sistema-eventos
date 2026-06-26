-- Formato de conteúdo: valor único (enum) → múltiplos (text[]).
-- Permite escolher mais de um formato por Task em task_marketing.
-- Atualiza o trigger de fluxo que comparava formato_conteudo = 'video'
-- para usar 'video' = ANY(...), já que a coluna passa a ser array.

-- 1. Trigger de fluxo (mover entre Lists ao finalizar) — versão array-aware.
CREATE OR REPLACE FUNCTION mover_task_marketing()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'finalizado' AND OLD.status IS DISTINCT FROM 'finalizado' THEN

    IF OLD.tipo = 'copy' THEN
      IF NEW.tipo_conteudo IN ('email', 'post', 'anuncio', 'mensagem') THEN
        NEW.tipo        := 'design';
        -- Vídeo entra em Design já com "Para gravar"; o resto com "Para fazer".
        NEW.status      := CASE WHEN 'video' = ANY(NEW.formato_conteudo) THEN 'para_gravar' ELSE 'para_fazer' END;
        NEW.data_inicio := CURRENT_DATE;
        NEW.data_fim    := NEW.data_publicacao;
      ELSIF NEW.tipo_conteudo = 'landing_page' THEN
        NEW.tipo        := 'landing';
        NEW.status      := 'para_fazer';
        NEW.data_inicio := CURRENT_DATE;
        NEW.data_fim    := NEW.data_publicacao;
      ELSIF NEW.tipo_conteudo = 'formulario' THEN
        NEW.tipo        := 'formulario';
        NEW.status      := 'para_fazer';
        NEW.data_inicio := CURRENT_DATE;
        NEW.data_fim    := NEW.data_publicacao;
      END IF;

    ELSIF OLD.tipo = 'design' THEN
      NEW.tipo        := 'publicacao';
      NEW.status      := 'para_fazer';
      NEW.data_inicio := CURRENT_DATE;
      NEW.data_fim    := NEW.data_publicacao;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- 2. Coluna formato_conteudo: enum (formato_conteudo_marketing) → text[].
--    Valores existentes viram array de 1 elemento; NULL vira '{}'.
--    Guardado por checagem de tipo para ser idempotente (rodar 2x não corrompe).
DO $$
BEGIN
  IF (
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'task_marketing' AND column_name = 'formato_conteudo'
  ) IS DISTINCT FROM 'ARRAY' THEN
    ALTER TABLE task_marketing
      ALTER COLUMN formato_conteudo TYPE text[]
      USING (
        CASE WHEN formato_conteudo IS NULL
             THEN '{}'::text[]
             ELSE ARRAY[formato_conteudo::text]
        END
      );
    ALTER TABLE task_marketing ALTER COLUMN formato_conteudo SET DEFAULT '{}';
    ALTER TABLE task_marketing ALTER COLUMN formato_conteudo SET NOT NULL;
  END IF;
END$$;
