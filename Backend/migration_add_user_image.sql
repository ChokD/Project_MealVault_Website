-- Migration: เพิ่มคอลัมน์ user_image ในตาราง User
-- รัน SQL นี้ใน Supabase SQL Editor เพื่อเพิ่มคอลัมน์สำหรับเก็บรูปภาพโปรไฟล์

alter table "User" add column if not exists user_image text;

-- หมายเหตุ: 
-- - คอลัมน์ user_image จะเก็บชื่อไฟล์รูปภาพที่อัปโหลด
-- - รูปภาพจะถูกเก็บไว้ที่ public/images/ ใน backend
-- - URL ของรูปภาพจะเป็น http://localhost:3000/images/{filename}

