-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste this → Run

create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  username text not null,
  password_hash text not null,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, username)
);

-- Only the service role (your server) can read/write workers
-- No public access needed since all queries go through your API routes
alter table workers enable row level security;

-- Allow the service role full access (your API uses the service role key)
create policy "Service role full access"
  on workers
  for all
  to service_role
  using (true)
  with check (true);
