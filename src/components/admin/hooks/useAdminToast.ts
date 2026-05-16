import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMsg {
  id: string;
  msg: string;
  type: ToastType;
}

export function useAdminToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, showToast };
}