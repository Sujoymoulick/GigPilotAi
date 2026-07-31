import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <button
              onClick={() => toggleIndex(index)}
              className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none"
            >
              <h3 className="text-sm font-extrabold text-slate-900 flex items-start gap-3">
                <HelpCircle className="w-4.5 h-4.5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{item.question}</span>
              </h3>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-slate-500 flex-shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="px-6 pb-5 text-slate-600 text-xs pl-13 leading-relaxed font-medium">
                    <p className="border-t border-slate-100 pt-4">{item.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
