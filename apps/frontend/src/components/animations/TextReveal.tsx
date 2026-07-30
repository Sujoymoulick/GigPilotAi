import React from 'react';
import { motion } from 'framer-motion';

interface TextRevealProps {
  text: string;
  type?: 'word' | 'char' | 'typing';
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  type = 'word',
  delay = 0,
  duration = 0.4,
  className = '',
  once = true,
}) => {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: type === 'word' ? 0.08 : type === 'char' ? 0.03 : 0.05,
        delayChildren: delay,
      },
    },
  };

  if (type === 'typing') {
    const chars = Array.from(text);
    const charVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.01 },
      },
    };

    return (
      <motion.span
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once }}
        className={`inline-block ${className}`}
      >
        {chars.map((char, index) => (
          <motion.span key={index} variants={charVariants}>
            {char}
          </motion.span>
        ))}
      </motion.span>
    );
  }

  if (type === 'char') {
    const chars = Array.from(text);
    const charVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration, ease: [0.16, 1, 0.3, 1] },
      },
    };

    return (
      <motion.span
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once }}
        className={`inline-block ${className}`}
      >
        {chars.map((char, index) => (
          <motion.span
            key={index}
            variants={charVariants}
            className="inline-block"
            style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
          >
            {char}
          </motion.span>
        ))}
      </motion.span>
    );
  }

  // Word-by-word reveal (default)
  const words = text.split(' ');
  const wordVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      className={`inline-block ${className}`}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};
