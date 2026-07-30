import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  glowColor?: string;
  href?: string;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  type = 'button',
  disabled = false,
  isLoading = false,
  isSuccess = false,
  glowColor = 'rgba(16, 185, 129, 0.4)', // Emerald theme glow
  href,
}) => {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handlePointerDown = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (disabled || isLoading || isSuccess) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-[#8DE55A] to-[#7ad34a] hover:from-[#9bf56a] hover:to-[#8ae35a] text-slate-950 font-extrabold border border-green-500/20';
      case 'secondary':
        return 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-100 border border-slate-700/80 backdrop-blur-md font-semibold';
      case 'outline':
        return 'bg-transparent border border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-50/50 font-bold';
      case 'ghost':
        return 'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white font-medium';
    }
  };

  const commonProps = {
    onClick: onClick as any,
    onPointerDown: handlePointerDown,
    whileHover: !disabled && !isLoading && !isSuccess ? { scale: 1.03, y: -1 } : {},
    whileTap: !disabled && !isLoading && !isSuccess ? { scale: 0.98 } : {},
    className: `relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm transition-shadow duration-300 shadow-md ${getVariantStyles()} ${className} ${
      disabled || isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
    }`,
    style: !disabled && !isLoading && !isSuccess && variant === 'primary'
      ? { boxShadow: `0 10px 25px -5px rgba(141, 229, 90, 0.2)` }
      : {},
  };

  const renderContent = () => (
    <>
      {/* Glow highlight for primary */}
      {!disabled && !isLoading && !isSuccess && variant === 'primary' && (
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#8DE55A] to-[#9bf56a] blur-[8px] -z-10"
          style={{ transform: 'scale(1.05)' }}
        />
      )}

      {/* Ripple elements */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none bg-white/30 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
            width: '100px',
            height: '100px',
          }}
        />
      ))}

      {/* States content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>Processing...</span>
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 text-green-600"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            <span>Success!</span>
          </motion.div>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  if (href) {
    return (
      <motion.a href={href} {...(commonProps as any)}>
        {renderContent()}
      </motion.a>
    );
  }

  return (
    <motion.button type={type} disabled={disabled || isLoading} {...commonProps}>
      {renderContent()}
    </motion.button>
  );
};
