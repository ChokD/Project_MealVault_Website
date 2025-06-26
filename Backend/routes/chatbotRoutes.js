const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// นำ API Key มาจาก .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// สร้าง API Endpoint สำหรับ Chatbot
// POST /api/chatbot/send
router.post('/chatbot/send', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'กรุณาส่งข้อความ' });
    }

    // 1. กำหนดบทบาทและกฎให้ AI
    const systemInstruction = `
      คุณคือ "Mealer AI" ผู้ช่วยเชี่ยวชาญด้านอาหารและสูตรอาหารเท่านั้น 
      หน้าที่ของคุณคือการตอบคำถาม, ให้คำแนะนำ, และสนทนาในเรื่องที่เกี่ยวข้องกับอาหาร, การทำอาหาร, วัตถุดิบ, และโภชนาการ

      ห้ามตอบคำถามนอกเหนือจากเรื่องเหล่านี้เด็ดขาด. 

      หากผู้ใช้ถามเรื่องอื่นที่ไม่เกี่ยวกับอาหาร เช่น การเมือง, ประวัติศาสตร์, เขียนโค้ด, หรือเรื่องส่วนตัว 
      ให้คุณตอบกลับอย่างสุภาพและเป็นมิตรว่า "ขออภัยค่ะ ฉันสามารถให้ข้อมูลได้เฉพาะเรื่องที่เกี่ยวกับอาหารเท่านั้น" 
      แล้วไม่ต้องพยายามตอบคำถามนั้นต่อ.
    `;

    // 2. ส่งกฎนี้เข้าไปตอนที่เลือกโมเดล
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction, // <-- เพิ่มส่วนนี้
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสื่อสารกับ AI' });
  }
});


module.exports = router;