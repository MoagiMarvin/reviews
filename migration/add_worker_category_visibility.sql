-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste this → Run

-- Add worker_visible_categories array column to businesses table
alter table businesses 
add column if not exists worker_visible_categories text[];
