-- Tabela de processos internos (Gestão › Processos)
create table if not exists task_processo (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('entrada_cliente','projetos','cientifico','marketing','comercial','juridico')),
  nome        text not null default '',
  status      text not null default 'para_fazer' check (status in ('para_fazer','desenhando','ativo','descartado')),
  descricao   text,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Índice para filtros por tipo
create index if not exists task_processo_tipo_idx on task_processo (tipo);

-- Trigger para atualizar atualizado_em
create or replace function set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger task_processo_atualizado_em
  before update on task_processo
  for each row execute function set_atualizado_em();

-- RLS
alter table task_processo enable row level security;

create policy "auth users can do everything on task_processo"
  on task_processo for all
  to authenticated
  using (true)
  with check (true);
