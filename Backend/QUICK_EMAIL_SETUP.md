# 🚀 Quick Email Setup Guide

## Error You're Seeing:
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

This means Gmail rejected your credentials. You need to use an **App Password**, not your regular Gmail password.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" under "Signing in to Google"
3. Click it and follow the setup (you'll need your phone)

### Step 2: Generate App Password
1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
   - Or go to Security → 2-Step Verification → App passwords (at the bottom)
2. You may need to sign in again
3. Select app: **Mail**
4. Select device: **Other (Custom name)**
5. Type: **MealVault**
6. Click **Generate**
7. Google shows a 16-character password like: `abcd efgh ijkl mnop`
8. **Copy this password** (it won't be shown again!)

### Step 3: Update Your .env File
Open `Backend/.env` and update these lines:

```env
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Important:**
- Use your REAL Gmail address for `EMAIL_USER`
- Use the 16-character App Password for `EMAIL_PASS` (remove spaces!)
- Don't use your regular Gmail password

### Step 4: Restart Your Server
```bash
# Press Ctrl+C in your terminal to stop the server
# Then restart it:
npm start
```

### Step 5: Test It!
```bash
# Test the email configuration:
node test-email.js your-test-email@example.com
```

Or test via the app:
1. Go to http://localhost:5173/forgot-password
2. Enter a user email that exists in your database
3. Check that email inbox for the reset link

---

## 🔍 Common Issues

### "App passwords" option not available
- Make sure 2-Step Verification is enabled first
- Some Google Workspace accounts may have this disabled by admin

### Email still not sending
1. Make sure you removed ALL spaces from the App Password
2. Verify you're using the Gmail address that created the App Password
3. Check if your Gmail account has reached the sending limit (500/day)

### Want to use a different email provider?
Edit `Backend/utils/sendEmail.js` and change:
```javascript
service: 'Gmail',  // Change to 'Outlook', 'Yahoo', etc.
```

---

## ✅ What This Email System Does

When a user forgets their password:
1. User goes to `/forgot-password` page
2. User enters their email (must exist in database)
3. System generates a secure reset token
4. System sends email **TO** the user's email **FROM** your configured Gmail
5. Email contains a link like: `http://localhost:5173/reset-password/abc123...`
6. Link is valid for 1 hour
7. User clicks link and sets new password

---

## 🎯 Quick Reference

**Your .env should look like this:**
```env
EMAIL_USER=john.doe@gmail.com
EMAIL_PASS=abcdefghijklmnop
FRONTEND_URL=http://localhost:5173
```

**Not like this (won't work):**
```env
EMAIL_USER=your_email@gmail.com          ❌ Placeholder
EMAIL_PASS=your_regular_password         ❌ Not App Password
EMAIL_PASS=abcd efgh ijkl mnop          ❌ Has spaces
```

---

Need more help? Check `README_EMAIL_SETUP.md` for detailed documentation.
