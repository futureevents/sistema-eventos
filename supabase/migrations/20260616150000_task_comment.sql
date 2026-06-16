create table task_comment (
  id         uuid        primary key default gen_random_uuid(),
  task_id    uuid        not null,
  task_table text        not null,
  author     text        not null default 'Usuário',
  body       text        not null,
  criado_em  timestamptz not null default now()
);

create index on task_comment (task_table, task_id, criado_em);
