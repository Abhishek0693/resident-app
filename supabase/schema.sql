-- ─────────────────────────────────────────────
-- NIWAS — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Buildings ───────────────────────────────
create table buildings (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  map_url     text,
  floors      int default 1,
  total_units int default 0,
  water_cost       int default 0,
  cleaning_cost    int default 0,
  security_cost    int default 0,
  created_at  timestamptz default now()
);

-- ─── Units ───────────────────────────────────
create table units (
  id                        uuid primary key default gen_random_uuid(),
  building_id               uuid references buildings(id) on delete cascade,
  floor                     int not null,
  unit_number               text not null,
  status                    text default 'vacant' check (status in ('occupied','vacant','maintenance')),
  rent                      int default 0,
  advance                   int default 0,
  maintenance_fee           int default 0,
  electricity_account_number text,
  created_at                timestamptz default now()
);

-- ─── Residents ───────────────────────────────
create table residents (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  phone            text,
  email            text,
  aadhaar          text,
  building_id      uuid references buildings(id),
  unit_id          uuid references units(id),
  move_in_date     date,
  move_out_date    date,
  renewal_date     date,
  renewed_rent     int,
  property_type    text default 'rental' check (property_type in ('rental','lease')),
  payment_timing   text default 'after' check (payment_timing in ('before','after')),
  occupants        int default 1,
  created_at       timestamptz default now()
);

-- ─── Vehicles ────────────────────────────────
create table vehicles (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid references units(id) on delete cascade,
  type        text,
  number      text,
  model       text
);

-- ─── Payments ────────────────────────────────
create table payments (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid references units(id),
  resident_id  uuid references residents(id),
  building_id  uuid references buildings(id),
  month        text not null,
  year         int not null,
  rent         int default 0,
  maintenance  int default 0,
  status       text default 'due' check (status in ('paid','partial','due')),
  paid_amount  int default 0,
  paid_by      text,
  note         text,
  date         date default current_date,
  created_at   timestamptz default now(),
  unique (unit_id, month, year)
);

-- ─── Notices ─────────────────────────────────
create table notices (
  id          uuid primary key default gen_random_uuid(),
  building_id uuid references buildings(id) on delete cascade,
  title       text not null,
  body        text,
  priority    text default 'normal' check (priority in ('normal','high')),
  date        date default current_date,
  created_at  timestamptz default now()
);

-- ─── Documents ───────────────────────────────
create table documents (
  id          uuid primary key default gen_random_uuid(),
  resident_id uuid references residents(id) on delete cascade,
  type        text,
  name        text not null,
  expiry      date,
  file_path   text,
  uploaded    date default current_date,
  created_at  timestamptz default now()
);

-- ─── Maintenance Requests ────────────────────
create table maintenance_requests (
  id          uuid primary key default gen_random_uuid(),
  resident_id uuid references residents(id) on delete cascade,
  title       text not null,
  description text,
  category    text,
  urgency     text default 'normal' check (urgency in ('low','normal','high')),
  status      text default 'open' check (status in ('open','in_progress','resolved')),
  date        date default current_date,
  created_at  timestamptz default now()
);

-- ─── FCM Tokens (for push notifications) ────
create table fcm_tokens (
  id          uuid primary key default gen_random_uuid(),
  resident_id uuid references residents(id) on delete cascade,
  token       text unique not null,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Row Level Security (RLS)
-- ─────────────────────────────────────────────
alter table buildings           enable row level security;
alter table units               enable row level security;
alter table residents           enable row level security;
alter table payments            enable row level security;
alter table notices             enable row level security;
alter table documents           enable row level security;
alter table maintenance_requests enable row level security;
alter table vehicles            enable row level security;
alter table fcm_tokens          enable row level security;

-- Allow all authenticated users to read/write for now (tighten later)
create policy "auth_all" on buildings            for all using (auth.role() = 'authenticated');
create policy "auth_all" on units                for all using (auth.role() = 'authenticated');
create policy "auth_all" on residents            for all using (auth.role() = 'authenticated');
create policy "auth_all" on payments             for all using (auth.role() = 'authenticated');
create policy "auth_all" on notices              for all using (auth.role() = 'authenticated');
create policy "auth_all" on documents            for all using (auth.role() = 'authenticated');
create policy "auth_all" on maintenance_requests for all using (auth.role() = 'authenticated');
create policy "auth_all" on vehicles             for all using (auth.role() = 'authenticated');
create policy "auth_all" on fcm_tokens           for all using (auth.role() = 'authenticated');
