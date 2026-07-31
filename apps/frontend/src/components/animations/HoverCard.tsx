import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  tiltEnabled?: boolean;
}

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(16, 185, 129, 0.15)', // Emerald primary theme
  tiltEnabled = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse positions relative to viewport
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring animations for rotation/tilt
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { damping: 25, stiffness: 180 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { damping: 25, stiffness: 180 });

  // Custom positioning of mouse shine gradient
  const [shineStyle, setShineStyle] = useState<React.CSSProperties>({
    opacity: 0,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Relative coordinates (-0.5 to 0.5)
    const relX = (e.clientX - rect.left) / width - 0.5;
    const relY = (e.clientY - rect.top) / height - 0.5;

    if (tiltEnabled) {
      mouseX.set(relX);
      mouseY.set(relY);
    }

    // Shine / Glow position
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setShineStyle({
      opacity: 1,
      background: `radial-gradient(300px circle at ${x}px ${y}px, ${glowColor}, transparent 80%)`,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
    setShineStyle({ opacity: 0 });
  };

  // Extract base border and bg styles if not provided in className
  const defaultStyles = className.includes('bg-') 
    ? '' 
    : 'bg-white border-slate-200 ';

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: tiltEnabled ? rotateX : 0,
        rotateY: tiltEnabled ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      animate={{
        y: isHovered ? -6 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${defaultStyles} ${className}`}
    >
      {/* Background Shine/Glow Effect */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
        style={shineStyle}
      />
      
      {/* 3D Content wrapper */}
      <div style={{ transform: 'translateZ(10px)' }} className="relative z-10 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
};
