import React from 'react';
import { InfoTooltip } from './InfoTooltip';

interface PromptEditorProps {
  title: string;
  description: string;
  value: string;
  onChange: (newValue: string) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ title, description, value, onChange }) => {
  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <InfoTooltip content={description} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 w-full min-h-[200px] p-4 text-sm font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all resize-y leading-relaxed"
        placeholder="在此输入系统提示词..."
      />
    </div>
  );
};