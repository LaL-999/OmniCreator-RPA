import React from 'react';
import { createPortal } from 'react-dom'; // 引入提权魔法 Portal
import { X } from 'lucide-react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg'
}) => {
  if (!isOpen) return null;

  // 使用 createPortal 将弹窗直接挂载到 HTML 的 body 标签上，彻底无视父组件的结界
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* 黑色半透明背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* 弹窗本体：加入超级阴影和更通透的毛玻璃 */}
      <div className={`relative bg-white/90 backdrop-blur-3xl border border-white/50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] rounded-3xl w-full ${maxWidth} max-h-[90vh] flex flex-col transform transition-all`}>

        {/* 头部固定区域 */}
        <div className="px-6 py-5 border-b border-gray-200/60 flex items-center justify-between flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-800 tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容滚动区域 */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body // 目标传送位置：网页最顶层
  );
};