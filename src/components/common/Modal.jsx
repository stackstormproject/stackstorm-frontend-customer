import React, { useEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnClickOutside = true,
  closeOnEsc = true,
  showCloseButton = true,
  ariaLabel,
}) => {
  const [portalElement, setPortalElement] = useState(null);
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const generatedId = useId();

  const titleId = `modal-title-${generatedId}`;
  const descId = `modal-desc-${generatedId}`;

  // Find or create portal root
  useEffect(() => {
    let el = document.getElementById('portal-root');
    if (!el && typeof document !== 'undefined') {
      el = document.createElement('div');
      el.id = 'portal-root';
      document.body.appendChild(el);
    }
    setPortalElement(el || (typeof document !== 'undefined' ? document.body : null));
  }, []);

  // Background scroll lock & focus management
  useEffect(() => {
    if (!isOpen) return;

    // Capture currently focused element to restore upon close
    previousActiveElementRef.current = document.activeElement;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first focusable element or modal container
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === 'function'
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen]);

  // Keyboard navigation: Escape key & Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Escape key to dismiss
      if (e.key === 'Escape' && closeOnEsc) {
        e.stopPropagation();
        onClose();
        return;
      }

      // Focus trapping on Tab
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen || !portalElement) {
    return null;
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnClickOutside) {
      onClose();
    }
  };

  return createPortal(
    <div className="dk-modal-backdrop" onClick={handleBackdropClick} data-testid="modal-backdrop">
      <div
        ref={modalRef}
        className={`dk-modal-dialog dk-modal-dialog--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        aria-label={!title ? ariaLabel || 'Dialog window' : undefined}
        tabIndex={-1}
        data-testid="modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="dk-modal-header">
            <div className="dk-modal-header-text">
              {title && (
                <h3 id={titleId} className="dk-modal-title">
                  {title}
                </h3>
              )}
              {description && (
                <p id={descId} className="dk-modal-description">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                className="dk-modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
                data-testid="modal-close-btn"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div className="dk-modal-body" data-testid="modal-body">
          {children}
        </div>

        {footer && (
          <div className="dk-modal-footer" data-testid="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    portalElement
  );
};

export default Modal;
