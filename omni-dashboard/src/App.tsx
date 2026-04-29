import React, { useState } from 'react';
import { Login } from './pages/Auth/Login';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { GlassModal } from './components/common/GlassModal';
import { ToastContainer } from './components/common/ToastContainer';
import { Dashboard } from './pages/Dashboard';
import { MediaLibrary } from './pages/MediaLibrary';
import { GlobalConfig } from './pages/GlobalConfig';
import { AdspowerTest } from './pages/ScriptConfigs/AdspowerTest';
import { AutoComment } from './pages/ScriptConfigs/AutoComment';
import { AutoDesk } from './pages/ScriptConfigs/AutoDesk';
import { AutoDM } from './pages/ScriptConfigs/AutoDM';
import { AutoVideo } from './pages/ScriptConfigs/AutoVideo';
import { AutoWarmup } from './pages/ScriptConfigs/AutoWarmup';
import KnowledgeBase from './pages/KnowledgeBase';

function App() {
  // 🔥 核心修改：初始化时读取本地存储，解决刷新掉线！
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true' ||
           sessionStorage.getItem('isAuthenticated') === 'true';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'media': return <MediaLibrary />;
      case 'global': return <GlobalConfig />;
      case 'script1': return <AdspowerTest />;
      case 'script2': return <AutoComment />;
      case 'script3': return <AutoDesk />;
      case 'script4': return <AutoDM />;
      case 'script5': return <AutoVideo />;
      case 'script6': return <AutoWarmup />;
      case 'knowledge': return <KnowledgeBase />;
      default: return <div>开发中...</div>;
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
    setIsAuthenticated(false);
    // 🔥 退出时清理全部存储
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('isAuthenticated');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800 relative">
      <ToastContainer />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 md:ml-64 h-screen flex flex-col overflow-hidden w-full">
        <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 border-b shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Matrix<span className="text-blue-600">Hub</span></h2>
          </div>
        </div>

        <div className="hidden md:block shrink-0">
          <Topbar onLogoutClick={() => setIsLogoutModalOpen(true)} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto pb-10">
            {renderContent()}
          </div>
        </div>
      </main>

      <GlassModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="系统提示">
        <div className="py-2">
          <p className="text-gray-600 mb-8">您确定要退出小红书矩阵控制台吗？未保存的配置可能会丢失。</p>
          <div className="flex justify-end space-x-3">
            <button onClick={() => setIsLogoutModalOpen(false)} className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">取消</button>
            <button onClick={handleLogout} className="px-5 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/30 transition-all">确定退出</button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

export default App;