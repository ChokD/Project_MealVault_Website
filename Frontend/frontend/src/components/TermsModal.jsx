import React from 'react';
import TermsContent from './TermsContent';

const TermsModal = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 animate-[termsFade_0.3s_ease]">
        <div className="w-full max-w-5xl bg-white rounded-[32px] shadow-[0_25px_70px_rgba(15,118,110,0.25)] border border-emerald-100/70 flex flex-col overflow-hidden animate-[termsPop_0.35s_ease]">
          <div className="px-8 py-6 bg-gradient-to-r from-emerald-50 via-white to-green-50 border-b border-emerald-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500 font-semibold">MealVault</p>
              <h3 className="text-2xl font-bold text-emerald-700">ข้อกำหนดและเงื่อนไขการใช้งาน</h3>
              <p className="text-sm text-gray-500">กรุณาอ่านรายละเอียดก่อนยอมรับเพื่อความปลอดภัยของบัญชีของคุณ</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-block text-xs font-semibold text-emerald-500 bg-emerald-100/70 px-3 py-1 rounded-full">Last updated {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short' })}</span>
              <button
                type="button"
                onClick={onClose}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
                aria-label="Close terms"
              >
                ×
              </button>
            </div>
          </div>

          <div className="px-8 py-6 bg-white">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-sm text-gray-600 leading-relaxed">
              ด้วยการใช้บัญชี MealVault คุณตกลงที่จะปฏิบัติตามเงื่อนไขการให้บริการ กฎชุมชน และนโยบายความเป็นส่วนตัวของเรา
            </div>
          </div>

          <div className="flex-1 px-8 pb-8 overflow-hidden">
            <div className="h-[60vh] max-h-[65vh] overflow-y-auto pr-4 terms-scrollbar bg-white rounded-2xl border border-gray-100 shadow-inner">
              <div className="px-6 py-6">
                <TermsContent />
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-white border-t border-gray-100 flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={onAccept}
              className="flex-1 px-6 py-4 rounded-2xl font-semibold text-lg text-white bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:shadow-xl shadow-lg transition-transform hover:-translate-y-0.5"
            >
              ฉันยอมรับข้อกำหนดและบริการ
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-semibold text-lg border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes termsFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes termsPop {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default TermsModal;
