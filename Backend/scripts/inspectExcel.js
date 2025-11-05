require('dotenv').config();
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function inspectExcel() {
  try {
    // อ่านไฟล์ Excel
    const excelPath = path.join(__dirname, '../../thai_food_dataset_with_urls.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.error('ไม่พบไฟล์ Excel:', excelPath);
      return;
    }

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // แปลงเป็น JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`\n=== ข้อมูลจากไฟล์ Excel ===`);
    console.log(`ชื่อ Sheet: ${sheetName}`);
    console.log(`จำนวนแถว: ${data.length}`);
    
    if (data.length > 0) {
      console.log(`\n=== ชื่อคอลัมน์ (จากแถวแรก) ===`);
      const firstRow = data[0];
      console.log(Object.keys(firstRow));
      
      console.log(`\n=== ตัวอย่างข้อมูล 3 แถวแรก ===`);
      data.slice(0, 3).forEach((row, index) => {
        console.log(`\nแถว ${index + 1}:`);
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      });
    }

  } catch (error) {
    console.error('Error inspecting Excel:', error);
  }
}

// รันสคริปต์
if (require.main === module) {
  inspectExcel();
}

module.exports = { inspectExcel };

