import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

function TermsPage() {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const handleAccept = () => {
    if (accepted) {
      // เก็บสถานะการยอมรับใน localStorage
      localStorage.setItem('termsAccepted', 'true');
      // ไปหน้า register โดยอัตโนมัติ
      navigate('/register');
    }
  };

  // ตรวจสอบว่าผู้ใช้มาจากหน้า register หรือไม่
  useEffect(() => {
    const fromRegister = sessionStorage.getItem('fromRegister');
    if (!fromRegister) {
      // ถ้าไม่ได้มาจากหน้า register ให้เก็บข้อมูลไว้
      sessionStorage.setItem('fromRegister', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-white flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-200 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-green-200 rounded-full opacity-10 blur-3xl animate-pulse delay-75"></div>
      </div>
      
      <Navbar />
      <main className="flex-grow p-4 pt-24 pb-8 relative z-10">
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-emerald-100">
          <div className="p-6 md:p-8 lg:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
                ข้อกำหนดและเงื่อนไขการใช้งาน
              </h1>
              <p className="text-gray-600">Terms of Service, Community Guidelines & Privacy Policy</p>
              <p className="text-sm text-gray-500 mt-2">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Terms Content */}
            <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 mb-8 custom-scrollbar">
              {/* Section 1: Terms of Service */}
              <section className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-bold text-emerald-700 mb-4 flex items-center">
                  <span className="mr-2">1.</span>
                  ข้อกำหนดและเงื่อนไขการใช้งานเว็บไซต์ (Terms of Service)
                </h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">1.1 การยอมรับข้อกำหนด</h3>
                    <p className="text-sm">การเข้าถึงและการใช้งานเว็บไซต์ MealVault หมายความว่าคุณยอมรับและตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขการใช้งานทั้งหมดที่ระบุไว้ในเอกสารนี้ หากคุณไม่ยอมรับข้อกำหนดเหล่านี้ ทางเราไม่สามารถอนุญาตให้คุณใช้งานเว็บไซต์ของเราได้</p>
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
                    <p className="text-sm">เนื้อหา รูปภาพ ข้อความ และข้อมูลทั้งหมดในเว็บไซต์เป็นทรัพย์สินทางปัญญาของ MealVault หรือผู้ให้สิทธิ์ ห้ามคัดลอก แก้ไข หรือแจกจ่ายโดยไม่ได้รับอนุญาต</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">1.4 การจำกัดความรับผิดชอบ</h3>
                    <p className="text-sm">เว็บไซต์ให้บริการ "ตามสภาพ" โดยไม่มีการรับประกันใดๆ ทั้งสิ้น MealVault ไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้งานหรือไม่สามารถใช้งานเว็บไซต์ได้ รวมถึงข้อมูลที่แสดงบนเว็บไซต์</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">1.5 การแก้ไขข้อกำหนด</h3>
                    <p className="text-sm">MealVault ขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดและเงื่อนไขการใช้งานได้ตลอดเวลา โดยจะแจ้งให้ผู้ใช้ทราบผ่านเว็บไซต์ การใช้งานต่อหลังจากมีการแก้ไขถือว่ายอมรับข้อกำหนดใหม่</p>
                  </div>
                </div>
              </section>

              {/* Section 2: Community Guidelines */}
              <section className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-bold text-emerald-700 mb-4 flex items-center">
                  <span className="mr-2">2.</span>
                  กฎข้อบังคับการใช้งานชุมชน (Community Guidelines)
                </h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
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
                    <p className="text-sm">ผู้ใช้สามารถรายงานเนื้อหาที่ละเมิดกฎได้ผ่านระบบรายงาน MealVault มีสิทธิ์ลบเนื้อหา ระงับบัญชี หรือดำเนินการทางกฎหมายกับผู้ที่ละเมิดกฎอย่างร้ายแรง</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">2.4 การเคารพสิทธิ์ผู้อื่น</h3>
                    <p className="text-sm">ผู้ใช้ต้องเคารพความคิดเห็นและสิทธิ์ของสมาชิกคนอื่นๆ ในชุมชน ห้ามใช้คำพูดที่รุนแรงหรือสร้างความแตกแยกในชุมชน</p>
                  </div>
                </div>
              </section>

              {/* Section 3: PDPA */}
              <section className="pb-6">
                <h2 className="text-2xl font-bold text-emerald-700 mb-4 flex items-center">
                  <span className="mr-2">3.</span>
                  นโยบายคุ้มครองข้อมูลส่วนบุคคล (Personal Data Protection Act - PDPA)
                </h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
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
                    <p className="text-sm">เรามีมาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลส่วนบุคคลของคุณจากการเข้าถึงโดยไม่ได้รับอนุญาต การเปิดเผย การเปลี่ยนแปลง หรือการทำลาย ข้อมูลจะถูกเก็บรักษาไว้ตามระยะเวลาที่จำเป็นตามวัตถุประสงค์ที่ระบุไว้</p>
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
                    <p className="text-sm">เราจะไม่ขาย แลกเปลี่ยน หรือโอนข้อมูลส่วนบุคคลของคุณให้กับบุคคลที่สามโดยไม่ได้รับความยินยอมจากคุณ ยกเว้นกรณีที่จำเป็นตามกฎหมายหรือเพื่อให้บริการที่คุณร้องขอ</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">3.6 Cookie และเทคโนโลยีติดตาม</h3>
                    <p className="text-sm">เว็บไซต์ใช้ Cookie และเทคโนโลยีติดตามเพื่อปรับปรุงประสบการณ์การใช้งาน คุณสามารถตั้งค่าบราวเซอร์เพื่อปฏิเสธ Cookie ได้ แต่การปฏิเสธอาจส่งผลต่อการใช้งานบางส่วนของเว็บไซต์</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">3.7 การติดต่อ</h3>
                    <p className="text-sm">หากคุณมีคำถามเกี่ยวกับนโยบายคุ้มครองข้อมูลส่วนบุคคลหรือต้องการใช้สิทธิ์ตามกฎหมาย PDPA กรุณาติดต่อเราที่อีเมล: privacy@mealvault.com</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Acceptance Section */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="ml-3 text-gray-700 group-hover:text-gray-900">
                    <span className="font-semibold">ฉันได้อ่านและยอมรับข้อกำหนดและเงื่อนไขการใช้งานทั้งหมด</span>
                    <span className="block text-sm text-gray-600 mt-1">
                      รวมถึงข้อกำหนดการใช้งานเว็บไซต์ กฎข้อบังคับการใช้งานชุมชน และนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ที่ระบุไว้ข้างต้น
                    </span>
                  </span>
                </label>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={handleAccept}
                  disabled={!accepted}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
                    accepted
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:scale-[1.02] hover:shadow-xl cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  ยืนยันและดำเนินการต่อ
                </button>
                <Link
                  to="/"
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-lg text-center border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                >
                  ยกเลิก
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}</style>
    </div>
  );
}

export default TermsPage;

