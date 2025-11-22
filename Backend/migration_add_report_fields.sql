-- Migration: เพิ่ม fields สำหรับระบบรายงานโพสต์และคอมเมนต์
-- Run SQL นี้ใน Supabase SQL Editor เพื่ออัพเดทตาราง CommunityReport

-- เพิ่ม column สำหรับ comment_id (nullable) เพื่อรองรับการรายงานคอมเมนต์
alter table "CommunityReport" 
add column if not exists comment_id text references "CommunityComment"(comment_id) on delete cascade;

-- เพิ่ม column สำหรับ creport_details (text) เพื่อเก็บรายละเอียดเพิ่มเติม
alter table "CommunityReport" 
add column if not exists creport_details text;

-- เพิ่ม column สำหรับ creport_type (text) เพื่อเก็บประเภทการรายงาน
alter table "CommunityReport" 
add column if not exists creport_type text;

-- เปลี่ยน creport_reason จาก NOT NULL เป็น nullable (ถ้ายังไม่เป็น nullable)
alter table "CommunityReport" 
alter column creport_reason drop not null;

-- เพิ่ม index สำหรับ comment_id
create index if not exists idx_report_comment on "CommunityReport" (comment_id);

-- เพิ่ม constraint เพื่อให้ต้องมี cpost_id หรือ comment_id อย่างน้อย 1 ตัว
-- หมายเหตุ: ถ้ามี constraint เดิมอยู่แล้ว จะต้องลบออกก่อน
alter table "CommunityReport" 
drop constraint if exists communityreport_check;

alter table "CommunityReport" 
add constraint communityreport_check check (cpost_id is not null or comment_id is not null);

-- อัพเดท policy ถ้าจำเป็น (policy มีอยู่แล้วใน schema.sql)

