"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-vh-100 p-8 text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-premium-sm text-red-500">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <h2 className="text-2xl font-black mb-2 text-zinc-900 dark:text-zinc-100">โอ๊ะ! เกิดข้อผิดพลาดบางอย่าง</h2>
          <p className="text-zinc-500 max-w-md mx-auto mb-8">
            ระบบทำงานผิดพลาด กรุณาลองรีเฟรชหน้าเว็บอีกครั้ง หากปัญหายังคงอยู่โปรดติดต่อผู้ดูแลระบบ
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-premium-md"
          >
            <span className="material-symbols-outlined">refresh</span>
            รีเฟรชหน้าเว็บ
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
