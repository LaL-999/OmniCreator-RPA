import React, { useState, useEffect } from 'react';
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
  // 🔥 新增：记住密码状态
  const [rememberMe, setRememberMe] = useState(false);

  // 🔥 初始化：检查硬盘里有没有记住的账号密码
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
      alert('注册成功！');
      setIsRegister(false);
    } else {
      if (username && password) {
        // 🔥 登录成功后：处理持久化存储
        if (rememberMe) {
          localStorage.setItem('matrix_username', username);
          localStorage.setItem('matrix_password', password);
          localStorage.setItem('isAuthenticated', 'true'); // 硬盘级：永久免登录
        } else {
          localStorage.removeItem('matrix_username');
          localStorage.removeItem('matrix_password');
          sessionStorage.setItem('isAuthenticated', 'true'); // 会话级：刷新免登录，关网页掉线
        }
        onLoginSuccess();
      } else {
        setError('请输入账号和密码。');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-2xl"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">Matrix<span className="text-blue-600">Hub</span></h1>
          <p className="text-gray-500 mt-2">全自动化运营中枢系统</p>
        </div>

        <AppleCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">账号</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-100/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="Admin" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-100/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="••••••••" />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">系统密匙</label>
                <input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-red-50/50 border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder-red-300 text-red-700" placeholder="请输入核心密匙" />
              </div>
            )}

            {/* 🔥 新增：记住账号UI */}
            {!isRegister && (
              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="mr-2 rounded text-blue-600 focus:ring-blue-500" />
                  记住账号和登录状态
                </label>
              </div>
            )}

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button type="submit" className="w-full py-3 mt-4 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 transition-colors shadow-lg shadow-gray-800/20">
              {isRegister ? '验证并注册' : '登 录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
              {isRegister ? '返回登录' : '没有账号？使用密匙注册'}
            </button>
          </div>
        </AppleCard>
      </div>
    </div>
  );
};