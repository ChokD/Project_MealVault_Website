-- Supabase Schema สำหรับระบบ Login เท่านั้น
-- Run SQL นี้ใน Supabase SQL Editor เพื่อสร้างตารางสำหรับระบบ Login/Register

-- ============================================
-- 1. สร้างตาราง User (สำหรับระบบ Login/Register)
-- ============================================
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
  reset_password_expires timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 2. สร้างตาราง Admin (สำหรับแยก admin ออกมา)
-- ============================================
create table if not exists "Admin" (
  admin_id text primary key references "User"(user_id) on delete cascade,
  created_at timestamptz default now()
);

-- ============================================
-- 3. สร้าง Indexes เพื่อเพิ่มประสิทธิภาพ
-- ============================================
create index if not exists idx_user_email on "User" (user_email);
create index if not exists idx_reset_token on "User" (reset_password_token);

-- ============================================
-- 4. ตั้งค่า Row Level Security (RLS)
-- ============================================
alter table "User" enable row level security;
alter table "Admin" enable row level security;

-- ============================================
-- 5. สร้าง Policies สำหรับให้ Backend ใช้งานได้
-- ============================================
-- Policy สำหรับ User table
drop policy if exists user_all on "User";
create policy user_all on "User" 
  for all 
  using (true) 
  with check (true);

-- Policy สำหรับ Admin table
drop policy if exists admin_all on "Admin";
create policy admin_all on "Admin" 
  for all 
  using (true) 
  with check (true);

-- ============================================
-- 6. สร้าง Function สำหรับอัปเดต updated_at อัตโนมัติ
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- สร้าง Trigger สำหรับอัปเดต updated_at อัตโนมัติ
drop trigger if exists update_user_updated_at on "User";
create trigger update_user_updated_at
  before update on "User"
  for each row
  execute function update_updated_at_column();

-- ============================================
-- ✅ เสร็จสิ้น! ตอนนี้พร้อมใช้งานระบบ Login แล้ว
-- ============================================
-- หมายเหตุ:
-- - ตาราง User ใช้สำหรับ Register, Login, Profile, Password Reset
-- - ตาราง Admin ใช้สำหรับแยก admin ออกมา
-- - RLS policies ถูกตั้งค่าให้ Backend สามารถเข้าถึงได้ทั้งหมด
-- ============================================

