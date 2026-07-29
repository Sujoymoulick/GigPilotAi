export const themeColors = {
  bgDark: '#05080E',
  cardBg: '#090D16',
  cardBorder: '#1E293B',
  accentPurple: '#10B981',
  accentBlue: '#0D9488',
  gradientPrimary: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500',
  gradientText: 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent',
};

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function getButtonClasses(variant: string = 'primary', size: string = 'md'): string {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-xl cursor-pointer';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20 border border-purple-500/30',
    secondary: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-100 border border-slate-700/80 backdrop-blur-md',
    outline: 'bg-transparent border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400',
    ghost: 'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20',
  };
  return `${base} ${(sizes as any)[size] || sizes.md} ${(variants as any)[variant] || variants.primary}`;
}

export function getCardClasses(glass: boolean = true): string {
  return glass
    ? 'bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:border-slate-700/80'
    : 'bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl';
}
