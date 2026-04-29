// AppleCard.tsx - 待实现
import React from 'react';

interface AppleCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const AppleCard: React.FC<AppleCardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white/70 backdrop-blur-xl border border-white/40 shadow-apple rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-apple-hover ${noPadding ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
};