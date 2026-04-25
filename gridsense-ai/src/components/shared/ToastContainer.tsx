import React from 'react';
import { useToastStore, ToastType } from '../../store/useToastStore';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="text-risk-low" size={20} />,
  warning: <AlertTriangle className="text-amber-500" size={20} />,
  error: <AlertCircle className="text-risk-critical" size={20} />,
  info: <Info className="text-cyan-electric" size={20} />,
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className="flex items-center gap-3 min-w-[300px] bg-grid-panel border border-border-subtle rounded-lg p-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)] animate-fade-in-up relative overflow-hidden"
        >
          <div className="shrink-0">{icons[toast.type]}</div>
          <div className="flex-1 text-sm font-sans text-text-primary">{toast.message}</div>
          <button 
            onClick={() => removeToast(toast.id)}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
