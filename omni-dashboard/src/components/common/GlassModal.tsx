import React, { useEffect } from 'react';
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
  // 支持 ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 使用 createPortal 将弹窗直接挂载到 body，彻底无视父组件的层叠上下文
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      {/* 弹窗本体：深色玻璃 + 品牌光晕描边 */}
      <div
        className={`relative bg-surface/95 backdrop-blur-2xl border border-line-strong shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] rounded-3xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-scale-in`}
      >
        {/* 头部固定区域 */}
        <div className="px-6 py-5 border-b border-line flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-content tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="text-content-dim hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容滚动区域 */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
};
