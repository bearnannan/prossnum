"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const typeStyles = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200/60 dark:border-emerald-800',
      icon: 'check_circle',
      glow: '0 4px 16px rgba(16, 185, 129, 0.12)',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200/60 dark:border-red-800',
      icon: 'error',
      glow: '0 4px 16px rgba(239, 68, 68, 0.12)',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200/60 dark:border-blue-800',
      icon: 'info',
      glow: '0 4px 16px rgba(59, 130, 246, 0.12)',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5">
        {toasts.map((toast) => {
          const style = typeStyles[toast.type];
          return (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-2xl border backdrop-blur-lg text-sm font-semibold ${style.bg} ${style.text} ${style.border}`}
              style={{
                animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: style.glow,
              }}
            >
              <div className="flex items-center gap-2.5">
                <span 
                  className="material-symbols-outlined text-lg" 
                  style={{ 
                    fontVariationSettings: "'FILL' 1",
                    animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {style.icon}
                </span>
                {toast.message}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
