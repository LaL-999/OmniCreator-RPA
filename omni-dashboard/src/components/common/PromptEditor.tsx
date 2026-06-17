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
        <h3 className="text-sm font-semibold text-content">{title}</h3>
        <InfoTooltip content={description} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 w-full min-h-[200px] p-4 text-sm font-mono text-content-muted bg-surface-input border border-line rounded-xl focus:outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/25 transition-all resize-y leading-relaxed placeholder-content-dim"
        placeholder="在此输入系统提示词..."
      />
    </div>
  );
};
