import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const ToastContainer = () => {
  const [toastData, setToastData] = useState<{type: string, msg: string, id: number} | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToastData({ ...e.detail, id: Date.now() });
      // 3秒后自动消失
      setTimeout(() => setToastData(null), 3000);
    };
    window.addEventListener('SHOW_TOAST', handleToast);
    return () => window.removeEventListener('SHOW_TOAST', handleToast);
  }, []);

  if (!toastData) return null;

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className={`flex items-center space-x-3 px-6 py-3.5 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] backdrop-blur-xl border ${
        toastData.type === 'success' ? 'bg-gray-900/95 text-white border-gray-700' :
        toastData.type === 'error' ? 'bg-red-500/95 text-white border-red-400' :
        'bg-orange-400/95 text-white border-orange-300'
      }`}>
        {toastData.type === 'success' && <CheckCircle2 size={18} className="text-green-400" />}
        {toastData.type === 'error' && <XCircle size={18} className="text-white" />}
        {toastData.type === 'warning' && <AlertCircle size={18} className="text-white" />}
        <span className="font-medium tracking-wide text-sm">{toastData.msg}</span>
      </div>
    </div>
  );
};