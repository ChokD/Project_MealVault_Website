import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ClearPlanModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (!loading) onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] backdrop-blur-sm"
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          minWidth: '100vw',
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center shadow-lg">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <svg className="w-12 h-12 text-red-500 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.h2
            className="text-2xl font-bold text-gray-900 text-center mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            ล้างแผนเมนูทั้งหมด?
          </motion.h2>

          <motion.p
            className="text-gray-600 text-center mb-8 text-base leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            การล้างครั้งนี้จะลบเมนูทั้งหมดที่คุณเพิ่มไว้ในแผนรายสัปดาห์ คุณแน่ใจหรือไม่?
          </motion.p>

          <motion.div
            className="flex justify-center space-x-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={onConfirm}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              disabled={loading}
              className="px-6 py-3 font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 flex-1 shadow-lg shadow-rose-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังล้าง...' : 'ใช่, ล้างแผน' }
            </motion.button>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="px-6 py-3 font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              ไม่ล้างตอนนี้
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClearPlanModal;
