-- SQL script สำหรับสร้างตาราง WeeklyMealPlan ใน Supabase
-- รัน script นี้ใน Supabase SQL Editor

-- สร้างตาราง WeeklyMealPlan
create table if not exists "WeeklyMealPlan" (
  id uuid primary key default gen_random_uuid(),
  user_id text references "User"(user_id) on delete cascade,
  day text not null check (day in ('Sun','Mon','Tue','Wed','Thu','Fri','Sat')),
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  menu_id text references "Menu"(menu_id) on delete cascade,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- สร้าง index สำหรับ user_id
create index if not exists idx_weeklymealplan_user on "WeeklyMealPlan" (user_id);

-- Enable RLS
alter table "WeeklyMealPlan" enable row level security;

-- ลบ policy เก่าถ้ามี (ถ้า error ให้ข้ามไป)
-- สร้าง policy สำหรับ WeeklyMealPlan
do $$
begin
  drop policy if exists weeklymealplan_all on "WeeklyMealPlan";
exception when others then
  -- ถ้ามี error ให้ข้ามไป
  null;
end $$;

create policy weeklymealplan_all on "WeeklyMealPlan" for all using (true) with check (true);

