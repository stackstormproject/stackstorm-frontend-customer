import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 4000;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback((type, message, options = {}) => {
    counterRef.current += 1;
    const id = options.id || `toast-${Date.now()}-${counterRef.current}`;
    const duration = options.duration !== undefined ? options.duration : DEFAULT_DURATION;
    const title = options.title || null;

    const newToast = {
      id,
      type,
      title,
      message,
      duration,
      createdAt: Date.now(),
    };

    setToasts((prev) => {
      // If toast with same id already exists, update it
      const filtered = prev.filter((t) => t.id !== id);
      const updated = [...filtered, newToast];
      // Keep only up to MAX_TOASTS (FIFO eviction: drop oldest)
      if (updated.length > MAX_TOASTS) {
        return updated.slice(updated.length - MAX_TOASTS);
      }
      return updated;
    });

    return id;
  }, []);

  const toastMethods = {
    success: (message, options) => addToast('success', message, options),
    error: (message, options) => addToast('error', message, options),
    warning: (message, options) => addToast('warning', message, options),
    info: (message, options) => addToast('info', message, options),
    dismiss: dismissToast,
    clear: clearToasts,
  };

  const contextValue = {
    toasts,
    toast: toastMethods,
    addToast,
    dismissToast,
    clearToasts,
    success: toastMethods.success,
    error: toastMethods.error,
    warning: toastMethods.warning,
    info: toastMethods.info,
    dismiss: dismissToast,
    clear: clearToasts,
  };

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
