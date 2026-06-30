-- Tokens pessoais de acesso ao servidor MCP (src/app/api/mcp).
-- Cada membro da equipe recebe um token; o servidor MCP valida o header
-- Authorization: Bearer <token> contra esta tabela usando a SERVICE ROLE
-- (que ignora o RLS). Por isso NÃO criamos policy para o papel `authenticated`:
-- nenhum usuário logado no app consegue ler/alterar os tokens — só o servidor.

create table if not exists mcp_token (
  id           uuid primary key default gen_random_uuid(),
  token        text unique not null,
  membro_email text not null,
  ativo        boolean not null default true,
  criado_em    timestamptz not null default now(),
  ultimo_uso   timestamptz
);

alter table mcp_token enable row level security;
-- (sem policies: acesso só via service_role, que faz bypass do RLS)

comment on table mcp_token is 'Tokens pessoais de acesso ao servidor MCP. Revogar = ativo=false.';
