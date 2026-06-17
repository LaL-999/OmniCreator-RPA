import React from 'react';

interface AppleCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

// 深色玻璃面板：全站统一的内容卡片
export const AppleCard: React.FC<AppleCardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div
      className={`card overflow-hidden transition-all duration-300 hover:border-line-strong ${
        noPadding ? '' : 'p-6'
      } ${className}`}
    >
      {children}
    </div>
  );
};
