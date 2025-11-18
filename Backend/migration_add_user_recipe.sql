-- Migration: Add UserRecipe table for storing user-created recipes
-- This separates user recipes from community posts
-- Run this in Supabase SQL editor

-- Create UserRecipe table
create table if not exists "UserRecipe" (
  recipe_id text primary key,
  user_id text references "User"(user_id) on delete cascade not null,
  recipe_title text not null,
  recipe_summary text,
  recipe_category text,
  prep_time_minutes integer,
  cook_time_minutes integer,
  total_time_minutes integer,
  servings integer,
  ingredients jsonb not null,
  steps jsonb not null,
  recipe_image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for better query performance
create index if not exists idx_user_recipe_user on "UserRecipe" (user_id);
create index if not exists idx_user_recipe_created on "UserRecipe" (created_at desc);
create index if not exists idx_user_recipe_category on "UserRecipe" (recipe_category);

-- Enable RLS
alter table "UserRecipe" enable row level security;

-- Create permissive policy for backend use
drop policy if exists user_recipe_all on "UserRecipe";
create policy user_recipe_all on "UserRecipe" for all using (true) with check (true);

