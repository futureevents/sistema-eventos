-- Correção: o trigger de auto-provisão de mcp_token chama gen_random_bytes
-- (pgcrypto, schema `extensions`). Com search_path só em `public`, a criação de
-- QUALQUER novo usuário em auth.users falhava — quebrando o cadastro de membros
-- (botão "Adicionar pessoa") e a API admin de auth. Inclui `extensions` no path.

create or replace function public.gerar_mcp_token_para_usuario()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
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
