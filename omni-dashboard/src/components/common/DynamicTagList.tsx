// DynamicTagList.tsx - 待实现
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
  placeholder = "输入内容后按回车添加..."
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onChange([...tags, inputValue.trim()]);
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
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <InfoTooltip content={description} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 group hover:border-blue-200 transition-all"
          >
            <span className="max-w-xs truncate" title={tag}>{tag}</span>
            <button
              onClick={() => handleRemove(index)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {tags.length === 0 && (
          <span className="text-sm text-gray-400">暂无配置，请添加。</span>
        )}
      </div>
    </div>
  );
};