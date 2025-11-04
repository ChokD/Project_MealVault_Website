# 🔧 แก้ไขปัญหา JWT_SECRET Error

## ❌ Error ที่พบ

```
Error: secretOrPrivateKey must have a value
    at module.exports [as sign]
    at userRoutes.js:152
```

## 🔍 สาเหตุ

`JWT_SECRET` ไม่ได้ถูกตั้งค่าในไฟล์ `.env` ทำให้ระบบไม่สามารถสร้าง JWT token ได้

---

## ✅ วิธีแก้ไข

### 1. เปิดไฟล์ `.env` ในโฟลเดอร์ `Backend`

### 2. เพิ่ม JWT_SECRET

เพิ่มบรรทัดนี้ในไฟล์ `.env`:

```env
JWT_SECRET=your_super_secret_jwt_key_here
```

**ตัวอย่าง:**
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret (สำคัญ!)
JWT_SECRET=my_super_secret_jwt_key_12345_abcdefghijklmnop
```

### 3. สร้าง JWT_SECRET ที่ปลอดภัย (แนะนำ)

ใช้คำสั่งนี้เพื่อสร้าง random secret:

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**หรือใช้เว็บไซต์:**
- https://www.random.org/strings/
- สร้าง string ยาว 64 ตัวอักษร

**ตัวอย่าง JWT_SECRET:**
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2
```

---

## 🔄 รีสตาร์ท Backend

หลังจากเพิ่ม JWT_SECRET แล้ว:

1. **หยุด Backend server** (กด `Ctrl+C` ใน Terminal)

2. **รันใหม่:**
   ```bash
   cd Backend
   npm run dev
   ```

3. **ตรวจสอบ Terminal** ว่าไม่มี error:
   ```
   ✅ Supabase client initialized successfully
   Server is running on port 3000
   ```

---

## ✅ ตรวจสอบว่าทำงานแล้ว

1. **ลอง Login ใหม่:**
   ```bash
   POST http://localhost:3000/api/login
   Content-Type: application/json
   
   {
     "user_email": "test@example.com",
     "user_password": "test1"
   }
   ```

2. **ควรได้รับ response:**
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

---

## 📝 หมายเหตุ

- **JWT_SECRET** ควรเป็น string ที่ยาวและสุ่ม
- **ห้าม** แชร์ JWT_SECRET กับใคร
- **ห้าม** commit JWT_SECRET ไปที่ Git
- ไฟล์ `.env` ควรอยู่ใน `.gitignore`

---

## 🆘 ถ้ายังมีปัญหา

1. ตรวจสอบว่าไฟล์ `.env` อยู่ในโฟลเดอร์ `Backend` (ไม่ใช่โฟลเดอร์ root)
2. ตรวจสอบว่าไม่มีช่องว่างรอบ `=` ใน `.env`
3. ตรวจสอบว่าไม่มี quote รอบ JWT_SECRET (ถ้าไม่จำเป็น)
4. รีสตาร์ท Backend server หลังจากแก้ไข `.env`

---

## ✅ เสร็จแล้ว!

เมื่อเพิ่ม JWT_SECRET แล้ว ระบบ Login ควรทำงานได้ปกติแล้ว!

