'use client';

import { useState, useCallback } from 'react';
import Toast, { ToastType } from '@/components/Toast';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  const ToastContainer = useCallback(() => (
    <>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ bottom: `${24 + index * 80}px` }} className="fixed right-6 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </>
  ), [toasts, removeToast]);

  return { showToast, success, error, info, ToastContainer };
}
