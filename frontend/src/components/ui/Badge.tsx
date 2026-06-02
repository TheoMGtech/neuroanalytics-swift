import { ReactNode } from 'react';

type BadgeVariant = 'positive' | 'negative' | 'neutral' | 'critical' | 'warning' | 'info' | 'success';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge = ({ children, variant = 'neutral', className = '' }: BadgeProps) => {
  let styles = 'bg-[#333333] text-gray-300 border-[#444444]'; // Default neutral
  
  if (variant === 'positive' || variant === 'success') {
    styles = 'bg-green-500/10 text-green-400 border-green-500/20';
  } else if (variant === 'negative') {
    styles = 'bg-red-500/10 text-red-400 border-red-500/20';
  } else if (variant === 'critical') {
    styles = 'bg-[#E30613]/20 text-[#E30613] border-[#E30613]/30'; // Swift red
  } else if (variant === 'warning') {
    styles = 'bg-orange-500/10 text-orange-400 border-orange-500/20'; // Swift orange
  } else if (variant === 'info') {
    styles = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}>
      {children}
    </span>
  );
};
