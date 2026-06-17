import React, { useState, useEffect, useRef } from 'react';
import { Bell, User, LogOut, AlertTriangle, AlertCircle, Info, RefreshCw, Check, Plus, CheckCircle2 } from 'lucide-react';

interface TopbarProps {
  onLogoutClick?: () => void;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  isLocalRead?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ onLogoutClick }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  const [toast, setToast] = useState({ show: false, message: '' });

  const currentUsername = localStorage.getItem('matrix_username') || 'Admin';
  const [accountList] = useState([
    {
      username: currentUsername,
      role: currentUsername === 'Admin' ? '超级管理员' : '系统用户',
      active: true
    }
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
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          const readIds = JSON.parse(localStorage.getItem('matrix_read_notifs') || '[]');
          const clearedIds = JSON.parse(localStorage.getItem('matrix_cleared_notifs') || '[]');
          const activeNotifs = data.notifications.filter((n: NotificationItem) => !clearedIds.includes(n.title));
          const processedNotifs = activeNotifs.map((n: NotificationItem) => ({ ...n, isLocalRead: readIds.includes(n.title) }));
          setNotifications(processedNotifs);
          setUnreadCount(processedNotifs.filter((n: NotificationItem) => !n.isLocalRead).length);
        }
      })
      .catch((err) => console.error('通知加载失败:', err));
  }, []);

  const handleMarkAllRead = () => {
    const readIds = JSON.parse(localStorage.getItem('matrix_read_notifs') || '[]');
    const newReadIds = [...readIds, ...notifications.map((n) => n.title)];
    localStorage.setItem('matrix_read_notifs', JSON.stringify(newReadIds));
    setNotifications(notifications.map((n) => ({ ...n, isLocalRead: true })));
    setUnreadCount(0);
  };

  const handleClearAll = () => {
    const clearedIds = JSON.parse(localStorage.getItem('matrix_cleared_notifs') || '[]');
    const newClearedIds = [...clearedIds, ...notifications.map((n) => n.title)];
    localStorage.setItem('matrix_cleared_notifs', JSON.stringify(newClearedIds));
    setNotifications([]);
    setUnreadCount(0);
    setShowNotifDropdown(false);
  };

  const showMessage = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  const switchAccount = (targetUsername: string) => {
    if (targetUsername === currentUsername) return;
    setShowAccountSwitcher(false);
    localStorage.setItem('matrix_username', targetUsername);
    showMessage(`已切换至账号：${targetUsername}，系统重载中...`);
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <>
      {/* 全局 Toast */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-surface/95 backdrop-blur-md text-content px-6 py-3.5 rounded-full shadow-[0_18px_50px_-18px_rgba(0,0,0,0.9)] border border-line-strong flex items-center gap-3 animate-slide-down">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-medium tracking-wide">{toast.message}</span>
        </div>
      )}

      <div className="h-16 flex items-center justify-between px-8 bg-surface/50 backdrop-blur-xl border-b border-line sticky top-0 z-20 flex-shrink-0">
        <div className="text-sm text-content-muted font-medium">
          Welcome back, <span className="text-content font-bold">{currentUsername}</span>
        </div>

        <div className="flex items-center space-x-5">
          {/* 通知 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowAvatarDropdown(false);
              }}
              className="p-2 text-content-dim hover:text-brand-soft transition-colors relative focus:outline-none"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-surface border border-line-strong rounded-2xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] overflow-hidden origin-top-right animate-scale-in z-50">
                <div className="px-5 py-3 border-b border-line flex justify-between items-center bg-white/[0.02]">
                  <span className="font-semibold text-content text-sm">系统通知</span>
                  <div className="space-x-3">
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-brand-soft hover:text-brand font-medium">
                        全部已读
                      </button>
                    )}
                    <button onClick={handleClearAll} className="text-xs text-red-400 hover:text-red-300 font-medium">
                      清空
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-5 py-8 text-center text-content-dim text-sm flex flex-col items-center">
                      <Info size={24} className="mb-2 opacity-50" />
                      暂无新通知
                    </div>
                  ) : (
                    notifications.map((note, idx) => (
                      <div
                        key={idx}
                        className={`px-5 py-4 border-b border-line hover:bg-white/[0.03] transition-colors cursor-pointer flex space-x-3 ${
                          note.isLocalRead ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {note.type === 'error' ? (
                            <AlertTriangle size={18} className="text-red-400" />
                          ) : (
                            <AlertCircle size={18} className="text-amber-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-content">{note.title}</p>
                          <p className="text-xs text-content-muted mt-1 leading-relaxed">{note.message}</p>
                          <p className="text-[10px] text-content-dim mt-2">{note.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-line-strong"></div>

          {/* 头像 */}
          <div className="relative" ref={avatarRef}>
            <div
              onClick={() => {
                setShowAvatarDropdown(!showAvatarDropdown);
                setShowNotifDropdown(false);
              }}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand to-accent flex items-center justify-center text-white shadow-glow cursor-pointer hover:brightness-110 transition-all"
            >
              <User size={16} />
            </div>

            {showAvatarDropdown && (
              <div className="absolute right-0 mt-3 w-48 bg-surface border border-line-strong rounded-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] overflow-hidden z-50 py-1 origin-top-right animate-scale-in">
                <div className="px-4 py-3 border-b border-line mb-1">
                  <p className="text-sm font-bold text-content truncate">{currentUsername}</p>
                  <p className="text-[10px] text-content-dim mt-0.5">
                    {currentUsername === 'Admin' ? '超级管理员' : '系统用户'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowAccountSwitcher(true);
                    setShowAvatarDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-content-muted hover:bg-brand/10 hover:text-brand-soft flex items-center gap-2 transition-colors"
                >
                  <RefreshCw size={14} />
                  切换账号
                </button>

                <button
                  onClick={() => {
                    setShowAvatarDropdown(false);
                    if (onLogoutClick) onLogoutClick();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} />
                  安全退出
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 账号切换弹窗 */}
      {showAccountSwitcher && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowAccountSwitcher(false)}
          ></div>

          <div className="relative bg-surface border border-line-strong rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-line flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-bold text-content">切换管理账号</h3>
              <button
                onClick={() => setShowAccountSwitcher(false)}
                className="text-content-dim hover:text-content font-medium text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {accountList.map((acc, idx) => (
                <button
                  key={idx}
                  onClick={() => switchAccount(acc.username)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    acc.active
                      ? 'bg-brand/10 border-brand/30 text-content'
                      : 'bg-white/[0.02] border-line hover:border-line-strong text-content-muted hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                        acc.active ? 'bg-gradient-to-tr from-brand to-accent' : 'bg-surface-soft'
                      }`}
                    >
                      <User size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold leading-tight">{acc.username}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{acc.role}</p>
                    </div>
                  </div>
                  {acc.active && <Check size={18} className="text-brand-soft" />}
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-line bg-white/[0.02]">
              <button
                onClick={() => {
                  setShowAccountSwitcher(false);
                  if (onLogoutClick) onLogoutClick();
                }}
                className="btn-ghost w-full"
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
