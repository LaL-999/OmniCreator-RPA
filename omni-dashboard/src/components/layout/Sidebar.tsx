import React from 'react';
import {
  LayoutDashboard,
  Settings,
  FileText,
  MessageSquare,
  Send,
  UserCheck,
  Video,
  Activity,
  BookOpen,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

type NavItem =
  | { type: 'divider'; label?: string }
  | { id: string; icon: React.ReactNode; label: string; type?: never };

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={19} />, label: '运行看板' },
    { id: 'media', icon: <Video size={19} />, label: '视频素材库' },
    { id: 'global', icon: <Settings size={19} />, label: '全局配置' },
    { id: 'knowledge', icon: <BookOpen size={19} />, label: '内容知识库' },
    { type: 'divider', label: '自动化引擎' },
    { id: 'script1', icon: <FileText size={19} />, label: '1. 图文发帖' },
    { id: 'script2', icon: <MessageSquare size={19} />, label: '2. 评论截流' },
    { id: 'script3', icon: <Send size={19} />, label: '3. 私信回复' },
    { id: 'script4', icon: <UserCheck size={19} />, label: '4. 回关互动' },
    { id: 'script5', icon: <Video size={19} />, label: '5. 视频发帖' },
    { id: 'script6', icon: <Activity size={19} />, label: '6. 混沌养号' }
  ];

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface/80 backdrop-blur-2xl border-r border-line flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="px-6 h-16 flex justify-between items-center border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-accent flex items-center justify-center shadow-glow">
              <Activity size={17} className="text-white" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-content">
              Omni<span className="bg-gradient-to-r from-brand-soft to-accent bg-clip-text text-transparent">Creator</span>
            </h2>
          </div>
          <button
            className="md:hidden p-2 -mr-2 text-content-dim hover:bg-white/10 rounded-lg"
            onClick={() => setIsOpen && setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item, index) => {
            if (item.type === 'divider') {
              return (
                <div key={index} className="px-3 pt-5 pb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-content-dim">
                    {item.label}
                  </span>
                </div>
              );
            }

            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'bg-brand/10 text-content font-semibold'
                    : 'text-content-muted hover:bg-white/[0.04] hover:text-content'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-brand to-accent" />
                )}
                <span className={isActive ? 'text-brand-soft' : 'text-content-dim group-hover:text-content-muted'}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-line">
          <div className="flex items-center gap-2 text-[11px] text-content-dim">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            调度引擎在线 · v1.0
          </div>
        </div>
      </div>
    </>
  );
};
