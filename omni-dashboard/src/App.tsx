import React, { useState } from 'react';
import { Menu } from 'lucide-react';
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

const Wordmark = () => (
  <h2 className="text-xl font-bold tracking-tight text-content">
    Omni<span className="bg-gradient-to-r from-brand-soft to-accent bg-clip-text text-transparent">Creator</span>
  </h2>
);

function App() {
  // 初始化时读取本地存储，避免刷新掉线
  const [isAuthenticated, setIsAuthenticated] = useState(
    () =>
      localStorage.getItem('isAuthenticated') === 'true' ||
      sessionStorage.getItem('isAuthenticated') === 'true'
  );

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'media':
        return <MediaLibrary />;
      case 'global':
        return <GlobalConfig />;
      case 'script1':
        return <AdspowerTest />;
      case 'script2':
        return <AutoComment />;
      case 'script3':
        return <AutoDesk />;
      case 'script4':
        return <AutoDM />;
      case 'script5':
        return <AutoVideo />;
      case 'script6':
        return <AutoWarmup />;
      case 'knowledge':
        return <KnowledgeBase />;
      default:
        return <div className="text-content-muted">开发中...</div>;
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('isAuthenticated');
  };

  return (
    <div className="min-h-screen flex font-sans text-content relative">
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
        {/* 移动端顶栏 */}
        <div className="md:hidden flex items-center justify-between bg-surface/80 backdrop-blur-xl px-4 py-3 border-b border-line z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-content-muted hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu size={22} />
            </button>
            <Wordmark />
          </div>
        </div>

        <div className="hidden md:block shrink-0">
          <Topbar onLogoutClick={() => setIsLogoutModalOpen(true)} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto pb-10 animate-fade-in">{renderContent()}</div>
        </div>
      </main>

      <GlassModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="系统提示">
        <div className="py-1">
          <p className="text-content-muted mb-8">您确定要退出 OmniCreator 控制台吗？未保存的配置可能会丢失。</p>
          <div className="flex justify-end space-x-3">
            <button onClick={() => setIsLogoutModalOpen(false)} className="btn-ghost">
              取消
            </button>
            <button onClick={handleLogout} className="btn-danger">
              确定退出
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

export default App;
