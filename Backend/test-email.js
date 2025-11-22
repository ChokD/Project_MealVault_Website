// Test Email Configuration
// Run this script to test if your email setup is working
// Usage: node test-email.js your-test-email@example.com

require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

const testEmail = async () => {
  const recipientEmail = process.argv[2];
  
  if (!recipientEmail) {
    console.error('❌ Please provide a recipient email address');
    console.log('Usage: node test-email.js your-email@example.com');
    process.exit(1);
  }

  console.log('📧 Testing email configuration...');
  console.log(`📬 Sending test email to: ${recipientEmail}`);
  console.log(`📨 From: ${process.env.EMAIL_USER}`);
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS not found in .env file!');
    console.log('Please update your Backend/.env file with:');
    console.log('  EMAIL_USER=your-email@gmail.com');
    console.log('  EMAIL_PASS=your-app-password');
    console.log('');
    console.log('See README_EMAIL_SETUP.md for detailed instructions');
    process.exit(1);
  }

  try {
    await sendEmail({
      to: recipientEmail,
      subject: '🧪 MealVault Email Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍽️ MealVault</h1>
              <p>Email Configuration Test</p>
            </div>
            <div class="content">
              <div class="success">
                <strong>✅ Success!</strong>
                <p>Your email configuration is working correctly.</p>
              </div>
              <p>This is a test email to verify that MealVault can send emails from your server.</p>
              <p><strong>Configuration Details:</strong></p>
              <ul>
                <li>Sender: ${process.env.EMAIL_USER}</li>
                <li>Service: Gmail SMTP</li>
                <li>Date: ${new Date().toLocaleString()}</li>
              </ul>
              <p>If you received this email, your password reset functionality should work correctly!</p>
            </div>
            <div class="footer">
              <p>© 2025 MealVault - Smart Meal Planning System</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('📬 Check the inbox of:', recipientEmail);
    console.log('');
    console.log('If you received the email, your configuration is correct!');
    console.log('The password reset feature should now work properly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send email!');
    console.error('Error:', error.message);
    console.log('');
    console.log('Common issues:');
    console.log('1. Check if EMAIL_USER and EMAIL_PASS are correctly set in .env');
    console.log('2. Make sure you\'re using an App Password (not your Gmail password)');
    console.log('3. Verify 2-Factor Authentication is enabled on your Gmail account');
    console.log('4. Remove any spaces from the App Password');
    console.log('');
    console.log('See README_EMAIL_SETUP.md for detailed setup instructions');
    process.exit(1);
  }
};

testEmail();
