-- Remove toda a infra do MCP antigo (o MCP será reconstruído do zero).
-- Reverte: 20260630..._mcp_token, 20260630..._mcp_token_auto,
--          20260701..._fix_mcp_token_trigger_searchpath.
-- Ordem: trigger -> função -> tabela.

drop trigger if exists trg_gerar_mcp_token on auth.users;
drop function if exists public.gerar_mcp_token_para_usuario() cascade;
drop table if exists public.mcp_token cascade;
