import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose} // คลิกพื้นหลังเพื่อปิด
      >
        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
          onClick={(e) => e.stopPropagation()} // ป้องกันไม่ให้คลิกที่การ์ดแล้วปิด
        >
          <h2 className="text-lg font-bold text-gray-800 text-center mb-6">{title}</h2>
          <div className="flex justify-center space-x-4">
            {/* ปุ่มยกเลิก (สีแดง) */}
            <button
              onClick={onClose}
              className="px-8 py-2 font-semibold text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors"
            >
              ยกเลิก
            </button>
            {/* ปุ่มยืนยัน (สีเขียว) */}
            <button
              onClick={onConfirm}
              className="px-8 py-2 font-semibold text-white bg-green-500 rounded-full hover:bg-green-600 transition-colors"
            >
              ยืนยัน
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;