-- Supabase schema for MealVault (Postgres-compatible)
-- Run this in Supabase SQL editor before deploying backend changes

create table if not exists "User" (
  user_id text primary key,
  user_email text unique not null,
  user_fname text not null,
  user_lname text,
  user_password text not null,
  user_tel text,
  calorie_limit integer,
  allergies text,
  favorite_foods text,
  reset_password_token text,
  reset_password_expires timestamptz
);

create table if not exists "Admin" (
  admin_id text primary key references "User"(user_id) on delete cascade
);

create table if not exists "Category" (
  category_id text primary key,
  category_name text not null
);

create table if not exists "Menu" (
  menu_id text primary key,
  menu_name text not null,
  menu_description text,
  menu_recipe text,
  menu_image text,
  menu_datetime timestamptz default now(),
  user_id text references "User"(user_id) on delete set null,
  category_id text references "Category"(category_id) on delete set null,
  menu_like_count integer default 0
);

create table if not exists "MenuLike" (
  id bigserial primary key,
  menu_id text references "Menu"(menu_id) on delete cascade,
  user_id text references "User"(user_id) on delete cascade,
  created_at timestamptz default now(),
  unique (menu_id, user_id)
);

create table if not exists "Ingredient" (
  ingredient_id text primary key,
  ingredient_name text not null
);

create table if not exists "MenuIngredient" (
  id bigserial primary key,
  menu_id text references "Menu"(menu_id) on delete cascade,
  ingredient_id text references "Ingredient"(ingredient_id) on delete cascade
);

create table if not exists "CommunityPost" (
  cpost_id text primary key,
  cpost_title text not null,
  cpost_content text,
  cpost_datetime timestamptz default now(),
  cpost_image text,
  like_count integer default 0,
  post_type text default 'post' check (post_type in ('post','recipe')),
  user_id text references "User"(user_id) on delete cascade
);

create table if not exists "CommunityRecipe" (
  recipe_id text primary key,
  cpost_id text unique references "CommunityPost"(cpost_id) on delete cascade,
  recipe_summary text,
  recipe_category text,
  prep_time_minutes integer,
  cook_time_minutes integer,
  total_time_minutes integer,
  servings integer,
  ingredients jsonb,
  steps jsonb,
  created_at timestamptz default now()
);

create table if not exists "CommunityComment" (
  comment_id text primary key,
  comment_text text not null,
  comment_datetime timestamptz default now(),
  cpost_id text references "CommunityPost"(cpost_id) on delete cascade,
  user_id text references "User"(user_id) on delete cascade
);

create table if not exists "PostLike" (
  id bigserial primary key,
  post_id text references "CommunityPost"(cpost_id) on delete cascade,
  user_id text references "User"(user_id) on delete cascade,
  unique (post_id, user_id)
);

create table if not exists "CommunityReport" (
  creport_id text primary key,
  creport_type text not null,
  creport_reason text,
  creport_details text,
  creport_datetime timestamptz default now(),
  cpost_id text references "CommunityPost"(cpost_id) on delete cascade,
  comment_id text references "CommunityComment"(comment_id) on delete cascade,
  user_id text references "User"(user_id) on delete set null,
  check (cpost_id is not null or comment_id is not null)
);

-- Meal Calendar
create table if not exists "MealCalendar" (
  id uuid primary key default gen_random_uuid(),
  user_id text references "User"(user_id) on delete cascade,
  meal_date date not null,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')),
  menu_id text references "Menu"(menu_id) on delete set null,
  note text,
  unique (user_id, meal_date, meal_type)
);

-- Weekly Meal Plan (allows multiple menus per day/meal)
create table if not exists "WeeklyMealPlan" (
  id uuid primary key default gen_random_uuid(),
  user_id text references "User"(user_id) on delete cascade,
  day text not null check (day in ('Sun','Mon','Tue','Wed','Thu','Fri','Sat')),
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  menu_id text references "Menu"(menu_id) on delete cascade,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Notification system
create table if not exists "Notification" (
  notification_id text primary key,
  notification_type text not null check (notification_type in ('comment', 'like_post', 'like_comment', 'report')),
  notification_message text not null,
  is_read boolean default false,
  notification_datetime timestamptz default now(),
  user_id text references "User"(user_id) on delete cascade not null,
  cpost_id text references "CommunityPost"(cpost_id) on delete cascade,
  comment_id text references "CommunityComment"(comment_id) on delete cascade,
  actor_user_id text references "User"(user_id) on delete set null,
  creport_id text references "CommunityReport"(creport_id) on delete cascade
);

-- Indexes
create index if not exists idx_menu_name on "Menu" (menu_name);
create index if not exists idx_category_name on "Category" (category_name);
create index if not exists idx_post_datetime on "CommunityPost" (cpost_datetime desc);
create index if not exists idx_comment_post on "CommunityComment" (cpost_id);
create index if not exists idx_report_post on "CommunityReport" (cpost_id);
create index if not exists idx_report_comment on "CommunityReport" (comment_id);
create index if not exists idx_weeklymealplan_user on "WeeklyMealPlan" (user_id);
create index if not exists idx_notification_user on "Notification" (user_id);
create index if not exists idx_notification_read on "Notification" (is_read);
create index if not exists idx_notification_datetime on "Notification" (notification_datetime desc);
create index if not exists idx_notification_type on "Notification" (notification_type);
create index if not exists idx_notification_post on "Notification" (cpost_id);
create index if not exists idx_notification_comment on "Notification" (comment_id);

-- RLS policies (example: enable for anon/service as needed)
alter table "User" enable row level security;
alter table "Menu" enable row level security;
alter table "Category" enable row level security;
alter table "CommunityPost" enable row level security;
alter table "CommunityComment" enable row level security;
alter table "PostLike" enable row level security;
alter table "CommunityReport" enable row level security;
alter table "MealCalendar" enable row level security;
alter table "WeeklyMealPlan" enable row level security;
alter table "Ingredient" enable row level security;
alter table "MenuIngredient" enable row level security;
alter table "Notification" enable row level security;

-- Simplified permissive policies for backend anon key use
drop policy if exists user_all on "User";
create policy user_all on "User" for all using (true) with check (true);

drop policy if exists menu_all on "Menu";
create policy menu_all on "Menu" for all using (true) with check (true);

drop policy if exists category_all on "Category";
create policy category_all on "Category" for all using (true) with check (true);

drop policy if exists cpost_all on "CommunityPost";
create policy cpost_all on "CommunityPost" for all using (true) with check (true);

drop policy if exists ccomment_all on "CommunityComment";
create policy ccomment_all on "CommunityComment" for all using (true) with check (true);

drop policy if exists like_all on "PostLike";
create policy like_all on "PostLike" for all using (true) with check (true);

drop policy if exists report_all on "CommunityReport";
create policy report_all on "CommunityReport" for all using (true) with check (true);

drop policy if exists mealcal_all on "MealCalendar";
create policy mealcal_all on "MealCalendar" for all using (true) with check (true);

drop policy if exists weeklymealplan_all on "WeeklyMealPlan";
create policy weeklymealplan_all on "WeeklyMealPlan" for all using (true) with check (true);

drop policy if exists ingredient_all on "Ingredient";
create policy ingredient_all on "Ingredient" for all using (true) with check (true);

drop policy if exists menu_ingredient_all on "MenuIngredient";
create policy menu_ingredient_all on "MenuIngredient" for all using (true) with check (true);

drop policy if exists notification_all on "Notification";
create policy notification_all on "Notification" for all using (true) with check (true);


