# 🔍 วิธี Debug ปัญหา Login

## 📋 ขั้นตอนการ Debug

### 1. ตรวจสอบ Supabase Connection

เปิดเบราว์เซอร์ไปที่:
```
GET http://localhost:3000/api/debug/check-supabase
```

**ผลลัพธ์ที่ต้องการ:**
```json
{
  "success": true,
  "message": "Supabase connection OK",
  "userCount": 1,
  "sampleUser": { ... }
}
```

**ถ้าเห็น error:**
- ตรวจสอบไฟล์ `.env` ว่ามี `SUPABASE_URL` และ `SUPABASE_ANON_KEY` หรือไม่
- ตรวจสอบว่า Supabase project ยังทำงานอยู่

---

### 2. ตรวจสอบ User ใน Database

เปิดเบราว์เซอร์ไปที่:
```
GET http://localhost:3000/api/debug/check-user/YOUR_EMAIL@example.com
```

**ตัวอย่าง:**
```
GET http://localhost:3000/api/debug/check-user/test@example.com
```

**ผลลัพธ์ที่ต้องการ:**
```json
{
  "success": true,
  "user": {
    "user_id": "U123456",
    "user_email": "test@example.com",
    "user_fname": "Test",
    "hasPassword": true,
    "passwordHashLength": 60,
    "passwordHashPreview": "$2b$10$BBL59x7KgSnH...",
    "passwordHashStartsWith": "$2b$10$"
  }
}
```

**ถ้า `hasPassword: false`:**
- User นี้ไม่มี password ใน database
- ต้องลบ user แล้วสมัครใหม่

---

### 3. ทดสอบ Password Hashing

เปิดเบราว์เซอร์ไปที่:
```
GET http://localhost:3000/api/debug/test-password?password=test1
```

**ผลลัพธ์ที่ต้องการ:**
```json
{
  "inputPassword": "test1",
  "hash": "$2b$10$...",
  "hashLength": 60,
  "matchResult": true,
  "message": "✅ Password hash works correctly"
}
```

**ถ้า `matchResult: false`:**
- มีปัญหาในการ hash password
- ตรวจสอบว่า `bcryptjs` ถูกติดตั้งแล้ว

---

### 4. ดู Log ใน Terminal

เมื่อลอง Login ควรเห็น log แบบนี้:

```
=== Login Attempt ===
Email: test@example.com
User found: Yes
User ID: U123456
Password hash exists: true
Password hash length: 60
Password hash starts with: $2b$10$
Input password length: 5

Comparing passwords...
Password match result: true
✅ Login successful for user: test@example.com
```

**ถ้าเห็น `Password match result: false`:**
- รหัสผ่านที่กรอกไม่ตรงกับที่เก็บใน database
- ลองลบ user แล้วสมัครใหม่

---

## 🛠️ วิธีแก้ไขปัญหา

### ปัญหา 1: Supabase client is not initialized

**แก้ไข:**
1. ตรวจสอบไฟล์ `Backend/.env`
2. ตรวจสอบว่ามี:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. รีสตาร์ท Backend server

---

### ปัญหา 2: User not found

**แก้ไข:**
1. ตรวจสอบว่า email ที่ใช้ login ถูกต้อง
2. ตรวจสอบใน Supabase Dashboard → Table Editor → User
3. ดูว่ามี user นี้อยู่หรือไม่

---

### ปัญหา 3: Password mismatch

**แก้ไข:**
1. **ลบ user เก่า** ใน Supabase Dashboard
2. **สมัครใหม่** ด้วย email และ password เดียวกัน
3. **Login ใหม่**

---

### ปัญหา 4: Password hash ไม่ถูกต้อง

**แก้ไข:**
1. ตรวจสอบว่า password ใน database เริ่มต้นด้วย `$2b$10$` หรือไม่
2. ถ้าไม่ใช่ → ลบ user แล้วสมัครใหม่
3. ถ้าใช่ → ลองใช้ debug endpoint เพื่อทดสอบ

---

## 📝 Checklist

ก่อนรายงานปัญหา ตรวจสอบ:

- [ ] Supabase connection ทำงาน (`/api/debug/check-supabase`)
- [ ] User มีอยู่ใน database (`/api/debug/check-user/:email`)
- [ ] Password hash ถูกต้อง (มี `$2b$10$` ใน database)
- [ ] Password hashing ทำงาน (`/api/debug/test-password`)
- [ ] ดู log ใน Terminal เมื่อ login
- [ ] ลองลบ user แล้วสมัครใหม่

---

## 🎯 วิธีทดสอบครบถ้วน

1. **ลบ user เก่า** (ถ้ามี):
   - ไปที่ Supabase Dashboard → Table Editor → User
   - ลบ row ที่มี email ที่คุณใช้

2. **สมัครใหม่**:
   ```bash
   POST http://localhost:3000/api/register
   Content-Type: application/json
   
   {
     "user_email": "test@example.com",
     "user_fname": "Test",
     "user_lname": "User",
     "user_password": "test1"
   }
   ```

3. **ตรวจสอบใน Supabase**:
   - ไปที่ Table Editor → User
   - ดูว่า password hash เริ่มต้นด้วย `$2b$10$` หรือไม่

4. **Login**:
   ```bash
   POST http://localhost:3000/api/login
   Content-Type: application/json
   
   {
     "user_email": "test@example.com",
     "user_password": "test1"
   }
   ```

5. **ดู log ใน Terminal**:
   - ควรเห็น `✅ Login successful`

---

## 💡 Tips

- **ห้าม** แก้ไข password hash ใน database โดยตรง
- **ต้อง** ใช้ bcrypt เพื่อ hash password เสมอ
- **ตรวจสอบ** email และ password ว่าพิมพ์ถูกต้อง
- **ใช้** debug endpoints เพื่อหาปัญหา

---

## 🆘 ถ้ายังแก้ไม่ได้

ส่งข้อมูลต่อไปนี้:
1. Log จาก Terminal เมื่อ login
2. ผลลัพธ์จาก `/api/debug/check-supabase`
3. ผลลัพธ์จาก `/api/debug/check-user/:email`
4. ข้อมูลจาก Supabase Dashboard (password hash preview)

