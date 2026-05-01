-- ============================================
-- STRASBOURG BOUND — Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Rooms table (one per game session)
create table if not exists rooms (
  code text primary key,
  phase text not null default 'lobby',
  current_photo_idx integer not null default 0,
  current_question_idx integer not null default 0,
  revealed boolean not null default false,
  created_at timestamptz default now()
);

-- Players table
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  name text not null,
  joined_at timestamptz default now(),
  unique(room_code, name)
);

-- Captions table (one per player per photo)
create table if not exists captions (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  player_name text not null,
  photo_idx integer not null,
  text text not null,
  submitted_at timestamptz default now(),
  unique(room_code, player_name, photo_idx)
);

-- Votes table (one per player per question)
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  player_name text not null,
  question_idx integer not null,
  voted_for text not null,
  unique(room_code, player_name, question_idx)
);

-- Buddies table (one per award per room)
create table if not exists buddies (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  award_id text not null,
  winner_name text not null,
  buddy_name text not null,
  unique(room_code, award_id)
);

-- ============================================
-- Enable Row Level Security (open for now)
-- ============================================
alter table rooms enable row level security;
alter table players enable row level security;
alter table captions enable row level security;
alter table votes enable row level security;
alter table buddies enable row level security;

create policy "Allow all" on rooms for all using (true) with check (true);
create policy "Allow all" on players for all using (true) with check (true);
create policy "Allow all" on captions for all using (true) with check (true);
create policy "Allow all" on votes for all using (true) with check (true);
create policy "Allow all" on buddies for all using (true) with check (true);

-- Done! ✅
