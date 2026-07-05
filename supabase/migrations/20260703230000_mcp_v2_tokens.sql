-- Infra de tokens do MCP v2 (reconstruído do zero).
-- 1 token pessoal por membro; a autorização do servidor MCP é este token.

create table if not exists public.mcp_token (
  token text primary key,
  membro_email text not null unique,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  ultimo_uso timestamptz
);

-- RLS ligado SEM policy: só o service_role (usado pelo servidor MCP) acessa.
alter table public.mcp_token enable row level security;

-- Gera um token opaco de 64 hex, sem depender de extensão (gen_random_uuid é nativo).
create or replace function public.gerar_mcp_token_para_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.mcp_token (token, membro_email)
  values (
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    new.email
  )
  on conflict (membro_email) do nothing;
  return new;
end;
$$;

-- Cada novo usuário ganha 1 token automaticamente no cadastro.
drop trigger if exists trg_gerar_mcp_token on auth.users;
create trigger trg_gerar_mcp_token
  after insert on auth.users
  for each row execute function public.gerar_mcp_token_para_usuario();

-- Backfill: gera token para quem já existe.
insert into public.mcp_token (token, membro_email)
select
  replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  u.email
from auth.users u
where u.email is not null
on conflict (membro_email) do nothing;
