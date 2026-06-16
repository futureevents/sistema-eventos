-- Tabela de histórico
create table task_activity (
  id         uuid        primary key default gen_random_uuid(),
  task_id    uuid        not null,
  task_table text        not null,
  actor      text        not null default 'Sistema',
  type       text        not null, -- 'created' | 'updated'
  payload    jsonb       not null default '{}',
  criado_em  timestamptz not null default now()
);

create index on task_activity (task_table, task_id, criado_em);

-- Função genérica de log
create or replace function fn_log_task_activity()
returns trigger language plpgsql as $$
declare
  changes jsonb := '{}';
  col     text;
  skip    text[] := array['criado_em','updated_at','atualizado_em'];
begin
  if TG_OP = 'INSERT' then
    insert into task_activity (task_id, task_table, type, payload)
    values (NEW.id, TG_TABLE_NAME, 'created', '{}');

  elsif TG_OP = 'UPDATE' then
    for col in
      select key from jsonb_each(to_jsonb(NEW))
    loop
      continue when col = any(skip);
      if (to_jsonb(NEW) ->> col) is distinct from (to_jsonb(OLD) ->> col) then
        changes := changes || jsonb_build_object(
          col, jsonb_build_object(
            'de',   to_jsonb(OLD) ->> col,
            'para', to_jsonb(NEW) ->> col
          )
        );
      end if;
    end loop;
    if changes != '{}'::jsonb then
      insert into task_activity (task_id, task_table, type, payload)
      values (NEW.id, TG_TABLE_NAME, 'updated', changes);
    end if;
  end if;

  return NEW;
end;
$$;

-- Trigger em task_projeto
create trigger trg_task_projeto_activity
  after insert or update on task_projeto
  for each row execute function fn_log_task_activity();

-- Trigger em cliente
create trigger trg_cliente_activity
  after insert or update on cliente
  for each row execute function fn_log_task_activity();

-- Trigger em fornecedor
create trigger trg_fornecedor_activity
  after insert or update on fornecedor
  for each row execute function fn_log_task_activity();

-- Trigger em evento
create trigger trg_evento_activity
  after insert or update on evento
  for each row execute function fn_log_task_activity();
