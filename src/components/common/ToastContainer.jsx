import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import './Toast.css';

const VARIANT_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const ToastItem = ({ toast, onDismiss }) => {
  const { id, type, title, message, duration } = toast;
  const [remainingTime, setRemainingTime] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  const IconComponent = VARIANT_ICONS[type] || Info;

  useEffect(() => {
    if (!duration || duration <= 0 || duration === Infinity) {
      return;
    }

    if (isPaused) {
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(id);
    }, remainingTime);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [id, duration, remainingTime, isPaused, onDismiss]);

  const handleMouseEnter = () => {
    if (!duration || duration <= 0 || duration === Infinity) return;
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const elapsed = Date.now() - startTimeRef.current;
    setRemainingTime((prev) => Math.max(0, prev - elapsed));
  };

  const handleMouseLeave = () => {
    if (!duration || duration <= 0 || duration === Infinity) return;
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  const role = type === 'error' || type === 'warning' ? 'alert' : 'status';
  const progressPercent =
    duration > 0 ? Math.max(0, Math.min(100, (remainingTime / duration) * 100)) : 0;

  return (
    <div
      className={`dk-toast-card dk-toast-card--${type}`}
      role={role}
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={`toast-${type}`}
      data-toast-id={id}
    >
      <div className="dk-toast-icon-wrapper" aria-hidden="true">
        <IconComponent size={20} strokeWidth={2.2} />
      </div>

      <div className="dk-toast-content">
        {title && <div className="dk-toast-title">{title}</div>}
        <div className="dk-toast-message">{message}</div>
      </div>

      <button
        type="button"
        className="dk-toast-close-btn"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>

      {duration > 0 && (
        <div
          className="dk-toast-progress-bar"
          style={{ width: `${progressPercent}%` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts, dismissToast } = useToast();
  const [portalElement, setPortalElement] = useState(null);

  useEffect(() => {
    let el = document.getElementById('portal-root');
    if (!el && typeof document !== 'undefined') {
      el = document.createElement('div');
      el.id = 'portal-root';
      document.body.appendChild(el);
    }
    setPortalElement(el || (typeof document !== 'undefined' ? document.body : null));
  }, []);

  if (!portalElement || toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div className="dk-toast-viewport" aria-label="Notifications" role="region">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>,
    portalElement
  );
};

export default ToastContainer;
