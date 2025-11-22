-- Migration: สร้างตาราง Notification สำหรับระบบแจ้งเตือน
-- Run SQL นี้ใน Supabase SQL Editor เพื่อสร้างตาราง Notification

-- สร้างตาราง Notification
create table if not exists "Notification" (
  notification_id text primary key,
  notification_type text not null check (notification_type in ('comment', 'like_post', 'like_comment', 'report')),
  notification_message text not null,
  is_read boolean default false,
  notification_datetime timestamptz default now(),
  user_id text references "User"(user_id) on delete cascade not null,
  -- สำหรับเชื่อมโยงกับโพสต์หรือคอมเมนต์
  cpost_id text references "CommunityPost"(cpost_id) on delete cascade,
  comment_id text references "CommunityComment"(comment_id) on delete cascade,
  -- สำหรับเก็บข้อมูลผู้ที่ทำ action (เช่น ผู้ที่คอมเมนต์หรือไลค์)
  actor_user_id text references "User"(user_id) on delete set null,
  -- สำหรับเก็บข้อมูลรายงาน (สำหรับ Admin)
  creport_id text references "CommunityReport"(creport_id) on delete cascade
);

-- สร้าง indexes เพื่อเพิ่มประสิทธิภาพ
create index if not exists idx_notification_user on "Notification" (user_id);
create index if not exists idx_notification_read on "Notification" (is_read);
create index if not exists idx_notification_datetime on "Notification" (notification_datetime desc);
create index if not exists idx_notification_type on "Notification" (notification_type);
create index if not exists idx_notification_post on "Notification" (cpost_id);
create index if not exists idx_notification_comment on "Notification" (comment_id);

-- ตั้งค่า Row Level Security
alter table "Notification" enable row level security;

-- สร้าง Policy สำหรับให้ Backend ใช้งานได้
drop policy if exists notification_all on "Notification";
create policy notification_all on "Notification" 
  for all 
  using (true) 
  with check (true);

