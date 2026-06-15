-- Enums
create type status_evento as enum (
  'backlog',
  'em_aberto',
  'em_execucao',
  'realizado',
  'encerrado',
  'cancelado'
);

-- Tabela de clientes (referenciada por evento)
create table if not exists cliente (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  email         text,
  telefone      text,
  empresa       text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Tabela principal de eventos
create table if not exists evento (
  id                      uuid primary key default gen_random_uuid(),
  nome                    text not null,
  status                  status_evento not null default 'backlog',
  cliente_id              uuid references cliente(id),
  data_inicio_organizacao date,
  data_montagem           date,
  data_realizacao_inicio  date,
  data_realizacao_fim     date,
  local                   text,
  descricao               text,
  playbook_disparado_em   timestamptz,
  criado_em               timestamptz not null default now(),
  atualizado_em           timestamptz not null default now()
);

-- RLS
alter table cliente enable row level security;
alter table evento enable row level security;

create policy "Autenticados leem clientes"
  on cliente for select to authenticated using (true);

create policy "Autenticados gerenciam clientes"
  on cliente for all to authenticated using (true) with check (true);

create policy "Autenticados leem eventos"
  on evento for select to authenticated using (true);

create policy "Autenticados gerenciam eventos"
  on evento for all to authenticated using (true) with check (true);

-- Trigger atualizado_em
create or replace function set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger trg_cliente_atualizado_em
  before update on cliente
  for each row execute function set_atualizado_em();

create trigger trg_evento_atualizado_em
  before update on evento
  for each row execute function set_atualizado_em();
