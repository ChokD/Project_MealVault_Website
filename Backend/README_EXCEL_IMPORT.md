# คู่มือการนำเข้าข้อมูลจาก Excel

## สรุปการเปลี่ยนแปลง

ระบบได้ถูกปรับปรุงให้ใช้ข้อมูลจากไฟล์ Excel (`thai_food_dataset_with_urls.xlsx`) แทนการดึงข้อมูลจาก TheMealDB API

## ไฟล์ที่สร้างขึ้น

1. **Backend/scripts/inspectExcel.js** - สคริปต์สำหรับตรวจสอบโครงสร้างไฟล์ Excel
2. **Backend/scripts/importExcelData.js** - สคริปต์สำหรับนำเข้าข้อมูลจาก Excel ลงฐานข้อมูล
3. **Backend/routes/thaiFoodRoutes.js** - API endpoints ใหม่ที่ให้ข้อมูลในรูปแบบเดียวกับ TheMealDB

## วิธีการใช้งาน

### 1. ตรวจสอบโครงสร้างไฟล์ Excel

```bash
cd Backend
node scripts/inspectExcel.js
```

### 2. นำเข้าข้อมูลจาก Excel ลงฐานข้อมูล

```bash
cd Backend
node scripts/importExcelData.js
```

สคริปต์จะ:
- อ่านข้อมูลจาก `thai_food_dataset_with_urls.xlsx`
- สร้างหมวดหมู่ "Thai Food" (ถ้ายังไม่มี)
- นำเข้าข้อมูลเมนูทั้งหมด
- สร้างและเชื่อมโยงวัตถุดิบกับเมนู

### 3. ตรวจสอบ API Endpoints ใหม่

API endpoints ใหม่จะทำงานในรูปแบบเดียวกับ TheMealDB:

- `GET /api/thai-food/filter.php?c=category` - ดึงเมนูตามหมวดหมู่
- `GET /api/thai-food/filter.php?i=ingredient` - ดึงเมนูตามวัตถุดิบ
- `GET /api/thai-food/lookup.php?i=id` - ดึงรายละเอียดเมนู
- `GET /api/thai-food/categories.php` - ดึงหมวดหมู่ทั้งหมด

## ไฟล์ Frontend ที่แก้ไข

1. **Frontend/frontend/src/pages/MenuPage.jsx** - ใช้ API ใหม่แทน TheMealDB
2. **Frontend/frontend/src/pages/RecipeDetailPage.jsx** - ใช้ API ใหม่แทน TheMealDB
3. **Frontend/frontend/src/components/RecipeAccordionItem.jsx** - ใช้ API ใหม่แทน TheMealDB
4. **Frontend/frontend/src/pages/SearchPage.jsx** - ใช้ API ใหม่แทน TheMealDB
5. **Frontend/frontend/src/pages/MealDbSearchPage.jsx** - ใช้ API ใหม่แทน TheMealDB
6. **Frontend/frontend/src/components/Recommended.jsx** - ใช้ API ใหม่แทน TheMealDB

## หมายเหตุ

- ข้อมูลจะถูกนำเข้าไปยังตาราง `Menu`, `Category`, `Ingredient`, และ `MenuIngredient` ในฐานข้อมูล Supabase
- สคริปต์จะตรวจสอบว่ามีเมนูอยู่แล้วหรือไม่ก่อนนำเข้า (ป้องกันการซ้ำซ้อน)
- วัตถุดิบจะถูกแยกและเก็บไว้ในตาราง `Ingredient` แยกต่างหาก
- API endpoints ใหม่จะส่งข้อมูลในรูปแบบเดียวกับ TheMealDB เพื่อให้ Frontend ทำงานได้โดยไม่ต้องแก้ไขโค้ดมาก

## การแก้ไขหมวดหมู่ใน MenuPage

หากต้องการเปลี่ยนหมวดหมู่ใน MenuPage ให้แก้ไขไฟล์ `Frontend/frontend/src/pages/MenuPage.jsx`:

```javascript
const CATEGORIES = ['Thai Food', 'All']; // หรือหมวดหมู่อื่นๆ ที่มีในฐานข้อมูล
```

## การรันระบบ

1. เริ่ม Backend:
   ```bash
   cd Backend
   npm run dev
   ```

2. เริ่ม Frontend:
   ```bash
   cd Frontend/frontend
   npm run dev
   ```

## การนำเข้าข้อมูลซ้ำ

หากต้องการนำเข้าข้อมูลซ้ำ:
- สคริปต์จะข้ามเมนูที่ชื่อซ้ำอยู่แล้ว
- หากต้องการนำเข้าซ้ำ ให้ลบข้อมูลเก่าก่อน หรือแก้ไขสคริปต์ให้อัปเดตแทนการสร้างใหม่

