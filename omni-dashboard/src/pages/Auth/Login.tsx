import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { AppleCard } from '../../components/common/AppleCard';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // 初始化：读取记住的账号
  useEffect(() => {
    const savedUser = localStorage.getItem('matrix_username');
    const savedPass = localStorage.getItem('matrix_password');
    if (savedUser && savedPass) {
      setUsername(savedUser);
      setPassword(savedPass);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (secretKey !== '3233255407') {
        setError('系统级密匙错误，拒绝注册访问。');
        return;
      }
      setIsRegister(false);
      setError('');
      return;
    }

    if (username && password) {
      if (rememberMe) {
        localStorage.setItem('matrix_username', username);
        localStorage.setItem('matrix_password', password);
        localStorage.setItem('isAuthenticated', 'true'); // 永久免登录
      } else {
        localStorage.removeItem('matrix_username');
        localStorage.removeItem('matrix_password');
        sessionStorage.setItem('isAuthenticated', 'true'); // 会话级
      }
      onLoginSuccess();
    } else {
      setError('请输入账号和密码。');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* 背景：品牌光晕 + 细网格 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-base" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)'
          }}
        />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-brand/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-accent shadow-glow mb-4">
            <Activity size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-content">
            Omni<span className="bg-gradient-to-r from-brand-soft to-accent bg-clip-text text-transparent">Creator</span>
          </h1>
          <p className="text-content-muted mt-2">全自动化运营中枢系统</p>
        </div>

        <AppleCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="field-label">账号</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="field-input"
                placeholder="Admin"
              />
            </div>

            <div>
              <label className="field-label">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                placeholder="••••••••"
              />
            </div>

            {isRegister && (
              <div>
                <label className="field-label flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-red-400" /> 系统密匙
                </label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-red-500/5 border border-red-500/30 text-red-200 placeholder-red-400/50 focus:outline-none focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20 transition-all"
                  placeholder="请输入核心密匙"
                />
              </div>
            )}

            {!isRegister && (
              <label className="flex items-center text-sm text-content-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 rounded bg-surface-input border-line text-brand focus:ring-brand/40"
                />
                记住账号和登录状态
              </label>
            )}

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button type="submit" className="btn-primary w-full py-3 mt-1">
              {isRegister ? '验证并注册' : '登 录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-sm text-brand-soft hover:text-brand font-medium transition-colors"
            >
              {isRegister ? '返回登录' : '没有账号？使用密匙注册'}
            </button>
          </div>
        </AppleCard>

        <p className="text-center text-[11px] text-content-dim mt-6">OmniCreator 控制台 · 本地化部署 · v1.0</p>
      </div>
    </div>
  );
};
