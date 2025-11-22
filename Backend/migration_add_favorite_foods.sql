-- Migration: Add favorite_foods column to User table
-- Run this SQL in Supabase SQL Editor to add the favorite_foods column to existing databases

-- Add favorite_foods column if it doesn't exist
alter table "User" add column if not exists favorite_foods text;

-- Optional: Set default value for existing users (null is fine)
-- update "User" set favorite_foods = null where favorite_foods is null;

