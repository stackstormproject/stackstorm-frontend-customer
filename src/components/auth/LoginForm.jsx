import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Clock, ArrowRight, Loader2 } from 'lucide-react';
import authApi from '../../api/auth.api';
import './LoginForm.css';

/**
 * LoginForm Component
 * 
 * Supports customer authentication with password visibility toggle,
 * remember me, and active 15-minute lockout countdown banner (AC2 & AC4).
 */
export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword,
  initialEmail = '',
  className = '',
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Lockout State (HTTP 423)
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const timerRef = useRef(null);

  // Format MM:SS for lockout countdown
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  // Lockout ticker
  useEffect(() => {
    if (lockoutSeconds > 0) {
      timerRef.current = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockoutSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authApi.login(email.trim(), password);
      const user = res?.customer || res?.user || res?.data?.user || res?.data || res;
      if (typeof onSuccess === 'function') {
        onSuccess(user);
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      // Handle HTTP 423 Locked (5 failed attempts)
      if (status === 423) {
        const retryHeader = err.response?.headers?.['retry-after'];
        const retrySeconds =
          parseInt(retryHeader, 10) ||
          data?.errors?.[0]?.retryAfterSeconds ||
          900; // default 15 mins

        setLockoutSeconds(retrySeconds);
        setErrorMessage(
          data?.message ||
            `Account temporarily locked due to 5 consecutive failed login attempts.`
        );
      } else {
        const msg =
          data?.message ||
          data?.errors?.[0]?.message ||
          err.message ||
          'Invalid email or password. Please try again.';
        setErrorMessage(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <form
      className={`login-form ${className}`}
      onSubmit={handleSubmit}
      noValidate
      data-testid="login-form"
    >
      {/* Active Lockout Alert Banner (AC4) */}
      {isLocked && (
        <div
          className="login-form__lockout-banner"
          role="alert"
          aria-live="assertive"
          data-testid="lockout-countdown-banner"
        >
          <div className="login-form__lockout-icon">
            <Clock size={20} />
          </div>
          <div className="login-form__lockout-text">
            <strong>Account Temporarily Locked</strong>
            <p>
              Too many failed login attempts. Please wait{' '}
              <span className="login-form__lockout-clock" data-testid="lockout-clock">
                {formatTime(lockoutSeconds)}
              </span>{' '}
              before trying again.
            </p>
          </div>
        </div>
      )}

      {/* General Error Notice */}
      {errorMessage && !isLocked && (
        <div
          className="login-form__error-banner"
          role="alert"
          data-testid="login-error-banner"
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="form-group login-form__field">
        <label htmlFor="login-email" className="form-label">
          Email Address
        </label>
        <div className="input-with-icon">
          <Mail size={18} className="input-icon" />
          <input
            id="login-email"
            type="email"
            className="form-input"
            placeholder="e.g. shopper@dickwella.lk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting || isLocked}
            autoComplete="email"
            data-testid="input-login-email"
          />
        </div>
      </div>

      {/* Password Input with Visibility Toggle (AC2) */}
      <div className="form-group login-form__field">
        <div className="login-form__label-row">
          <label htmlFor="login-password" className="form-label">
            Password
          </label>
          {onForgotPassword && (
            <button
              type="button"
              className="login-form__forgot-link"
              onClick={onForgotPassword}
              data-testid="forgot-password-link"
            >
              Forgot Password?
            </button>
          )}
        </div>
        <div className="input-with-icon input-with-trailing">
          <Lock size={18} className="input-icon" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting || isLocked}
            autoComplete="current-password"
            data-testid="input-login-password"
          />
          {/* Explicit type="button" prevents accidental form submission (Failure Recovery Matrix) */}
          <button
            type="button"
            className="input-trailing-action"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            data-testid="password-toggle-btn"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Remember Me */}
      <div className="login-form__remember-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isSubmitting || isLocked}
            data-testid="login-remember-me"
          />
          <span>Remember this device for 30 days</span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn-primary login-form__submit-btn"
        disabled={isSubmitting || isLocked}
        data-testid="login-submit-btn"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="spinner-icon" />
            <span>Signing In...</span>
          </>
        ) : isLocked ? (
          <>
            <Clock size={16} />
            <span>Locked ({formatTime(lockoutSeconds)})</span>
          </>
        ) : (
          <>
            <span>Sign In to Your Account</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>

      {/* Switch to Register */}
      {onSwitchToRegister && (
        <div className="login-form__footer-switch">
          <span>New to Dickwella Fashion Corner?</span>
          <button
            type="button"
            className="login-form__switch-btn"
            onClick={onSwitchToRegister}
            data-testid="switch-to-register-btn"
          >
            Create an Account
          </button>
        </div>
      )}
    </form>
  );
}

export default LoginForm;
