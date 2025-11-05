-- Supabase Schema สำหรับระบบ Community เท่านั้น
-- Run SQL นี้ใน Supabase SQL Editor เพื่อสร้างตารางสำหรับ Community

-- ============================================
-- 1. สร้างตาราง CommunityPost (โพสต์ในชุมชน)
-- ============================================
create table if not exists "CommunityPost" (
  cpost_id text primary key,
  cpost_title text not null,
  cpost_content text, -- เพิ่ม field เนื้อหาโพสต์
  cpost_datetime timestamptz default now(),
  cpost_image text,
  like_count integer default 0,
  user_id text references "User"(user_id) on delete cascade
);

-- ============================================
-- 2. สร้างตาราง CommunityComment (ความคิดเห็น)
-- ============================================
create table if not exists "CommunityComment" (
  comment_id text primary key,
  comment_text text not null,
  comment_datetime timestamptz default now(),
  cpost_id text references "CommunityPost"(cpost_id) on delete cascade,
  user_id text references "User"(user_id) on delete cascade
);

-- ============================================
-- 3. สร้างตาราง PostLike (ไลค์โพสต์)
-- ============================================
create table if not exists "PostLike" (
  id bigserial primary key,
  post_id text references "CommunityPost"(cpost_id) on delete cascade,
  user_id text references "User"(user_id) on delete cascade,
  unique (post_id, user_id)
);

-- ============================================
-- 4. สร้างตาราง CommunityReport (รายงานโพสต์)
-- ============================================
create table if not exists "CommunityReport" (
  creport_id text primary key,
  creport_reason text not null,
  creport_datetime timestamptz default now(),
  cpost_id text references "CommunityPost"(cpost_id) on delete cascade,
  user_id text references "User"(user_id) on delete set null
);

-- ============================================
-- 5. สร้าง Indexes เพื่อเพิ่มประสิทธิภาพ
-- ============================================
create index if not exists idx_post_datetime on "CommunityPost" (cpost_datetime desc);
create index if not exists idx_comment_post on "CommunityComment" (cpost_id);
create index if not exists idx_comment_user on "CommunityComment" (user_id);
create index if not exists idx_like_post on "PostLike" (post_id);
create index if not exists idx_like_user on "PostLike" (user_id);
create index if not exists idx_report_post on "CommunityReport" (cpost_id);

-- ============================================
-- 6. ตั้งค่า Row Level Security (RLS)
-- ============================================
alter table "CommunityPost" enable row level security;
alter table "CommunityComment" enable row level security;
alter table "PostLike" enable row level security;
alter table "CommunityReport" enable row level security;

-- ============================================
-- 7. สร้าง Policies สำหรับให้ Backend ใช้งานได้
-- ============================================
-- Policy สำหรับ CommunityPost
drop policy if exists cpost_all on "CommunityPost";
create policy cpost_all on "CommunityPost" 
  for all 
  using (true) 
  with check (true);

-- Policy สำหรับ CommunityComment
drop policy if exists ccomment_all on "CommunityComment";
create policy ccomment_all on "CommunityComment" 
  for all 
  using (true) 
  with check (true);

-- Policy สำหรับ PostLike
drop policy if exists like_all on "PostLike";
create policy like_all on "PostLike" 
  for all 
  using (true) 
  with check (true);

-- Policy สำหรับ CommunityReport
drop policy if exists report_all on "CommunityReport";
create policy report_all on "CommunityReport" 
  for all 
  using (true) 
  with check (true);

-- ============================================
-- ✅ เสร็จสิ้น! ตอนนี้พร้อมใช้งานระบบ Community แล้ว
-- ============================================
-- หมายเหตุ:
-- - ตาราง CommunityPost ใช้สำหรับเก็บโพสต์ในชุมชน
-- - ตาราง CommunityComment ใช้สำหรับเก็บความคิดเห็น
-- - ตาราง PostLike ใช้สำหรับเก็บไลค์
-- - ตาราง CommunityReport ใช้สำหรับรายงานโพสต์
-- - RLS policies ถูกตั้งค่าให้ Backend สามารถเข้าถึงได้ทั้งหมด
-- ============================================

