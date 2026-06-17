import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface DynamicTagListProps {
  title: string;
  description: string;
  tags: string[];
  onChange: (newTags: string[]) => void;
  placeholder?: string;
}

export const DynamicTagList: React.FC<DynamicTagListProps> = ({
  title,
  description,
  tags,
  onChange,
  placeholder = '输入内容后按回车添加...'
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const value = inputValue.trim();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <h3 className="text-sm font-semibold text-content">{title}</h3>
        <InfoTooltip content={description} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="field-input flex-1"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="p-2.5 rounded-xl bg-brand/10 text-brand-soft border border-brand/20 hover:bg-brand/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-line rounded-lg text-sm text-content-muted group hover:border-brand/40 hover:text-content transition-all"
          >
            <span className="max-w-xs truncate" title={tag}>
              {tag}
            </span>
            <button
              onClick={() => handleRemove(index)}
              className="text-content-dim hover:text-red-300 hover:bg-red-500/10 rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {tags.length === 0 && <span className="text-sm text-content-dim">暂无配置，请添加。</span>}
      </div>
    </div>
  );
};
