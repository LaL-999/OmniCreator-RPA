import React, { useState, useEffect, useRef } from 'react';
import { Bell, User, LogOut, AlertTriangle, AlertCircle, Info, RefreshCw, Check, Plus, CheckCircle2 } from 'lucide-react';

interface TopbarProps {
  onLogoutClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onLogoutClick }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  // 🔥 改造一：高颜值自定义 Toast 提示状态
  const [toast, setToast] = useState({ show: false, message: '' });

  // 🔥 改造二：读取真实登录信息，拒绝陌生账号
  const currentUsername = localStorage.getItem('matrix_username') || 'Admin';
  const [accountList, setAccountList] = useState([
    {
      username: currentUsername,
      role: currentUsername === 'Admin' ? '超级管理员' : '系统用户',
      active: true
    }
    // 注：后期你可以通过 fetch('/api/accounts') 从后端拉取该密匙下绑定的其他账号，追加到这个数组里
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowNotifDropdown(false);
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) setShowAvatarDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.notifications) {
          const readIds = JSON.parse(localStorage.getItem('matrix_read_notifs') || '[]');
          const clearedIds = JSON.parse(localStorage.getItem('matrix_cleared_notifs') || '[]');
          const activeNotifs = data.notifications.filter((n: any) => !clearedIds.includes(n.title));
          const processedNotifs = activeNotifs.map((n: any) => ({ ...n, isLocalRead: readIds.includes(n.title) }));
          setNotifications(processedNotifs);
          setUnreadCount(processedNotifs.filter((n: any) => !n.isLocalRead).length);
        }
      }).catch(err => console.error("通知加载失败:", err));
  }, []);

  const handleMarkAllRead = () => {
    const readIds = JSON.parse(localStorage.getItem('matrix_read_notifs') || '[]');
    const newReadIds = [...readIds, ...notifications.map(n => n.title)];
    localStorage.setItem('matrix_read_notifs', JSON.stringify(newReadIds));
    setNotifications(notifications.map(n => ({ ...n, isLocalRead: true })));
    setUnreadCount(0);
  };

  const handleClearAll = () => {
    const clearedIds = JSON.parse(localStorage.getItem('matrix_cleared_notifs') || '[]');
    const newClearedIds = [...clearedIds, ...notifications.map(n => n.title)];
    localStorage.setItem('matrix_cleared_notifs', JSON.stringify(newClearedIds));
    setNotifications([]);
    setUnreadCount(0);
    setShowNotifDropdown(false);
  };

  // 优雅的提示信息呼出函数
  const showMessage = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  // 🔥 改造三：注入灵魂的账号切换逻辑
  const switchAccount = (targetUsername: string) => {
    if (targetUsername === currentUsername) return; // 点击当前账号无反应

    setShowAccountSwitcher(false);

    // 1. 修改本地存储为新账号
    localStorage.setItem('matrix_username', targetUsername);

    // 2. 呼出高颜值提示
    showMessage(`已切换至账号：${targetUsername}，系统重载中...`);

    // 3. 核心修复：强制刷新页面！彻底清空旧账号的内存状态，触发后端新数据拉取！
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <>
      {/* 🌟 极致优雅的全局 Toast 提示框 */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-gray-900/90 backdrop-blur-md text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-8 fade-in duration-300">
          <CheckCircle2 size={18} className="text-green-400" />
          <span className="text-sm font-medium tracking-wide">{toast.message}</span>
        </div>
      )}

      <div className="h-16 flex items-center justify-between px-8 bg-white/60 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20 flex-shrink-0">
        <div className="text-sm text-gray-500 font-medium">
          Welcome back, <span className="text-gray-800 font-bold">{currentUsername}</span>
        </div>

        <div className="flex items-center space-x-5">

          {/* 通知模块 */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowAvatarDropdown(false); }} className="p-2 text-gray-400 hover:text-blue-600 transition-colors relative focus:outline-none">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="px-5 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <span className="font-semibold text-gray-800 text-sm">系统通知</span>
                  <div className="space-x-3">
                    {unreadCount > 0 && <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">全部已读</button>}
                    <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 font-medium">清空</button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-5 py-8 text-center text-gray-400 text-sm flex flex-col items-center"><Info size={24} className="mb-2 text-gray-300" />暂无新通知</div>
                  ) : (
                    notifications.map((note, idx) => (
                      <div key={idx} className={`px-5 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer flex space-x-3 ${note.isLocalRead ? 'opacity-50' : ''}`}>
                        <div className="mt-0.5 flex-shrink-0">
                          {note.type === 'error' ? <AlertTriangle size={18} className="text-red-500" /> : <AlertCircle size={18} className="text-orange-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{note.title}</p>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{note.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2">{note.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200"></div>

          {/* 头像与下拉菜单 */}
          <div className="relative" ref={avatarRef}>
            <div
              onClick={() => { setShowAvatarDropdown(!showAvatarDropdown); setShowNotifDropdown(false); }}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-md cursor-pointer hover:shadow-lg transition-all ring-2 ring-transparent hover:ring-blue-100"
            >
              <User size={16} />
            </div>

            {showAvatarDropdown && (
              <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-sm font-bold text-gray-800 truncate">{currentUsername}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{currentUsername === 'Admin' ? '超级管理员' : '系统用户'}</p>
                </div>

                <button
                  onClick={() => { setShowAccountSwitcher(true); setShowAvatarDropdown(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                >
                  <RefreshCw size={14} />
                  切换账号
                </button>

                <button
                  onClick={() => { setShowAvatarDropdown(false); if(onLogoutClick) onLogoutClick(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} />
                  安全退出
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 🖥️ 账号切换专属毛玻璃弹窗 */}
      {showAccountSwitcher && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* 黑色半透明背景遮罩 */}
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowAccountSwitcher(false)}></div>

          {/* 弹窗主体 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800">切换管理账号</h3>
              <button onClick={() => setShowAccountSwitcher(false)} className="text-gray-400 hover:text-gray-600 font-medium text-xl leading-none">&times;</button>
            </div>

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {accountList.map((acc, idx) => (
                <button
                  key={idx}
                  onClick={() => switchAccount(acc.username)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    acc.active
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-100 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${acc.active ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <User size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold leading-tight">{acc.username}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{acc.role}</p>
                    </div>
                  </div>
                  {acc.active && <Check size={18} className="text-blue-600" />}
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { setShowAccountSwitcher(false); if(onLogoutClick) onLogoutClick(); }}
                className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
              >
                <Plus size={16} />
                添加新账号 (前往密匙验证)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};