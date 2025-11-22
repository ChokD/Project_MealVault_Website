const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. สร้าง Transporter (ผู้ให้บริการส่งอีเมล)
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER, // อีเมลของคุณจาก .env
      pass: process.env.EMAIL_PASS, // App Password ของคุณจาก .env
    },
  });

  // 2. กำหนดรายละเอียดของอีเมล
  const mailOptions = {
    from: `MealVault <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  // 3. ส่งอีเมล
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;