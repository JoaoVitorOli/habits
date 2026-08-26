-- Espelho do SQLite em src/data/schema.ts, coluna por coluna, para o sync ser um laco burro
-- e nao um tradutor. Rode uma vez no SQL Editor do projeto Supabase.
--
-- `settings` e `sync_state` nao estao aqui de proposito: a virada do dia e o cursor sao
-- decisoes deste aparelho, nao da conta.

create table if not exists habits (
  id text primary key,
  user_id text not null,
  name text not null,
  description text,
  icon text not null,
  color text not null,
  schedule_kind text not null,
  schedule_days integer,
  schedule_times integer,
  target_per_day integer not null default 1,
  streak_goal integer,
  reminder_time text,
  position integer not null,
  archived_at text,
  created_at text not null,
  updated_at text not null,
  deleted_at text
);

create table if not exists completions (
  id text primary key,
  habit_id text not null references habits (id) on delete cascade,
  day text not null,
  count integer not null default 0,
  completed_at text not null,
  updated_at text not null,
  deleted_at text,
  unique (habit_id, day)
);

create table if not exists day_notes (
  id text primary key,
  habit_id text not null references habits (id) on delete cascade,
  day text not null,
  text text not null,
  updated_at text not null,
  deleted_at text,
  unique (habit_id, day)
);

create index if not exists habits_updated_at_idx on habits (updated_at);
create index if not exists completions_updated_at_idx on completions (updated_at);
create index if not exists day_notes_updated_at_idx on day_notes (updated_at);

-- O delta pergunta "o que mudou depois de X" filtrando tambem pelo dono, e o dono das
-- marcacoes e das notas e o dono do habito: uma coluna a menos para o sync manter em dia.
alter table habits enable row level security;
alter table completions enable row level security;
alter table day_notes enable row level security;

create policy "habits sao do dono" on habits
  for all using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);

create policy "completions seguem o habito" on completions
  for all using (
    exists (select 1 from habits h where h.id = habit_id and h.user_id = auth.uid()::text)
  ) with check (
    exists (select 1 from habits h where h.id = habit_id and h.user_id = auth.uid()::text)
  );

create policy "notas seguem o habito" on day_notes
  for all using (
    exists (select 1 from habits h where h.id = habit_id and h.user_id = auth.uid()::text)
  ) with check (
    exists (select 1 from habits h where h.id = habit_id and h.user_id = auth.uid()::text)
  );

-- Copia de seguranca da conta: uma linha por usuario, trocada inteira a cada backup.
-- Nao e o sync — o sync espelha o estado de agora, e este e o estado de um dia especifico,
-- para quando o "agora" estiver errado e ja tiver viajado para os outros aparelhos.
create table if not exists backups (
  user_id text primary key,
  payload jsonb not null,
  updated_at text not null
);

alter table backups enable row level security;

create policy "backup e do dono" on backups
  for all using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
