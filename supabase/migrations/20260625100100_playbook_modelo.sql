-- Playbook de eventos — tabela-modelo, seed e gatilho de geração.
-- Cada linha de playbook_modelo = 1 task-modelo. Quando o status de um evento
-- muda backlog -> em_execucao, o trigger cria 1 task_projeto por modelo ativo,
-- com evento_id preenchido e prazo (data_fim) = (data-âncora do evento) + offset.

CREATE TABLE IF NOT EXISTS playbook_modelo (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem             integer NOT NULL DEFAULT 0,
  titulo            text NOT NULL,
  lista             tipo_task_projeto NOT NULL,
  ancora            ancora_playbook NOT NULL,
  offset_dias       integer NOT NULL DEFAULT 0,
  bloco             text,
  setor_padrao      text,
  prioridade_padrao prioridade_task NOT NULL DEFAULT 'media',
  descricao_padrao  text,
  ativo             boolean NOT NULL DEFAULT true,
  criado_em         timestamptz NOT NULL DEFAULT now(),
  atualizado_em     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE playbook_modelo ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'playbook_modelo' AND policyname = 'auth users full access'
  ) THEN
    CREATE POLICY "auth users full access" ON playbook_modelo FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END$$;

CREATE TRIGGER trg_playbook_modelo_atualizado_em
  BEFORE UPDATE ON playbook_modelo
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ── Seed (77 linhas da planilha Playbook-Sistema-de-Eventos.xlsx) ───────────
INSERT INTO playbook_modelo
  (ordem, titulo, lista, ancora, offset_dias, bloco, setor_padrao, descricao_padrao, ativo)
VALUES
  (1, 'Setup do evento no sistema', 'onboarding', 'inicio_organizacao', 0, 'Abertura', 'Operação', 'Criar o registro do evento, pasta de arquivos e canal interno; subir o contrato; conferir dados herdados da oportunidade e validar as datas-âncora.', true),
  (2, 'Criar grupo com o cliente', 'onboarding', 'inicio_organizacao', 1, 'Abertura', 'Sócio Atendimento', 'Abrir o canal oficial (WhatsApp/Telegram) com nome padronizado, pontos de contato definidos e regras de comunicação.', true),
  (3, 'Reunião de briefing com o cliente', 'onboarding', 'inicio_organizacao', 5, 'Descoberta', 'Atendimento + Produção', 'Alinhar expectativas, apresentar/confirmar datas-chave, coletar dados (orçamento, KPIs, restrições) e combinar a cadência de followups.', true),
  (4, 'Registro escrito do briefing (ata)', 'onboarding', 'inicio_organizacao', 6, 'Descoberta', 'Sócio Atendimento', 'Enviar ao cliente o resumo do briefing (escopo, datas, cadência) para rastreabilidade. Descrição padrão = template da ata.', true),
  (5, 'Passar o briefing para a equipe', 'onboarding', 'inicio_organizacao', 8, 'Alinhamento', 'Sócio Produção', 'Repassar internamente o acordado e distribuir as frentes; a produção assume o evento.', true),
  (1, 'Direção visual / identidade do evento', 'pre_evento', 'realizacao_inicio', -90, 'A. Concepção e identidade', 'Design', 'Montar e validar o moodboard / identidade visual com o cliente.', true),
  (2, 'Briefing para o designer', 'pre_evento', 'realizacao_inicio', -90, 'A. Concepção e identidade', 'Produção', 'Documentar a direção criativa e os materiais a produzir.', true),
  (3, 'Hotsite / página de inscrição', 'pre_evento', 'realizacao_inicio', -90, 'A. Concepção e identidade', 'Marketing', 'Criar a página de inscrição/divulgação (quando houver inscrição aberta).', true),
  (4, 'Conceito e grade de conteúdo', 'pre_evento', 'realizacao_inicio', -60, 'A. Concepção e identidade', 'Produção', 'Definir formato, blocos e a programação (trilha do Científico).', true),
  (5, 'Levantamento de necessidades + cotações', 'pre_evento', 'realizacao_inicio', -60, 'B. Fornecedores e orçamento', 'Operação', 'Mapear tudo que o evento exige e cotar com fornecedores.', true),
  (6, 'Fechar o local', 'pre_evento', 'realizacao_inicio', -60, 'B. Fornecedores e orçamento', 'Produção', 'Reservar e contratar o espaço (a disponibilidade trava a data).', true),
  (7, 'Orçamento final fechado', 'pre_evento', 'realizacao_inicio', -45, 'B. Fornecedores e orçamento', 'Produção', 'Consolidar custos e margem do evento.', true),
  (8, 'Aprovação do orçamento pelo cliente', 'pre_evento', 'realizacao_inicio', -45, 'B. Fornecedores e orçamento', 'Sócio Atendimento', 'Obter a aprovação formal do orçamento antes de fechar fornecedores.', true),
  (9, 'Fechar fornecedor de A/V', 'pre_evento', 'realizacao_inicio', -30, 'B. Fornecedores e orçamento', 'Operação', 'Cotar, negociar e contratar áudio e vídeo (som, luz, projeção, microfones).', true),
  (10, 'Fechar fornecedor de A&B (buffet)', 'pre_evento', 'realizacao_inicio', -30, 'B. Fornecedores e orçamento', 'Operação', 'Cotar, negociar e contratar alimentos e bebidas.', true),
  (11, 'Fechar fornecedor de decoração / ambientação', 'pre_evento', 'realizacao_inicio', -30, 'B. Fornecedores e orçamento', 'Operação', 'Cotar, negociar e contratar decoração e cenografia.', true),
  (12, 'Fechar fornecedor de filmagem e fotografia', 'pre_evento', 'realizacao_inicio', -30, 'B. Fornecedores e orçamento', 'Operação', 'Cotar, negociar e contratar o registro de foto e vídeo.', true),
  (13, 'Fechar fornecedor de kits / crachás / bolsas', 'pre_evento', 'realizacao_inicio', -30, 'B. Fornecedores e orçamento', 'Operação', 'Cotar, negociar e contratar os materiais dos participantes.', true),
  (14, 'Fechar staff / equipe de apoio', 'pre_evento', 'realizacao_inicio', -30, 'B. Fornecedores e orçamento', 'Operação', 'Contratar recepcionistas, credenciamento e equipe de apoio.', true),
  (15, 'Fechar Wi-Fi / internet', 'pre_evento', 'realizacao_inicio', -30, 'B. Fornecedores e orçamento', 'Operação', 'Contratar/configurar internet para participantes, lives e pagamentos.', true),
  (16, 'Sinalização interna', 'pre_evento', 'realizacao_inicio', -60, 'C. Logística e estrutura', 'Design', 'Definir a sinalização e a orientação no local.', true),
  (17, 'Estacionamento / valet', 'pre_evento', 'realizacao_inicio', -60, 'C. Logística e estrutura', 'Operação', 'Organizar estacionamento ou valet, quando aplicável.', true),
  (18, 'Ferramenta de check-in / credenciamento', 'pre_evento', 'realizacao_inicio', -30, 'C. Logística e estrutura', 'Operação', 'Definir e configurar a ferramenta de credenciamento digital.', true),
  (19, 'Kit de primeiros socorros', 'pre_evento', 'realizacao_inicio', -15, 'C. Logística e estrutura', 'Operação', 'Providenciar o kit e o protocolo de primeiros socorros.', true),
  (20, 'Roteiro técnico / run of show', 'pre_evento', 'realizacao_inicio', -30, 'D. Conteúdo, palco e experiência', 'Produção', 'Produzir o roteiro minuto a minuto do evento.', true),
  (21, 'Dinâmicas, quebra-gelo, brindes e depoimentos', 'pre_evento', 'realizacao_inicio', -30, 'D. Conteúdo, palco e experiência', 'Produção', 'Planejar as dinâmicas, premiações/brindes e momentos de interação.', true),
  (22, 'Roteiro de apresentações / palestrantes', 'pre_evento', 'realizacao_inicio', -15, 'D. Conteúdo, palco e experiência', 'Produção', 'Preparar o roteiro e o alinhamento das apresentações.', true),
  (23, 'Materiais gráficos', 'pre_evento', 'realizacao_inicio', -15, 'D. Conteúdo, palco e experiência', 'Design', 'Produzir credenciais, impressos e peças gráficas.', true),
  (24, 'Momentos instagramáveis / ambientação planejada', 'pre_evento', 'realizacao_inicio', -15, 'D. Conteúdo, palco e experiência', 'Design', 'Planejar pontos de foto e a ambientação da experiência.', true),
  (25, 'Testar slides / conteúdo audiovisual', 'pre_evento', 'realizacao_inicio', -15, 'D. Conteúdo, palco e experiência', 'Produção', 'Revisar e testar slides e materiais audiovisuais.', true),
  (26, 'Grupo dos participantes', 'pre_evento', 'realizacao_inicio', -30, 'E. Comunicação com participantes', 'Operação', 'Criar o grupo dos participantes (WhatsApp/Telegram).', true),
  (27, 'E-mails de boas-vindas + instruções pré-evento', 'pre_evento', 'realizacao_inicio', -30, 'E. Comunicação com participantes', 'Marketing', 'Escrever boas-vindas e as instruções (endereço, horário, o que levar).', true),
  (28, 'Lembretes programados', 'pre_evento', 'realizacao_inicio', -15, 'E. Comunicação com participantes', 'Marketing', 'Programar lembretes (7 dias, 48h e manhã do evento).', true),
  (29, 'Alinhamento pré-evento com o cliente', 'pre_evento', 'realizacao_inicio', -7, 'F. Reta final', 'Sócio Atendimento', 'Última validação geral com o cliente.', true),
  (30, 'Confirmar todos os fornecedores (48h antes)', 'pre_evento', 'realizacao_inicio', -7, 'F. Reta final', 'Operação', 'Reconfirmar entregas, horários e responsáveis de cada fornecedor.', true),
  (31, 'Testar plataforma de transmissão', 'pre_evento', 'realizacao_inicio', -7, 'F. Reta final', 'Operação', 'Testar a transmissão ao vivo, quando houver.', true),
  (32, 'Backup de materiais', 'pre_evento', 'realizacao_inicio', -7, 'F. Reta final', 'Produção', 'Salvar backup de slides e materiais (cloud + físico).', true),
  (1, 'Montar a sala conforme o mapa', 'intra_evento', 'data_montagem', 0, 'Montagem', 'Operação', 'Montar o espaço conforme o layout/planta definido.', true),
  (2, 'Teste geral de audiovisual', 'intra_evento', 'data_montagem', 0, 'Montagem', 'Operação', 'Testar todo o sistema de áudio e vídeo.', true),
  (3, 'Checar microfones e som', 'intra_evento', 'data_montagem', 0, 'Montagem', 'Operação', 'Verificar microfones, retornos e sonorização.', true),
  (4, 'Testar conexão de internet', 'intra_evento', 'data_montagem', 0, 'Montagem', 'Operação', 'Validar a internet para lives e pagamentos.', true),
  (5, 'Testar fluxo de credenciamento', 'intra_evento', 'data_montagem', 0, 'Montagem', 'Operação', 'Simular o credenciamento e a recepção.', true),
  (6, 'Organizar backstage', 'intra_evento', 'data_montagem', 0, 'Montagem', 'Produção', 'Preparar o backstage e os bastidores.', true),
  (7, 'Montar kits dos participantes', 'intra_evento', 'data_montagem', 0, 'Montagem', 'Operação', 'Montar e organizar os kits/crachás.', true),
  (8, 'Ajustar coffee break', 'intra_evento', 'data_montagem', 0, 'Montagem', 'Operação', 'Posicionar e ajustar a estação de coffee break.', true),
  (9, 'Ambientação / cenografia final', 'intra_evento', 'data_montagem', 0, 'Montagem', 'Design', 'Finalizar a ambientação e a cenografia.', true),
  (10, 'Briefing rápido da equipe no local', 'intra_evento', 'realizacao_inicio', 0, 'Dia do evento', 'Produção', 'Abrir a operação com um alinhamento rápido da equipe.', true),
  (11, 'Credenciamento e recepção dos participantes', 'intra_evento', 'realizacao_inicio', 0, 'Dia do evento', 'Operação', 'Receber e credenciar os participantes.', true),
  (12, 'Operação de palco e A/V (run of show)', 'intra_evento', 'realizacao_inicio', 0, 'Dia do evento', 'Produção', 'Conduzir o run of show e operar palco e A/V.', true),
  (13, 'Gestão da programação / cronometragem', 'intra_evento', 'realizacao_inicio', 0, 'Dia do evento', 'Produção', 'Controlar tempos e transições da programação.', true),
  (14, 'Coordenação de staff e fornecedores no local', 'intra_evento', 'realizacao_inicio', 0, 'Dia do evento', 'Operação', 'Coordenar staff e fornecedores durante o evento.', true),
  (15, 'Recepção e apoio aos palestrantes', 'intra_evento', 'realizacao_inicio', 0, 'Dia do evento', 'Operação', 'Receber e apoiar palestrantes (camarim, translado).', true),
  (16, 'Coffee breaks / alimentação no horário', 'intra_evento', 'realizacao_inicio', 0, 'Dia do evento', 'Operação', 'Garantir alimentação nos horários previstos.', true),
  (17, 'Registro de foto e vídeo conforme briefing', 'intra_evento', 'realizacao_inicio', 0, 'Dia do evento', 'Operação', 'Acompanhar o registro conforme o briefing.', true),
  (18, 'Ponto focal do cliente', 'intra_evento', 'realizacao_inicio', 0, 'Dia do evento', 'Sócio Atendimento', 'Acompanhar o cliente durante todo o evento.', true),
  (19, 'War room / gestão de imprevistos', 'intra_evento', 'realizacao_inicio', 0, 'Dia do evento', 'Produção', 'Ser o ponto focal para resolver imprevistos.', true),
  (20, 'Encerramento e início da desmontagem', 'intra_evento', 'realizacao_inicio', 0, 'Dia do evento', 'Operação', 'Encerrar a operação e iniciar a desmontagem.', true),
  (1, 'Desmontagem completa e devolução do espaço', 'pos_evento', 'realizacao_fim', 1, 'A. Encerramento e operação', 'Operação', 'Concluir a desmontagem e devolver o espaço.', true),
  (2, 'Conferência de pertences e devoluções', 'pos_evento', 'realizacao_fim', 1, 'A. Encerramento e operação', 'Operação', 'Conferir equipamentos, pertences e devoluções.', true),
  (3, 'Debriefing operacional interno', 'pos_evento', 'realizacao_fim', 1, 'A. Encerramento e operação', 'Produção', 'Retrospectiva: o que funcionou e o que travou.', true),
  (4, 'Coletar material de registro com fornecedores', 'pos_evento', 'realizacao_fim', 2, 'A. Encerramento e operação', 'Operação', 'Recolher fotos e vídeos com os fornecedores.', true),
  (5, 'Quitar passagens/hospedagem de palestrantes', 'pos_evento', 'realizacao_fim', 3, 'B. Financeiro do evento', 'Operação', 'Fechar pagamentos de passagens e hospedagem (alimenta Passagem).', true),
  (6, 'Terminar de pagar fornecedores', 'pos_evento', 'realizacao_fim', 5, 'B. Financeiro do evento', 'Financeiro', 'Quitar fornecedores conforme as condições (alimenta Evento_Fornecedor).', true),
  (7, 'Emissão de notas fiscais', 'pos_evento', 'realizacao_fim', 5, 'B. Financeiro do evento', 'Financeiro/Admin', 'Emitir as notas fiscais do evento.', true),
  (8, 'Fechamento financeiro + margem real', 'pos_evento', 'realizacao_fim', 10, 'B. Financeiro do evento', 'Produção', 'Consolidar receita − custos para apurar a margem real (campo derivado).', true),
  (9, 'Prestação de contas com o cliente', 'pos_evento', 'realizacao_fim', 10, 'B. Financeiro do evento', 'Sócio Atendimento', 'Apresentar a prestação de contas ao cliente.', true),
  (10, 'Enviar formulário de feedback', 'pos_evento', 'realizacao_fim', 1, 'C. Relacionamento e entregáveis', 'Operação', 'Enviar pesquisa de feedback a participantes e cliente.', true),
  (11, 'Reunião de fechamento / debriefing com o cliente', 'pos_evento', 'realizacao_fim', 5, 'C. Relacionamento e entregáveis', 'Sócio Atendimento', 'Fechar o ciclo com o cliente e levantar aprendizados.', true),
  (12, 'Coletar depoimento do cliente', 'pos_evento', 'realizacao_fim', 7, 'C. Relacionamento e entregáveis', 'Sócio Atendimento', 'Registrar depoimento/testemunho do cliente.', true),
  (13, 'Relatório/dossiê final do evento', 'pos_evento', 'realizacao_fim', 10, 'C. Relacionamento e entregáveis', 'Produção', 'Montar o dossiê final (resultados, registro, números).', true),
  (14, 'Entrega do material final ao cliente', 'pos_evento', 'realizacao_fim', 15, 'C. Relacionamento e entregáveis', 'Produção', 'Entregar fotos, vídeo e relatório ao cliente.', true),
  (15, 'Organizar conteúdo para redes', 'pos_evento', 'realizacao_fim', 1, 'D. Conteúdo e marketing', 'Marketing', 'Separar bastidores e highlights para as redes.', true),
  (16, 'Editar e publicar vídeo resumo', 'pos_evento', 'realizacao_fim', 10, 'D. Conteúdo e marketing', 'Marketing', 'Editar e publicar o vídeo resumo do evento.', true),
  (17, 'Avaliar e atualizar classificação dos fornecedores', 'pos_evento', 'realizacao_fim', 5, 'E. Memória do negócio', 'Produção', 'Atualizar Fornecedor.classificacao (confiável / mediano / black list).', true),
  (18, 'Debriefing de captação de patrocínios', 'pos_evento', 'realizacao_fim', 5, 'E. Memória do negócio', 'Patrocínios', 'Avaliar a captação de patrocínios (Fase 2; alimenta Patrocinador).', true),
  (19, 'Identificar oportunidade de renovação', 'pos_evento', 'realizacao_fim', 15, 'E. Memória do negócio', 'Sócio Atendimento', 'Abrir Oportunidade (origem = renovação) para o próximo ciclo.', true),
  (20, 'Encerrar o evento (status -> Encerrado)', 'pos_evento', 'realizacao_fim', 15, 'E. Memória do negócio', 'Produção', 'Mudar o status do evento para Encerrado e fechar o ciclo de vida.', true);

-- ── Gatilho: gera as tasks quando o evento entra em execução ─────────────────
CREATE OR REPLACE FUNCTION disparar_playbook()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  m            playbook_modelo%ROWTYPE;
  ancora_data  date;
BEGIN
  IF NEW.status = 'em_execucao'
     AND OLD.status IS DISTINCT FROM 'em_execucao'
     AND NEW.playbook_disparado_em IS NULL THEN

    FOR m IN SELECT * FROM playbook_modelo WHERE ativo ORDER BY lista, ordem LOOP
      ancora_data := CASE m.ancora
        WHEN 'inicio_organizacao' THEN NEW.data_inicio_organizacao
        WHEN 'realizacao_inicio'  THEN NEW.data_realizacao_inicio
        WHEN 'data_montagem'      THEN NEW.data_montagem
        WHEN 'realizacao_fim'     THEN NEW.data_realizacao_fim
      END;

      INSERT INTO task_projeto (nome, tipo, evento_id, data_fim, prioridade, status, descricao)
      VALUES (
        m.titulo,
        m.lista,
        NEW.id,
        CASE WHEN ancora_data IS NULL THEN NULL ELSE ancora_data + m.offset_dias END,
        m.prioridade_padrao,
        'a_fazer',
        m.descricao_padrao
      );
    END LOOP;

    NEW.playbook_disparado_em := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_disparar_playbook ON evento;
CREATE TRIGGER trg_disparar_playbook
  BEFORE UPDATE ON evento
  FOR EACH ROW EXECUTE FUNCTION disparar_playbook();
