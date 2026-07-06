-- Coluna dedicada ao "Briefing do lead" na Prospecção Ativa.
-- A IA preenche este bloco na etapa 1 (curadoria); a `descricao` fica reservada
-- para notas de reunião de fechamento. Mudança não-destrutiva (coluna nullable).
alter table task_oportunidade add column if not exists briefing_lead text;
