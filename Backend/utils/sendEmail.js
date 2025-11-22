const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // ตรวจสอบว่ามีการตั้งค่าอีเมลหรือไม่
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER or EMAIL_PASS not configured in .env file');
    }

    // ตรวจสอบว่าเป็น Gmail หรืออีเมลอื่น
    const isGmail = process.env.EMAIL_USER.includes('@gmail.com');
    const isBumail = process.env.EMAIL_USER.includes('@bumail.net');

    let transportConfig;

    if (isGmail) {
      // Gmail configuration
      transportConfig = {
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };
    } else if (isBumail) {
      // BU Mail (Office 365) configuration
      transportConfig = {
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          ciphers: 'SSLv3',
        },
      };
    } else {
      // Generic SMTP configuration
      transportConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };
    }

    // 1. สร้าง Transporter (ผู้ให้บริการส่งอีเมล)
    const transporter = nodemailer.createTransport(transportConfig);

    // 2. กำหนดรายละเอียดของอีเมล
    const mailOptions = {
      from: `MealVault <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // 3. ส่งอีเมล
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = sendEmail;