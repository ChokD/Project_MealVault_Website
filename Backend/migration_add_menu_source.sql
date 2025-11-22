-- Migration: เพิ่มฟิลด์ source สำหรับเก็บแหล่งอ้างอิงสูตรอาหาร
-- Run SQL นี้ใน Supabase SQL Editor

-- เพิ่มคอลัมน์ menu_source และ menu_source_url ในตาราง Menu
alter table "Menu" 
add column if not exists menu_source text,
add column if not exists menu_source_url text;

-- สร้าง index สำหรับการค้นหา (ถ้าต้องการ)
create index if not exists idx_menu_source on "Menu" (menu_source);

-- หมายเหตุ: หลังจากรัน migration นี้แล้ว ให้อัปเดตข้อมูลเมนูที่มีอยู่:
-- 1. ผัดกะเพรา: menu_source = 'ทีมครัวเนื้อหอม', menu_source_url = 'https://www.facebook.com/Sumnakkaow.PRD/posts/696744839154523?_rdc=1&_rdr#'
-- 2. เกี๊ยวกุ้ง: menu_source = 'เพจป้าหนึ่ง ตึ่งโป๊ะ cooking show', menu_source_url = 'https://www.facebook.com/NEWSCatDumb/posts/174997958953094'
-- 3. สูตรอื่นๆ: menu_source = 'ตำรับอาหาร - เตื้อง สนิทวงศ์, ม.ร.ว., 2426-2510', menu_source_url = 'https://archive.org/details/unset00002426_m0n5/'

