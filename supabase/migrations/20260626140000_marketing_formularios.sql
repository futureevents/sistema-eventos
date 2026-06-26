-- Corrige automação: tipo_conteudo='formulario' vai para a List Formulários,
-- não para Landing pages e websites.
-- Adiciona 'formulario' ao enum tipo_lista_marketing e atualiza o trigger.

ALTER TYPE tipo_lista_marketing ADD VALUE IF NOT EXISTS 'formulario';

CREATE OR REPLACE FUNCTION mover_task_marketing()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'finalizado' AND OLD.status IS DISTINCT FROM 'finalizado' THEN

    IF OLD.tipo = 'copy' THEN
      IF NEW.tipo_conteudo IN ('email', 'post', 'anuncio', 'mensagem') THEN
        NEW.tipo        := 'design';
        NEW.status      := CASE WHEN NEW.formato_conteudo = 'video' THEN 'para_gravar' ELSE 'para_fazer' END;
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
