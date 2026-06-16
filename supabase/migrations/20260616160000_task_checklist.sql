create table task_checklist (
  id         uuid        primary key default gen_random_uuid(),
  task_id    uuid        not null,
  task_table text        not null,
  title      text        not null default 'Checklist',
  posicao    int         not null default 0,
  criado_em  timestamptz not null default now()
);

create table task_checklist_item (
  id           uuid        primary key default gen_random_uuid(),
  checklist_id uuid        not null references task_checklist(id) on delete cascade,
  label        text        not null,
  done         boolean     not null default false,
  posicao      int         not null default 0,
  criado_em    timestamptz not null default now()
);

create index on task_checklist (task_table, task_id, posicao);
create index on task_checklist_item (checklist_id, posicao);
