-- Habilita RLS nas 6 tabelas de anatomia da Task que estavam sem tranca.
-- Policy uniforme: authenticated USING(true) WITH CHECK(true) — mesmo padrão
-- das tabelas principais (evento, cliente, task_projeto, etc.).

ALTER TABLE public.task_comment         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_item   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activity         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachment       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_fornecedor     ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'task_comment', 'task_checklist', 'task_checklist_item',
    'task_activity', 'task_attachment', 'evento_fornecedor'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = 'auth users full access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "auth users full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        tbl
      );
    END IF;
  END LOOP;
END$$;
