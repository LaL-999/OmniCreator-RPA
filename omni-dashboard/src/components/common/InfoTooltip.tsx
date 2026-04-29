// InfoTooltip.tsx - 待实现
import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
  return (
    <div className="relative group inline-flex items-center justify-center ml-2 cursor-help">
      <Info className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-gray-800/90 backdrop-blur-md text-white text-xs rounded-xl shadow-lg z-50 pointer-events-none">
        {content}
        {/* 底部小箭头 */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800/90"></div>
      </div>
    </div>
  );
};