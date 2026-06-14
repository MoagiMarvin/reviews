-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste this → Run

-- 1. Add settings toggle to businesses
alter table businesses 
add column if not exists allow_workers_to_see_ratings boolean not null default true;

-- 2. Add worker_id to requests table
alter table requests 
add column if not exists worker_id uuid references workers(id) on delete set null;

-- 3. Add worker_id and request_id to reviews table
alter table reviews 
add column if not exists worker_id uuid references workers(id) on delete set null,
add column if not exists request_id uuid references requests(id) on delete set null;

-- 4. Add indexes for faster querying
create index if not exists requests_worker_id_idx on requests(worker_id);
create index if not exists reviews_worker_id_idx on reviews(worker_id);
create index if not exists reviews_request_id_idx on reviews(request_id);
