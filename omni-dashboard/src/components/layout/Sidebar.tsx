import React from 'react';
// 🔥 引入了 X (关闭图标)
import { LayoutDashboard, Settings, FileText, MessageSquare, Send, UserCheck, Video, Activity, BookOpen, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // 🔥 新增：移动端状态 Props
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: '运行看板' },
    { id: 'media', icon: <Video size={20} />, label: '视频素材库' },
    { id: 'global', icon: <Settings size={20} />, label: '全局配置' },
    { id: 'knowledge', icon: <BookOpen size={20} />, label: '内容知识库' },
    { type: 'divider' },
    { id: 'script1', icon: <FileText size={20} />, label: '1. 图文发帖' },
    { id: 'script2', icon: <MessageSquare size={20} />, label: '2. 评论截流' },
    { id: 'script3', icon: <Send size={20} />, label: '3. 私信回复' },
    { id: 'script4', icon: <UserCheck size={20} />, label: '4. 回关互动' },
    { id: 'script5', icon: <Video size={20} />, label: '5. 视频发帖' },
    { id: 'script6', icon: <Activity size={20} />, label: '6. 混沌养号' },
  ];

  return (
    <>
      {/* 📱 移动端背景遮罩：当菜单打开时，给右侧内容蒙上一层阴影 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      {/* 侧边栏容器：
          md:translate-x-0 电脑端始终显示
          -translate-x-full 手机端默认向左隐藏
          translate-x-0 手机端打开状态时滑入
      */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-2xl border-r border-gray-200/50 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>

        <div className="p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Matrix<span className="text-blue-600">Hub</span></h2>
          {/* 📱 手机端关闭按钮 */}
          <button
            className="md:hidden p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsOpen && setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
          {navItems.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={index} className="h-px bg-gray-200/50 my-4 mx-2"></div>;
            }

            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id!)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 shadow-sm text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};