import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import './AuthModal.css';

/**
 * AuthModal Component
 *
 * Accessible dialog supporting smooth switching between Customer Sign In
 * and Registration tabs (AC1).
 */
export function AuthModal({ isOpen = false, initialTab = 'login', onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSuccess = (user) => {
    if (typeof onSuccess === 'function') {
      onSuccess(user);
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div
      className="auth-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof onClose === 'function') {
          onClose();
        }
      }}
      data-testid="auth-modal-overlay"
    >
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        data-testid="auth-modal"
      >
        {/* Close Button */}
        <button
          type="button"
          className="auth-modal__close-btn"
          onClick={onClose}
          aria-label="Close authentication dialog"
          data-testid="close-auth-modal-btn"
        >
          <X size={20} />
        </button>

        {/* Brand Banner */}
        <div className="auth-modal__brand-hero">
          <div className="auth-modal__badge">
            <Sparkles size={14} />
            <span>Artisan Heritage • Dickwella</span>
          </div>
          <h2 id="auth-modal-title" className="auth-modal__title">
            Dickwella Fashion Corner
          </h2>
          <p className="auth-modal__subtitle">
            Sign in to synchronize your curated wishlists, track Southern Province deliveries, and
            access Ceylon handloom benefits.
          </p>
        </div>

        {/* Tab Switcher (AC1) */}
        <div className="auth-modal__tabs" role="tablist" aria-label="Authentication modes">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'login'}
            className={`auth-modal__tab ${activeTab === 'login' ? 'auth-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('login')}
            data-testid="tab-login"
          >
            Sign In
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'register'}
            className={`auth-modal__tab ${activeTab === 'register' ? 'auth-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('register')}
            data-testid="tab-register"
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="auth-modal__body">
          {activeTab === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setActiveTab('register')}
            />
          ) : (
            <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={() => setActiveTab('login')} />
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="auth-modal__footer-trust">
          <ShieldCheck size={14} />
          <span>Encrypted Session • Student Project SENG 31242</span>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
