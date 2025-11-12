# User Preferences Update - Allergies and Favorite Foods

## สรุปการเปลี่ยนแปลง

ระบบได้เพิ่มความสามารถให้ผู้ใช้สามารถกรอกข้อมูล **แพ้อาหาร** และ **อาหารที่ชอบ** (ทั้งสองอย่างเป็น optional) และสามารถแก้ไขได้ในภายหลัง

## การเปลี่ยนแปลงใน Database

### 1. Schema Updates

เพิ่มคอลัมน์ `favorite_foods` ในตาราง `User`:

```sql
favorite_foods text
```

### 2. Migration สำหรับ Database ที่มีอยู่แล้ว

รัน SQL นี้ใน Supabase SQL Editor เพื่อเพิ่มคอลัมน์ `favorite_foods`:

```sql
-- ไฟล์: Backend/migration_add_favorite_foods.sql
alter table "User" add column if not exists favorite_foods text;
```

**หมายเหตุ:** ถ้าคุณสร้าง database ใหม่จาก schema.sql หรือ schema_login_only.sql คอลัมน์นี้จะถูกสร้างอัตโนมัติ

## การเปลี่ยนแปลงใน Backend API

### 1. POST /api/register
- รองรับการรับ `allergies` และ `favorite_foods` (optional)
- ข้อมูลจะถูกเก็บเป็น comma-separated string ในฐานข้อมูล

### 2. GET /api/me
- ส่งคืน `allergies` และ `favorite_foods` เป็น arrays
- ข้อมูลถูกแปลงจาก comma-separated string เป็น array

### 3. GET /api/preferences
- ส่งคืน `allergens` และ `favorite_foods` เป็น arrays

### 4. PUT /api/preferences
- รองรับการอัปเดต `allergens` และ `favorite_foods`
- รับข้อมูลเป็น array หรือ string (จะถูกแปลงเป็น comma-separated string)
- สามารถเคลียร์ข้อมูลได้โดยส่ง empty array หรือ null

## การเปลี่ยนแปลงใน Frontend

### 1. SignUpPage
- เพิ่มฟิลด์ **แพ้อาหาร** (optional)
- เพิ่มฟิลด์ **อาหารที่ชอบ** (optional)
- มี placeholder และคำอธิบายช่วยเหลือ

### 2. ProfilePage
- เพิ่มฟิลด์ **อาหารที่ชอบ** ในส่วนการตั้งค่าโภชนาการ
- แสดงข้อมูลที่บันทึกไว้แล้ว
- สามารถแก้ไขหรือเคลียร์ข้อมูลได้

## วิธีใช้งาน

### สำหรับผู้ใช้ใหม่
1. ไปที่หน้า Sign Up
2. กรอกข้อมูลพื้นฐาน (อีเมล, รหัสผ่าน, ชื่อ, นามสกุล)
3. (Optional) กรอกอาหารที่แพ้: เช่น "ถั่ว, นม, กุ้ง"
4. (Optional) กรอกอาหารที่ชอบ: เช่น "ข้าวผัด, ต้มยำ, ผัดไทย"
5. คลิก "สมัครสมาชิก"

### สำหรับผู้ใช้ที่มีบัญชีแล้ว
1. ไปที่หน้า Profile
2. เลื่อนลงไปที่ส่วน "การตั้งค่าโภชนาการ"
3. กรอกหรือแก้ไข **แพ้อาหาร** และ **อาหารที่ชอบ**
4. คลิก "บันทึกการตั้งค่า"

## ข้อมูลที่เก็บในฐานข้อมูล

- `allergies`: เก็บเป็น comma-separated string (เช่น "ถั่ว,นม,กุ้ง")
- `favorite_foods`: เก็บเป็น comma-separated string (เช่น "ข้าวผัด,ต้มยำ,ผัดไทย")
- ทั้งสองคอลัมน์สามารถเป็น `null` ได้ (ถ้าไม่กรอก)

## API Response Format

### GET /api/me
```json
{
  "user_id": "U123456",
  "user_email": "user@example.com",
  "user_fname": "John",
  "user_lname": "Doe",
  "allergies": ["ถั่ว", "นม", "กุ้ง"],
  "favorite_foods": ["ข้าวผัด", "ต้มยำ", "ผัดไทย"],
  "isAdmin": false
}
```

### GET /api/preferences
```json
{
  "calorie_limit": 2000,
  "allergens": ["ถั่ว", "นม"],
  "favorite_foods": ["ข้าวผัด", "ต้มยำ"]
}
```

### PUT /api/preferences
Request Body:
```json
{
  "calorie_limit": 2000,
  "allergens": ["ถั่ว", "นม", "กุ้ง"],
  "favorite_foods": ["ข้าวผัด", "ต้มยำ", "ผัดไทย"]
}
```

## หมายเหตุสำคัญ

1. **Migration**: ต้องรัน migration SQL ก่อนใช้งาน (สำหรับ database ที่มีอยู่แล้ว)
2. **Optional Fields**: ทั้ง `allergies` และ `favorite_foods` เป็น optional ทั้งตอนสมัครสมาชิกและแก้ไขโปรไฟล์
3. **Format**: ข้อมูลถูกเก็บเป็น comma-separated string ในฐานข้อมูล แต่ API ส่งคืนเป็น array เพื่อความสะดวกในการใช้งาน
4. **Empty Values**: สามารถเคลียร์ข้อมูลได้โดยการลบข้อมูลในฟิลด์และบันทึก

