import React from 'react';
import { motion } from 'framer-motion';

const SuccessAnimation = ({ message }) => {
  // ตัวแปรสำหรับตั้งค่า Animation ของวงกลมและเครื่องหมายถูก
  const circleVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
  };

  const checkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { delay: 0.5, duration: 0.4, ease: 'easeOut' },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 24 24"
        initial="hidden"
        animate="visible"
      >
        {/* วงกลมสีเขียว */}
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="#27ae60"
          strokeWidth="2"
          fill="none"
          variants={circleVariants}
        />
        {/* เครื่องหมายถูก */}
        <motion.path
          d="M7 13l3 3 7-7"
          stroke="#27ae60"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={checkVariants}
        />
      </motion.svg>
      <motion.p
        className="text-lg font-semibold text-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        {message}
      </motion.p>
    </div>
  );
};

export default SuccessAnimation;