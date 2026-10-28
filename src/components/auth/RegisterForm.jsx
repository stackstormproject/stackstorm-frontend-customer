import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import authApi from '../../api/auth.api';
import './RegisterForm.css';

// Validation Regex Constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+94\s?|0)?7[0-9]{8}$/;

/**
 * RegisterForm Component
 *
 * Captures customer registration with real-time password complexity meter,
 * Sri Lankan phone validation, and password visibility toggle (AC2 & AC3).
 */
export function RegisterForm({ onSuccess, onSwitchToLogin, className = '' }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Password complexity criteria
  const hasMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const isPasswordComplex = hasMinLength && hasUppercase && hasNumber;

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 3) return 'Name must be at least 3 characters';
        return null;
      case 'email':
        if (!value.trim()) return 'Email address is required';
        if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address';
        return null;
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!PHONE_REGEX.test(value.trim().replace(/\s/g, ''))) {
          return 'Enter a valid Sri Lankan mobile number (e.g., 0771234567 or +94771234567)';
        }
        return null;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least 1 uppercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least 1 number';
        return null;
      case 'agreeTerms':
        if (!value) return 'You must agree to the Terms of Service & Privacy Policy';
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextVal = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: nextVal }));

    if (touched[name]) {
      const err = validateField(name, nextVal);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const currentVal = type === 'checkbox' ? checked : value;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, currentVal);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    // Mark all touched
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const newErrors = {};
    Object.keys(formData).forEach((k) => {
      const err = validateField(k, formData[k]);
      if (err) newErrors[k] = err;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const res = await authApi.register({
        name: formData.fullName.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      const user = res?.customer || res?.user || res?.data?.user || res?.data || res;
      if (typeof onSuccess === 'function') {
        onSuccess(user);
      }
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.message ||
        data?.errors?.[0]?.message ||
        err.message ||
        'Registration failed. Please check your information.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className={`register-form ${className}`}
      onSubmit={handleSubmit}
      noValidate
      data-testid="register-form"
    >
      {/* Server Error Alert */}
      {serverError && (
        <div
          className="register-form__error-banner"
          role="alert"
          data-testid="register-error-banner"
        >
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      {/* Full Name */}
      <div className="form-group register-form__field">
        <label htmlFor="reg-name" className="form-label">
          Full Name <span className="text-danger">*</span>
        </label>
        <div className="input-with-icon">
          <User size={18} className="input-icon" />
          <input
            id="reg-name"
            name="fullName"
            type="text"
            className={`form-input ${errors.fullName && touched.fullName ? 'form-input--error' : ''}`}
            placeholder="e.g. Kasun Kalhara"
            value={formData.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            data-testid="input-register-name"
          />
        </div>
        {errors.fullName && touched.fullName && (
          <span className="form-error" data-testid="error-register-name">
            {errors.fullName}
          </span>
        )}
      </div>

      {/* Email Address */}
      <div className="form-group register-form__field">
        <label htmlFor="reg-email" className="form-label">
          Email Address <span className="text-danger">*</span>
        </label>
        <div className="input-with-icon">
          <Mail size={18} className="input-icon" />
          <input
            id="reg-email"
            name="email"
            type="email"
            className={`form-input ${errors.email && touched.email ? 'form-input--error' : ''}`}
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            data-testid="input-register-email"
          />
        </div>
        {errors.email && touched.email && (
          <span className="form-error" data-testid="error-register-email">
            {errors.email}
          </span>
        )}
      </div>

      {/* Phone Number */}
      <div className="form-group register-form__field">
        <label htmlFor="reg-phone" className="form-label">
          Mobile Number (+94) <span className="text-danger">*</span>
        </label>
        <div className="input-with-icon">
          <Phone size={18} className="input-icon" />
          <input
            id="reg-phone"
            name="phone"
            type="tel"
            className={`form-input ${errors.phone && touched.phone ? 'form-input--error' : ''}`}
            placeholder="077 123 4567"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            data-testid="input-register-phone"
          />
        </div>
        {errors.phone && touched.phone && (
          <span className="form-error" data-testid="error-register-phone">
            {errors.phone}
          </span>
        )}
      </div>

      {/* Password with Visibility Toggle (AC2) & Complexity Criteria (AC3) */}
      <div className="form-group register-form__field">
        <label htmlFor="reg-password" className="form-label">
          Create Password <span className="text-danger">*</span>
        </label>
        <div className="input-with-icon input-with-trailing">
          <Lock size={18} className="input-icon" />
          <input
            id="reg-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            className={`form-input ${errors.password && touched.password ? 'form-input--error' : ''}`}
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            data-testid="input-register-password"
          />
          {/* Explicit type="button" prevents form submission on toggle */}
          <button
            type="button"
            className="input-trailing-action"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            data-testid="register-password-toggle-btn"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && touched.password && (
          <span className="form-error" data-testid="error-register-password">
            {errors.password}
          </span>
        )}

        {/* Complexity Helper Checkpoints */}
        <div className="register-password-criteria" data-testid="password-criteria-wrap">
          <div className={`criterion-item ${hasMinLength ? 'criterion-item--met' : ''}`}>
            {hasMinLength ? <Check size={13} /> : <span className="criterion-bullet" />}
            <span>At least 8 characters</span>
          </div>
          <div className={`criterion-item ${hasUppercase ? 'criterion-item--met' : ''}`}>
            {hasUppercase ? <Check size={13} /> : <span className="criterion-bullet" />}
            <span>At least 1 uppercase letter</span>
          </div>
          <div className={`criterion-item ${hasNumber ? 'criterion-item--met' : ''}`}>
            {hasNumber ? <Check size={13} /> : <span className="criterion-bullet" />}
            <span>At least 1 number</span>
          </div>
        </div>
      </div>

      {/* Terms Agreement */}
      <div className="register-form__terms">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleChange}
            data-testid="register-terms-checkbox"
          />
          <span>
            I agree to the <a href="#terms">Terms of Service</a> &{' '}
            <a href="#privacy">Privacy Policy</a>
          </span>
        </label>
        {errors.agreeTerms && touched.agreeTerms && (
          <span className="form-error">{errors.agreeTerms}</span>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn-primary register-form__submit-btn"
        disabled={isSubmitting}
        data-testid="register-submit-btn"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="spinner-icon" />
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <span>Create Customer Account</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="register-form__footer-switch">
          <span>Already have a customer account?</span>
          <button
            type="button"
            className="register-form__switch-btn"
            onClick={onSwitchToLogin}
            data-testid="switch-to-login-btn"
          >
            Sign In
          </button>
        </div>
      )}
    </form>
  );
}

export default RegisterForm;
