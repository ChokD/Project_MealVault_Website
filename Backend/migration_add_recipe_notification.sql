-- Migration: เพิ่มการรองรับการแจ้งเตือนสำหรับสูตรอาหาร
-- Run SQL นี้ใน Supabase SQL Editor

-- เพิ่ม recipe_id field ใน Notification table
alter table "Notification" 
add column if not exists recipe_id text references "UserRecipe"(recipe_id) on delete cascade;

-- เพิ่ม 'like_recipe' ใน notification_type check constraint
alter table "Notification" 
drop constraint if exists "Notification_notification_type_check";

alter table "Notification" 
add constraint "Notification_notification_type_check" 
check (notification_type in ('comment', 'like_post', 'like_comment', 'like_recipe', 'report'));

-- สร้าง index สำหรับ recipe_id
create index if not exists idx_notification_recipe on "Notification" (recipe_id);
