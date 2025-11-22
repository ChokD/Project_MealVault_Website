import React from 'react';

const TermsContent = ({ className = '' }) => (
  <div className={`space-y-8 text-gray-700 leading-relaxed ${className}`}>
    {/* Section 1: Terms of Service */}
    <section className="border-b border-gray-200 pb-6">
      <h2 className="text-2xl font-bold text-emerald-700 mb-4 flex items-center">
        <span className="mr-2">1.</span>
        ข้อกำหนดและเงื่อนไขการใช้งานเว็บไซต์ (Terms of Service)
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">1.1 การยอมรับข้อกำหนด</h3>
          <p className="text-sm">
            การเข้าถึงและการใช้งานเว็บไซต์ MealVault หมายความว่าคุณยอมรับและตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขการใช้งานทั้งหมดที่ระบุไว้ในเอกสารนี้ หากคุณไม่ยอมรับข้อกำหนดเหล่านี้ ทางเราไม่สามารถอนุญาตให้คุณใช้งานเว็บไซต์ของเราได้
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">1.2 การใช้งานบัญชี</h3>
          <ul className="list-disc list-inside text-sm space-y-1 ml-4">
            <li>ผู้ใช้มีหน้าที่รับผิดชอบในการรักษาความปลอดภัยของบัญชีและรหัสผ่าน</li>
            <li>ห้ามแชร์บัญชีกับบุคคลอื่น</li>
            <li>ผู้ใช้ต้องแจ้งทันทีหากพบการใช้งานบัญชีโดยไม่ได้รับอนุญาต</li>
            <li>เว็บไซต์มีสิทธิ์ระงับหรือลบบัญชีที่ละเมิดข้อกำหนดได้ทันที</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">1.3 สิทธิ์ในทรัพย์สินทางปัญญา</h3>
          <p className="text-sm">
            เนื้อหา รูปภาพ ข้อความ และข้อมูลทั้งหมดในเว็บไซต์เป็นทรัพย์สินทางปัญญาของ MealVault หรือผู้ให้สิทธิ์ ห้ามคัดลอก แก้ไข หรือแจกจ่ายโดยไม่ได้รับอนุญาต
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">1.4 การจำกัดความรับผิดชอบ</h3>
          <p className="text-sm">
            เว็บไซต์ให้บริการ "ตามสภาพ" โดยไม่มีการรับประกันใดๆ ทั้งสิ้น MealVault ไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้งานหรือไม่สามารถใช้งานเว็บไซต์ได้ รวมถึงข้อมูลที่แสดงบนเว็บไซต์
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">1.5 การแก้ไขข้อกำหนด</h3>
          <p className="text-sm">
            MealVault ขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดและเงื่อนไขการใช้งานได้ตลอดเวลา โดยจะแจ้งให้ผู้ใช้ทราบผ่านเว็บไซต์ การใช้งานต่อหลังจากมีการแก้ไขถือว่ายอมรับข้อกำหนดใหม่
          </p>
        </div>
      </div>
    </section>

    {/* Section 2: Community Guidelines */}
    <section className="border-b border-gray-200 pb-6">
      <h2 className="text-2xl font-bold text-emerald-700 mb-4 flex items-center">
        <span className="mr-2">2.</span>
        กฎข้อบังคับการใช้งานชุมชน (Community Guidelines)
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">2.1 เนื้อหาที่อนุญาต</h3>
          <ul className="list-disc list-inside text-sm space-y-1 ml-4">
            <li>โพสต์เฉพาะเนื้อหาที่เกี่ยวข้องกับอาหาร สูตรอาหาร และโภชนาการ</li>
            <li>ใช้ภาษาที่สุภาพและเหมาะสม</li>
            <li>ให้เครดิตเจ้าของสูตรอาหารหรือแหล่งที่มาของข้อมูล</li>
            <li>แชร์ประสบการณ์และความรู้ที่เป็นประโยชน์ต่อชุมชน</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">2.2 เนื้อหาที่ห้าม</h3>
          <ul className="list-disc list-inside text-sm space-y-1 ml-4">
            <li>เนื้อหาที่ผิดกฎหมาย หมิ่นประมาท หรือสร้างความเสียหาย</li>
            <li>เนื้อหาลามกอนาจาร หรือไม่เหมาะสม</li>
            <li>การโฆษณา สแปม หรือการส่งข้อความซ้ำๆ</li>
            <li>การละเมิดสิทธิ์ส่วนบุคคลหรือทรัพย์สินทางปัญญาของผู้อื่น</li>
            <li>การเผยแพร่ข้อมูลเท็จหรือทำให้เข้าใจผิด</li>
            <li>การคุกคาม การกลั่นแกล้ง หรือการแสดงพฤติกรรมที่ไม่เหมาะสม</li>
            <li>เนื้อหาที่ส่งเสริมความเกลียดชัง ความรุนแรง หรือการเลือกปฏิบัติ</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">2.3 การรายงานและการบังคับใช้</h3>
          <p className="text-sm">
            ผู้ใช้สามารถรายงานเนื้อหาที่ละเมิดกฎได้ผ่านระบบรายงาน MealVault มีสิทธิ์ลบเนื้อหา ระงับบัญชี หรือดำเนินการทางกฎหมายกับผู้ที่ละเมิดกฎอย่างร้ายแรง
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">2.4 การเคารพสิทธิ์ผู้อื่น</h3>
          <p className="text-sm">
            ผู้ใช้ต้องเคารพความคิดเห็นและสิทธิ์ของสมาชิกคนอื่นๆ ในชุมชน ห้ามใช้คำพูดที่รุนแรงหรือสร้างความแตกแยกในชุมชน
          </p>
        </div>
      </div>
    </section>

    {/* Section 3: PDPA */}
    <section className="pb-6">
      <h2 className="text-2xl font-bold text-emerald-700 mb-4 flex items-center">
        <span className="mr-2">3.</span>
        นโยบายคุ้มครองข้อมูลส่วนบุคคล (Personal Data Protection Act - PDPA)
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">3.1 ข้อมูลส่วนบุคคลที่เรารวบรวม</h3>
          <p className="text-sm mb-2">เรารวบรวมข้อมูลส่วนบุคคลต่อไปนี้:</p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-4">
            <li>ข้อมูลส่วนตัว: ชื่อ นามสกุล อีเมล เบอร์โทรศัพท์</li>
            <li>ข้อมูลการใช้งาน: ประวัติการใช้งาน ความชอบอาหาร ข้อมูลการแพ้อาหาร</li>
            <li>ข้อมูลเทคนิค: ที่อยู่ IP, Cookie, ข้อมูลอุปกรณ์</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">3.2 วัตถุประสงค์ในการใช้ข้อมูล</h3>
          <ul className="list-disc list-inside text-sm space-y-1 ml-4">
            <li>ให้บริการและปรับปรุงการใช้งานเว็บไซต์</li>
            <li>ส่งคำแนะนำอาหารที่เหมาะสมกับความชอบและข้อจำกัดของคุณ</li>
            <li>ติดต่อสื่อสารกับผู้ใช้เกี่ยวกับบริการ</li>
            <li>วิเคราะห์และพัฒนาบริการให้ดีขึ้น</li>
            <li>ปฏิบัติตามกฎหมายและข้อกำหนดทางกฎหมาย</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">3.3 การเก็บรักษาและความปลอดภัย</h3>
          <p className="text-sm">
            เรามีมาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลส่วนบุคคลของคุณจากการเข้าถึงโดยไม่ได้รับอนุญาต การเปิดเผย การเปลี่ยนแปลง หรือการทำลาย ข้อมูลจะถูกเก็บรักษาไว้ตามระยะเวลาที่จำเป็นตามวัตถุประสงค์ที่ระบุไว้
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">3.4 สิทธิ์ของผู้ใช้</h3>
          <p className="text-sm mb-2">ตามกฎหมาย PDPA คุณมีสิทธิ์:</p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-4">
            <li>ขอเข้าถึงข้อมูลส่วนบุคคลของคุณ</li>
            <li>ขอแก้ไขหรือลบข้อมูลส่วนบุคคล</li>
            <li>ขอระงับการประมวลผลข้อมูล</li>
            <li>คัดค้านการประมวลผลข้อมูล</li>
            <li>ขอให้ส่งโอนข้อมูลส่วนบุคคล</li>
            <li>ถอนความยินยอมเมื่อใดก็ได้</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">3.5 การเปิดเผยข้อมูล</h3>
          <p className="text-sm">
            เราจะไม่ขาย แลกเปลี่ยน หรือโอนข้อมูลส่วนบุคคลของคุณให้กับบุคคลที่สามโดยไม่ได้รับความยินยอมจากคุณ ยกเว้นกรณีที่จำเป็นตามกฎหมายหรือเพื่อให้บริการที่คุณร้องขอ
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">3.6 Cookie และเทคโนโลยีติดตาม</h3>
          <p className="text-sm">
            เว็บไซต์ใช้ Cookie และเทคโนโลยีติดตามเพื่อปรับปรุงประสบการณ์การใช้งาน คุณสามารถตั้งค่าบราวเซอร์เพื่อปฏิเสธ Cookie ได้ แต่การปฏิเสธอาจส่งผลต่อการใช้งานบางส่วนของเว็บไซต์
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">3.7 การติดต่อ</h3>
          <p className="text-sm">
            หากคุณมีคำถามเกี่ยวกับนโยบายคุ้มครองข้อมูลส่วนบุคคลหรือต้องการใช้สิทธิ์ตามกฎหมาย PDPA กรุณาติดต่อเราที่อีเมล: privacy@mealvault.com
          </p>
        </div>
      </div>
    </section>

    <style>{`
      .terms-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .terms-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .terms-scrollbar::-webkit-scrollbar-thumb {
        background: #10b981;
        border-radius: 10px;
      }
      .terms-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #059669;
      }
    `}</style>
  </div>
);

export default TermsContent;
