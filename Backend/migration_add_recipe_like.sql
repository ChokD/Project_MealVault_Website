-- Migration: Add like functionality for UserRecipe
-- Run this in Supabase SQL editor

-- Create UserRecipeLike table
create table if not exists "UserRecipeLike" (
  id bigserial primary key,
  recipe_id text references "UserRecipe"(recipe_id) on delete cascade,
  user_id text references "User"(user_id) on delete cascade,
  created_at timestamptz default now(),
  unique (recipe_id, user_id)
);

-- Add like_count column to UserRecipe if it doesn't exist
alter table "UserRecipe" 
add column if not exists like_count integer default 0;

-- Create index for better performance
create index if not exists idx_user_recipe_like_recipe on "UserRecipeLike" (recipe_id);
create index if not exists idx_user_recipe_like_user on "UserRecipeLike" (user_id);

-- Enable RLS
alter table "UserRecipeLike" enable row level security;

-- Create permissive policy for backend use
drop policy if exists user_recipe_like_all on "UserRecipeLike";
create policy user_recipe_like_all on "UserRecipeLike" for all using (true) with check (true);

