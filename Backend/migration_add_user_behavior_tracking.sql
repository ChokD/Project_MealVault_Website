-- User Behavior Tracking Tables for AI Recommendations
-- Run this in Supabase SQL editor to add AI tracking features

-- Table to track menu views
create table if not exists "UserMenuView" (
  id uuid primary key default gen_random_uuid(),
  user_id text references "User"(user_id) on delete cascade,
  menu_id text references "Menu"(menu_id) on delete cascade,
  view_count integer default 1,
  last_viewed_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, menu_id)
);

-- Table to track post views
create table if not exists "UserPostView" (
  id uuid primary key default gen_random_uuid(),
  user_id text references "User"(user_id) on delete cascade,
  cpost_id text references "CommunityPost"(cpost_id) on delete cascade,
  view_count integer default 1,
  last_viewed_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, cpost_id)
);

-- Table to track search history
create table if not exists "UserSearchHistory" (
  id uuid primary key default gen_random_uuid(),
  user_id text references "User"(user_id) on delete cascade,
  search_query text not null,
  search_type text check (search_type in ('menu', 'recipe', 'ingredient', 'community')),
  result_count integer default 0,
  created_at timestamptz default now()
);

-- Table to track ingredient preferences from behavior
create table if not exists "UserIngredientPreference" (
  id uuid primary key default gen_random_uuid(),
  user_id text references "User"(user_id) on delete cascade,
  ingredient_name text not null,
  preference_score float default 0.0, -- Positive for liked, negative for disliked
  interaction_count integer default 0,
  last_updated timestamptz default now(),
  unique (user_id, ingredient_name)
);

-- Table to track category preferences
create table if not exists "UserCategoryPreference" (
  id uuid primary key default gen_random_uuid(),
  user_id text references "User"(user_id) on delete cascade,
  category_id text references "Category"(category_id) on delete cascade,
  preference_score float default 0.0,
  interaction_count integer default 0,
  last_updated timestamptz default now(),
  unique (user_id, category_id)
);

-- Table for AI-detected duplicate content
create table if not exists "ContentDuplicateDetection" (
  id uuid primary key default gen_random_uuid(),
  source_type text check (source_type in ('recipe', 'post')),
  source_id text not null,
  duplicate_id text not null,
  similarity_score float not null, -- 0.0 to 1.0
  detection_date timestamptz default now(),
  is_confirmed boolean default false,
  reviewed_by text references "User"(user_id) on delete set null,
  review_date timestamptz
);

-- Table for content moderation
create table if not exists "ContentModeration" (
  id uuid primary key default gen_random_uuid(),
  content_type text check (content_type in ('post', 'comment', 'recipe')),
  content_id text not null,
  moderation_reason text not null,
  detected_words text[],
  severity text check (severity in ('low', 'medium', 'high', 'critical')),
  is_auto_hidden boolean default false,
  detection_date timestamptz default now(),
  reviewed boolean default false,
  reviewed_by text references "User"(user_id) on delete set null,
  review_date timestamptz,
  review_action text check (review_action in ('approved', 'rejected', 'edited'))
);

-- Indexes for performance
create index if not exists idx_menu_view_user on "UserMenuView" (user_id);
create index if not exists idx_menu_view_menu on "UserMenuView" (menu_id);
create index if not exists idx_post_view_user on "UserPostView" (user_id);
create index if not exists idx_search_history_user on "UserSearchHistory" (user_id);
create index if not exists idx_search_history_date on "UserSearchHistory" (created_at desc);
create index if not exists idx_ingredient_pref_user on "UserIngredientPreference" (user_id);
create index if not exists idx_category_pref_user on "UserCategoryPreference" (user_id);
create index if not exists idx_duplicate_source on "ContentDuplicateDetection" (source_type, source_id);
create index if not exists idx_moderation_content on "ContentModeration" (content_type, content_id);
create index if not exists idx_moderation_date on "ContentModeration" (detection_date desc);

-- Enable RLS
alter table "UserMenuView" enable row level security;
alter table "UserPostView" enable row level security;
alter table "UserSearchHistory" enable row level security;
alter table "UserIngredientPreference" enable row level security;
alter table "UserCategoryPreference" enable row level security;
alter table "ContentDuplicateDetection" enable row level security;
alter table "ContentModeration" enable row level security;

-- RLS Policies
create policy user_menu_view_all on "UserMenuView" for all using (true) with check (true);
create policy user_post_view_all on "UserPostView" for all using (true) with check (true);
create policy user_search_history_all on "UserSearchHistory" for all using (true) with check (true);
create policy user_ingredient_pref_all on "UserIngredientPreference" for all using (true) with check (true);
create policy user_category_pref_all on "UserCategoryPreference" for all using (true) with check (true);
create policy content_duplicate_all on "ContentDuplicateDetection" for all using (true) with check (true);
create policy content_moderation_all on "ContentModeration" for all using (true) with check (true);
