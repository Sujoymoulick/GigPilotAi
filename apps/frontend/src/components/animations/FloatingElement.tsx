import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  children: React.ReactNode;
  duration?: number;
  yOffset?: number;
  xOffset?: number;
  delay?: number;
  className?: string;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  duration = 6,
  yOffset = 8,
  xOffset = 0,
  delay = 0,
  className = '',
}) => {
  return (
    <motion.div
      animate={{
        y: [0, -yOffset, 0],
        x: [0, xOffset, 0],
      }}
      transition={{
        duration,
        delay,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'reverse',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
