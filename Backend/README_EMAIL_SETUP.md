# Email Configuration for Password Reset

## Overview
The forgot password feature sends a password reset link to the user's email address. This document explains how to configure Gmail to send emails from your application.

## Step 1: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", enable **2-Step Verification**
4. Follow the prompts to set it up (you'll need your phone)

## Step 2: Generate an App Password

1. After enabling 2FA, go back to **Security**
2. Under "Signing in to Google", click on **App passwords**
3. You may need to sign in again
4. Under "Select app", choose **Mail**
5. Under "Select device", choose **Other** and name it "MealVault"
6. Click **Generate**
7. Google will show you a 16-character password like: `abcd efgh ijkl mnop`
8. **Copy this password** (remove spaces, so it becomes: `abcdefghijklmnop`)

## Step 3: Update Your .env File

Open `Backend/.env` and update these values:

```env
EMAIL_USER=your_actual_email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Important:**
- Replace `your_actual_email@gmail.com` with your real Gmail address
- Replace `abcdefghijklmnop` with the App Password you generated (no spaces)
- The current value `xwohhljddzkmxeif` appears to be an app password, but you should generate your own

## Step 4: Test the Feature

1. Restart your backend server:
   ```bash
   cd Backend
   npm start
   ```

2. Go to the Forgot Password page: http://localhost:5173/forgot-password

3. Enter a valid user email from your database

4. Check the email inbox - you should receive a password reset email within a few seconds

## Email Template

The password reset email includes:
- 🍽️ MealVault branding with green gradient header
- Clear call-to-action button to reset password
- Warning that the link expires in 1 hour
- Styled HTML template for professional appearance

## Troubleshooting

### "Failed to send email" Error

**Possible causes:**
1. **EMAIL_USER or EMAIL_PASS not set**: Make sure both variables are in your `.env` file
2. **Incorrect App Password**: Regenerate a new App Password and update `.env`
3. **2FA not enabled**: You must have 2-Step Verification enabled on your Gmail account
4. **Less secure apps**: If you're using your regular Gmail password (not recommended), you need to enable "Less secure app access" - but this is deprecated and less secure

### No Email Received

1. **Check spam folder**: Reset emails might go to spam
2. **Check console logs**: The backend will log `Password reset email sent to: email@example.com`
3. **Verify email exists**: The system only sends emails if the user exists in the database
4. **Email quota**: Gmail has sending limits (500 emails/day for free accounts)

### Error: "Invalid login"

This means your credentials are incorrect:
- Make sure you're using an **App Password**, not your regular Gmail password
- Remove any spaces from the App Password
- Make sure EMAIL_USER matches the Gmail account that generated the App Password

## Security Notes

- Reset tokens are valid for **1 hour only**
- Tokens are stored as `reset_password_token` in the User table
- After successful password reset, the token is cleared from the database
- The system doesn't reveal whether an email exists in the database (security best practice)
- All passwords are hashed using bcrypt before storage

## Frontend Pages

- **Forgot Password**: `/forgot-password` - User enters email
- **Reset Password**: `/reset-password/:token` - User enters new password with token from email

## API Endpoints

- `POST /api/forgot-password` - Request password reset
  ```json
  {
    "user_email": "user@example.com"
  }
  ```

- `POST /api/reset-password/:token` - Reset password with token
  ```json
  {
    "newPassword": "newSecurePassword123"
  }
  ```

## Alternative Email Providers

If you don't want to use Gmail, you can modify `utils/sendEmail.js` to use:
- **Outlook/Hotmail**: Change service to `'Hotmail'`
- **Yahoo**: Change service to `'Yahoo'`
- **Custom SMTP**: Replace service with host/port configuration
- **SendGrid/Mailgun**: Use their respective APIs

Example for custom SMTP:
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

## Testing Without Email

For development, you can use a test email service like:
- **Mailtrap**: https://mailtrap.io/ - Catch emails in development
- **Ethereal Email**: https://ethereal.email/ - Temporary test email accounts

Update the transporter configuration accordingly for testing.
