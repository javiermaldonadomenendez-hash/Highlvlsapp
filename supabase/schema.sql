-- ============================================================
-- HIGHLEVELS — Supabase Schema
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

-- TEAMS
create table if not exists teams (
  key        text primary key,   -- 'kurosch', 'michael', 'lucas'
  name       text not null,
  bws_max    int  default 500000,
  bws_challenges jsonb default '[]',
  bws_marks       jsonb default '[]',
  created_at timestamptz default now()
);

-- USERS
create table if not exists users (
  id         serial primary key,
  name       text not null,
  role       text not null,        -- CC, SC, JC, Trainee
  team_key   text references teams(key),
  pin        text not null,
  is_leader  boolean default false,
  active     boolean default true,
  created_at timestamptz default now()
);

-- CUSTOM PINS (user-changeable)
create table if not exists custom_pins (
  user_id int primary key references users(id) on delete cascade,
  pin     text not null,
  updated_at timestamptz default now()
);

-- QUEST COMPLETIONS (daily, per user)
create table if not exists quest_completions (
  id       bigserial primary key,
  user_id  int  references users(id) on delete cascade,
  quest_id text not null,
  day_key  text not null,          -- 'YYYY-M-D'
  xp_earned int default 0,
  created_at timestamptz default now(),
  unique(user_id, quest_id, day_key)
);

-- MASSNAHMEN (daily, per user, popa/poku)
create table if not exists massnahmen (
  id      bigserial primary key,
  user_id int  references users(id) on delete cascade,
  type    text not null,           -- 'popa' | 'poku'
  day_key text not null,
  person  text default '',
  item1   text default '',
  item2   text default '',
  item3   text default '',
  updated_at timestamptz default now(),
  unique(user_id, type, day_key)
);

-- KPI ENTRIES (weekly, per user, per KPI)
create table if not exists kpi_entries (
  id       bigserial primary key,
  user_id  int  references users(id) on delete cascade,
  kpi_id   text not null,
  week_key text not null,          -- 'YYYY-WN'
  values   jsonb default '[]',     -- array of strings (text inputs)
  slider_value int default null,   -- for tel_5h / wuc_30
  updated_at timestamptz default now(),
  unique(user_id, kpi_id, week_key)
);

-- BWS ENTRIES (monthly, per user)
create table if not exists bws_entries (
  id        bigserial primary key,
  user_id   int  references users(id) on delete cascade,
  month_key text not null,         -- 'YYYY-M'
  value     numeric default 0,
  updated_at timestamptz default now(),
  unique(user_id, month_key)
);

-- USER XP + STREAK
create table if not exists user_xp (
  user_id           int primary key references users(id) on delete cascade,
  xp                int default 0,
  streak_count      int default 0,
  streak_last_day   text default ''
);

-- CONTACTS (per user)
create table if not exists contacts (
  id         uuid primary key default gen_random_uuid(),
  user_id    int  references users(id) on delete cascade,
  first_name text default '',
  last_name  text default '',
  phone      text default '',
  birthday   text default '',
  bedarf     text default '',
  type       text default 'popa',  -- 'popa' | 'poku'
  emoji      text default '😊',
  created_at timestamptz default now()
);

-- PINBOARD (per user)
create table if not exists pinboard (
  user_id  int primary key references users(id) on delete cascade,
  notes    text default '',
  thoughts text default '',
  tasks    jsonb default '[]',
  updated_at timestamptz default now()
);

-- PUSH SUBSCRIPTIONS
create table if not exists push_subscriptions (
  user_id      int primary key references users(id) on delete cascade,
  subscription jsonb not null,
  updated_at   timestamptz default now()
);

-- SUB-TEAM T1 WETTBEWERB (monatlich, pro User)
create table if not exists sub_team_t1 (
  user_id    int  references users(id) on delete cascade,
  month_key  text not null,
  count      int  default 0,
  updated_at timestamptz default now(),
  primary key (user_id, month_key)
);

-- TOP-KONTAKTE (Top-PoPa / Top-Kunden pro User)
create table if not exists top_contacts (
  id         uuid primary key default gen_random_uuid(),
  user_id    int  references users(id) on delete cascade,
  type       text not null,  -- 'popa' | 'kunde'
  name       text not null,
  notes      text default '',
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table users              enable row level security;
alter table quest_completions  enable row level security;
alter table massnahmen         enable row level security;
alter table kpi_entries        enable row level security;
alter table bws_entries        enable row level security;
alter table user_xp            enable row level security;
alter table contacts           enable row level security;
alter table pinboard           enable row level security;
alter table push_subscriptions enable row level security;
alter table custom_pins        enable row level security;
alter table sub_team_t1        enable row level security;
alter table top_contacts       enable row level security;

-- Für die App: Service-Role-Key auf dem Server hat vollen Zugriff.
-- Anon-Key darf NICHTS lesen (alle Daten werden server-seitig geladen).
-- Das schützt PINs und Leistungsdaten vor direktem Browser-Zugriff.
drop policy if exists "No anon read" on users;
drop policy if exists "No anon read" on quest_completions;
drop policy if exists "No anon read" on massnahmen;
drop policy if exists "No anon read" on kpi_entries;
drop policy if exists "No anon read" on bws_entries;
drop policy if exists "No anon read" on user_xp;
drop policy if exists "No anon read" on contacts;
drop policy if exists "No anon read" on pinboard;
drop policy if exists "No anon read" on push_subscriptions;
drop policy if exists "No anon read" on custom_pins;
drop policy if exists "No anon read" on sub_team_t1;
drop policy if exists "No anon read" on top_contacts;

create policy "No anon read" on users for select using (false);
create policy "No anon read" on quest_completions for select using (false);
create policy "No anon read" on massnahmen for select using (false);
create policy "No anon read" on kpi_entries for select using (false);
create policy "No anon read" on bws_entries for select using (false);
create policy "No anon read" on user_xp for select using (false);
create policy "No anon read" on contacts for select using (false);
create policy "No anon read" on pinboard for select using (false);
create policy "No anon read" on push_subscriptions for select using (false);
create policy "No anon read" on custom_pins for select using (false);
create policy "No anon read" on sub_team_t1 for select using (false);
create policy "No anon read" on top_contacts for select using (false);

-- ============================================================
-- SEED: TEAMS
-- ============================================================
insert into teams (key, name, bws_max, bws_challenges, bws_marks) values
('kurosch', 'Team Kurosch', 500000,
  '[{"threshold":250000,"label":"Diplomat Kugelschreiber","badge":"bws-badge prem","icon":"🖊️"},{"threshold":500000,"label":"Montblanc Kugelschreiber","badge":"bws-badge ultra","icon":"🖊️"}]',
  '[{"pct":50,"label":"250K"}]'
),
('michael', 'Team Michael', 500000,
  '[{"threshold":250000,"label":"Diplomat Kugelschreiber","badge":"bws-badge prem","icon":"🖊️"},{"threshold":500000,"label":"Montblanc Kugelschreiber","badge":"bws-badge ultra","icon":"🖊️"}]',
  '[{"pct":50,"label":"250K"}]'
),
('lucas', 'Team Lucas', 500000,
  '[{"threshold":250000,"label":"Diplomat Kugelschreiber","badge":"bws-badge prem","icon":"🖊️"},{"threshold":500000,"label":"Montblanc Kugelschreiber","badge":"bws-badge ultra","icon":"🖊️"}]',
  '[{"pct":50,"label":"250K"}]'
)
on conflict (key) do nothing;

-- ============================================================
-- SEED: USERS
-- ============================================================
insert into users (id, name, role, team_key, pin, is_leader) values
-- Team Kurosch
(14, 'Kurosch',   'CC',      'kurosch', '1414', true),
(13, 'Sepehr',    'SC',      'kurosch', '1313', true),
(12, 'Javier',    'SC',      'kurosch', '0000', true),
(1,  'Gian Luca', 'JC',      'kurosch', '1111', false),
(15, 'Max',       'Trainee', 'kurosch', '1515', false),
(16, 'Laurin',    'Trainee', 'kurosch', '1616', false),
(9,  'Niklas',    'Trainee', 'kurosch', '9999', false),
(10, 'Bedirhan',  'Trainee', 'kurosch', '1010', false),
(11, 'Gregor',    'Trainee', 'kurosch', '1100', false),
(39, 'Kira',      'Trainee', 'kurosch', '3939', false),
(40, 'Nikita',    'Trainee', 'kurosch', '4040', false),
(41, 'Samuel',    'Trainee', 'kurosch', '4141', false),
(42, 'Felix',     'Trainee', 'kurosch', '4242', false),
(43, 'Luca K',    'Trainee', 'kurosch', '4343', false),
(44, 'Patrik',    'Trainee', 'kurosch', '4444', false),
-- Team Michael
(20, 'Michael',   'CC',      'michael', '2020', true),
(21, 'Elias',     'JC',      'michael', '2121', false),
(22, 'Karsten',   'JC',      'michael', '2222', false),
(24, 'Arthur',    'JC',      'michael', '2424', false),
(26, 'Janning',   'JC',      'michael', '2626', false),
(6,  'Luca M',    'Trainee', 'michael', '6666', false),
(23, 'Nick',      'Trainee', 'michael', '2323', false),
(25, 'Jan',       'Trainee', 'michael', '2525', false),
(27, 'Dennis',    'Trainee', 'michael', '2727', false),
(28, 'Furkan',    'Trainee', 'michael', '2828', false),
-- Team Lucas
(30, 'Lucas Lindemann',    'CC', 'lucas', '3030', true),
(34, 'Marco Jaspers',      'SC', 'lucas', '3434', false),
(38, 'Fabian Terstappen',  'SC', 'lucas', '3838', false),
(33, 'Finn Haren',         'JC', 'lucas', '3333', false),
(35, 'Marvin Sobczyk',     'JC', 'lucas', '3535', false),
(36, 'Niels Scherbarth',   'JC', 'lucas', '3636', false),
(31, 'Emre Acikgöz',       'Trainee', 'lucas', '3131', false),
(32, 'Leon Amaritza',      'Trainee', 'lucas', '3232', false),
(37, 'Oliwier Schab',      'Trainee', 'lucas', '3737', false)
on conflict (id) do nothing;

-- XP rows für alle User anlegen
insert into user_xp (user_id) select id from users on conflict do nothing;

-- ============================================================
-- RPC: increment_xp
-- Atomic XP increment — called by server actions via supabaseAdmin
-- ============================================================
create or replace function increment_xp(p_user_id int, p_amount int)
returns void language plpgsql security definer as $$
begin
  insert into user_xp (user_id, xp)
  values (p_user_id, p_amount)
  on conflict (user_id) do update
    set xp = user_xp.xp + excluded.xp;
end;
$$;
