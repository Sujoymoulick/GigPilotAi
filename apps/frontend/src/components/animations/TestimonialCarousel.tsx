import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: 'Sarah Jenkins',
    role: 'Top Rated Voiceover Artist',
    avatar: 'SJ',
    quote: 'GigPilot AI helped me double my conversions in three weeks. The AI Gig Generator wrote an SEO-optimized description that put me on page one of Fiverr search.',
    rating: 5,
  },
  {
    name: 'Carlos Ruiz',
    role: 'Expert Full-Stack Developer',
    avatar: 'CR',
    quote: 'The proposal writer is a lifesaver. I used to spend hours tailoring proposals to buyer requests. Now I do it in seconds and get replies almost immediately.',
    rating: 5,
  },
  {
    name: 'Lina Chen',
    role: 'Level 2 Graphic Designer',
    avatar: 'LC',
    quote: 'Gig Health Checker showed me exactly why my impressions were dropping. Fixed my tags and SEO title based on the checklists and my traffic bounced back!',
    rating: 5,
  },
];

export const TestimonialCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1: left, 1: right
  const [isAutoplay, setIsAutoplay] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const handleNext = () => {
    setDirection(1);
    setIndex((prevIndex) => (prevIndex + 1) % DEFAULT_TESTIMONIALS.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setIndex((prevIndex) => (prevIndex - 1 + DEFAULT_TESTIMONIALS.length) % DEFAULT_TESTIMONIALS.length);
  };

  useEffect(() => {
    if (isAutoplay) {
      timerRef.current = setInterval(handleNext, 6000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoplay]);

  const current = DEFAULT_TESTIMONIALS[index];

  return (
    <div
      className="relative max-w-4xl mx-auto px-4 py-12"
      onMouseEnter={() => setIsAutoplay(false)}
      onMouseLeave={() => setIsAutoplay(true)}
    >
      <div className="absolute top-0 left-0 text-slate-200/10 pointer-events-none">
        <Quote className="w-32 h-32 stroke-[1.5px]" />
      </div>

      <div className="relative overflow-hidden h-[240px] flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
            }}
            className="w-full text-center px-8 md:px-16"
          >
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-5">
              {Array.from({ length: current.rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Testimonial text */}
            <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed mb-6 italic">
              "{current.quote}"
            </p>

            {/* User Meta */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-green-500/10">
                {current.avatar}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 leading-none mb-1">{current.name}</div>
                <div className="text-xs text-slate-500 font-medium">{current.role}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={handlePrev}
          className="p-2.5 rounded-full border border-slate-200 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-950 transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1.5">
          {DEFAULT_TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === i ? 'w-6 bg-green-500' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          className="p-2.5 rounded-full border border-slate-200 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-950 transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
