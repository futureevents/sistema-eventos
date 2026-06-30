-- Provisiona automaticamente um token MCP para CADA usuário do sistema:
-- todo mundo cadastrado no sistema-eventos passa a poder conectar o Claude Code,
-- sem ninguém gerar token na mão. Cada pessoa pega o seu token na página
-- /configuracoes/mcp dentro do sistema.

create or replace function gerar_mcp_token_para_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is not null
     and not exists (select 1 from mcp_token where membro_email = new.email) then
    insert into mcp_token (token, membro_email)
    values (encode(gen_random_bytes(24), 'hex'), new.email);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_gerar_mcp_token on auth.users;
create trigger trg_gerar_mcp_token
  after insert on auth.users
  for each row execute function gerar_mcp_token_para_usuario();

-- Backfill: cria token para quem já tem login e ainda não tem token.
insert into mcp_token (token, membro_email)
select encode(gen_random_bytes(24), 'hex'), u.email
from auth.users u
where u.email is not null
  and not exists (select 1 from mcp_token t where t.membro_email = u.email);
