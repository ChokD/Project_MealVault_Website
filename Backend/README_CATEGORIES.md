# ระบบหมวดหมู่เมนูอาหาร (Category System)

## ภาพรวม

ระบบหมวดหมู่เมนูอาหารถูกออกแบบมาเพื่อแบ่งเมนูอาหารตามวิธีทำอาหาร เช่น ปิ้ง, ผัด, ทอด, ย่าง, ต้ม, นึ่ง, อบ, แกง เป็นต้น

## การติดตั้งหมวดหมู่เริ่มต้น

### 1. เพิ่มหมวดหมู่วิธีทำอาหารเริ่มต้น

รันสคริปต์เพื่อเพิ่มหมวดหมู่เริ่มต้น:

```bash
cd Backend
node scripts/seedCookingCategories.js
```

สคริปต์นี้จะเพิ่มหมวดหมู่ต่อไปนี้:
- ปิ้ง (Grilled)
- ผัด (Stir-fried)
- ทอด (Fried)
- ย่าง (Roasted/Barbecued)
- ต้ม (Boiled)
- นึ่ง (Steamed)
- อบ (Baked)
- แกง (Curry)
- อื่นๆ (Others)

### 2. อัพเดตหมวดหมู่ให้เมนูที่มีอยู่แล้ว

**สำคัญ:** หลังจากเพิ่มหมวดหมู่แล้ว ต้องอัพเดต category_id ให้เมนูที่มีอยู่แล้วในฐานข้อมูล:

```bash
cd Backend
node scripts/updateMenuCategories.js
```

สคริปต์นี้จะ:
- วิเคราะห์ชื่อเมนูเพื่อกำหนดหมวดหมู่ให้อัตโนมัติ
- อัพเดต category_id ให้เมนูทั้งหมด
- แสดงสรุปผลการอัพเดตและสถิติ

**หมายเหตุ:** สคริปต์จะวิเคราะห์จากชื่อเมนู (menu_name) เท่านั้น โดยค้นหาคำหลักที่บ่งบอกถึงวิธีทำอาหาร เช่น "ผัด", "ทอด", "แกง" เป็นต้น

### 3. ตรวจสอบหมวดหมู่

หลังจากรันสคริปต์แล้ว คุณสามารถตรวจสอบหมวดหมู่ได้โดย:

```bash
# เรียก API เพื่อดูหมวดหมู่ทั้งหมด
curl http://localhost:3000/api/categories
```

## การใช้งาน

### Frontend

หน้าเมนูอาหาร (`MenuPage.jsx`) จะแสดงตัวกรองหมวดหมู่อัตโนมัติ:
- ดึงหมวดหมู่ทั้งหมดจาก API
- แสดงปุ่มกรองสำหรับแต่ละหมวดหมู่
- กรองเมนูตามหมวดหมู่ที่เลือก

### Backend API

#### ดึงหมวดหมู่ทั้งหมด
```
GET /api/categories
```

#### ดึงเมนูตามหมวดหมู่
```
GET /api/thai-food/filter.php?c=ปิ้ง
```

#### เพิ่มหมวดหมู่ใหม่ (Admin only)
```
POST /api/categories
Content-Type: application/json

{
  "category_name": "หมวดหมู่ใหม่"
}
```

#### แก้ไขหมวดหมู่ (Admin only)
```
PUT /api/categories/:id
Content-Type: application/json

{
  "category_name": "ชื่อหมวดหมู่ใหม่"
}
```

#### ลบหมวดหมู่ (Admin only)
```
DELETE /api/categories/:id
```

## การกำหนดหมวดหมู่ให้เมนู

เมื่อเพิ่มหรือแก้ไขเมนู ระบุ `category_id` ใน request body:

```json
{
  "menu_name": "ชื่อเมนู",
  "menu_description": "คำอธิบาย",
  "menu_recipe": "วิธีทำ",
  "menu_image": "url รูปภาพ",
  "category_id": "CAT001"
}
```

## โครงสร้างฐานข้อมูล

### ตาราง Category
```sql
create table if not exists "Category" (
  category_id text primary key,
  category_name text not null
);
```

### ตาราง Menu
```sql
create table if not exists "Menu" (
  menu_id text primary key,
  menu_name text not null,
  menu_description text,
  menu_recipe text,
  menu_image text,
  menu_datetime timestamptz default now(),
  user_id text references "User"(user_id) on delete set null,
  category_id text references "Category"(category_id) on delete set null
);
```

## ขั้นตอนการติดตั้งและใช้งาน

### สำหรับฐานข้อมูลใหม่

1. เพิ่มหมวดหมู่เริ่มต้น:
   ```bash
   cd Backend
   node scripts/seedCookingCategories.js
   ```

2. นำเข้าเมนูจาก Excel (ถ้ามี):
   ```bash
   node scripts/importExcelData.js
   ```

3. อัพเดตหมวดหมู่ให้เมนู:
   ```bash
   node scripts/updateMenuCategories.js
   ```

### สำหรับฐานข้อมูลที่มีเมนูอยู่แล้ว

1. เพิ่มหมวดหมู่เริ่มต้น:
   ```bash
   cd Backend
   node scripts/seedCookingCategories.js
   ```

2. อัพเดตหมวดหมู่ให้เมนูที่มีอยู่:
   ```bash
   node scripts/updateMenuCategories.js
   ```

## หมายเหตุ

- หมวดหมู่จะถูกแสดงในหน้าเมนูอาหารอัตโนมัติ
- ผู้ใช้สามารถกรองเมนูตามหมวดหมู่ได้
- การเพิ่ม/แก้ไข/ลบหมวดหมู่ต้องมีสิทธิ์ Admin
- ไม่สามารถลบหมวดหมู่ที่มีเมนูใช้งานอยู่ได้
- สคริปต์ `updateMenuCategories.js` จะวิเคราะห์และกำหนดหมวดหมู่ให้อัตโนมัติ แต่คุณสามารถแก้ไขได้ผ่าน Admin Panel หรือ API

