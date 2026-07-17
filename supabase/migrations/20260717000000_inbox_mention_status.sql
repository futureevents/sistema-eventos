-- Estado por-usuário das menções do Inbox.
-- Linha presente = menção "fechada" (resolvida) para aquele usuário;
-- ausência de linha = menção "em aberto".
create table if not exists public.mention_status (
  comment_id   uuid        not null references public.task_comment(id) on delete cascade,
  user_id      uuid        not null,
  resolvido_em timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists idx_mention_status_user on public.mention_status (user_id);

-- RLS: mesmo padrão uniforme das demais tabelas (authenticated full access).
-- O recorte por-usuário é garantido pela aplicação, que sempre grava/filtra
-- pelo user_id do usuário logado.
alter table public.mention_status enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'mention_status' and policyname = 'auth users full access'
  ) then
    create policy "auth users full access" on public.mention_status
      for all to authenticated using (true) with check (true);
  end if;
end$$;
