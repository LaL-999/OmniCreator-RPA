import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
  return (
    <span className="relative group inline-flex items-center justify-center ml-1.5 cursor-help align-middle">
      <Info className="w-3.5 h-3.5 text-content-dim hover:text-brand-soft transition-colors" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-surface-soft border border-line-strong text-content-muted text-xs leading-relaxed rounded-xl shadow-[0_18px_50px_-18px_rgba(0,0,0,0.9)] z-[60] pointer-events-none">
        {content}
        {/* 底部小箭头 */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-surface-soft"></span>
      </span>
    </span>
  );
};
