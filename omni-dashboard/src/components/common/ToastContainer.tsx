import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

export const ToastContainer = () => {
  const [toastData, setToastData] = useState<{ type: ToastType; msg: string; id: number } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type: ToastType; msg: string };
      setToastData({ ...detail, id: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setToastData(null), 3000);
    };
    window.addEventListener('SHOW_TOAST', handleToast);
    return () => {
      window.removeEventListener('SHOW_TOAST', handleToast);
      clearTimeout(timer);
    };
  }, []);

  if (!toastData) return null;

  const palette: Record<ToastType, string> = {
    success: 'border-emerald-400/30 text-content',
    error: 'border-red-400/40 text-content',
    warning: 'border-amber-400/40 text-content',
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down">
      <div
        className={`flex items-center space-x-3 px-6 py-3.5 rounded-full bg-surface/95 backdrop-blur-xl border shadow-[0_18px_50px_-18px_rgba(0,0,0,0.9)] ${palette[toastData.type]}`}
      >
        {toastData.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
        {toastData.type === 'error' && <XCircle size={18} className="text-red-400" />}
        {toastData.type === 'warning' && <AlertCircle size={18} className="text-amber-400" />}
        <span className="font-medium tracking-wide text-sm">{toastData.msg}</span>
      </div>
    </div>
  );
};
