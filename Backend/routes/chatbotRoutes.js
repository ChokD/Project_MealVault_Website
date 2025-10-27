const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// นำ API Key มาจาก .env
// ตรวจสอบว่ามี API Key หรือไม่
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('⚠️ WARNING: GEMINI_API_KEY is not set in .env file!');
}
const genAI = new GoogleGenerativeAI(apiKey);

// สร้าง API Endpoint สำหรับ Chatbot
// POST /api/chatbot/send
router.post('/chatbot/send', async (req, res) => {
  try {
    // ตรวจสอบ API Key ก่อน
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY กรุณาใส่ API Key ในไฟล์ .env' });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'กรุณาส่งข้อความ' });
    }

    // สร้าง prompt แบบง่ายๆ สำหรับ AI
    const prompt = `คุณคือ Mealer AI ผู้ช่วยด้านอาหาร ตอบคำถามเกี่ยวกับ:
- แนะนำเมนูอาหารจากวัตถุดิบเหลือใช้
- วิธีเก็บรักษาวัตถุดิบ
- วิธีทำอาหารและสูตรอาหาร
- คำแนะนำโภชนาการ

ตอบเป็นภาษาไทย อย่างเป็นมิตรและมีประโยชน์

คำถาม: ${message}`;

    // ใช้ generative model - ต้องระบุ model name
    // ต้องตรวจสอบว่า genAI ถูกสร้างถูกต้อง
    if (!genAI) {
      throw new Error('ไม่สามารถสร้าง GoogleGenerativeAI instance ได้');
    }
    
    // ใช้ model gemini-2.5-flash ตาม Google Quickstart ล่าสุด
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('Error with Gemini API:', error);
    console.error('API Key:', process.env.GEMINI_API_KEY ? 'มีอยู่' : 'ไม่มี');
    console.error('Error message:', error.message);
    
    // ตรวจสอบว่าเป็นปัญหา API Key หรือไม่
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในไฟล์ .env กรุณาตรวจสอบการตั้งค่า' });
    }
    
    // แสดง error แบบละเอียด
    const errorMsg = error.message || 'Unknown error';
    res.status(500).json({ 
      error: `เกิดข้อผิดพลาด: ${errorMsg}`,
      details: 'กรุณาตรวจสอบ API Key และลองสร้างใหม่'
    });
  }
});


module.exports = router;