import React, { useState } from 'react';
import { MapPin, User, Mail, Phone, Building, ArrowRight, ShieldCheck } from 'lucide-react';
import './AddressStep.css';

export const SRI_LANKAN_PROVINCES = [
  'Southern Province',
  'Western Province',
  'Central Province',
  'North Western Province',
  'Northern Province',
  'Eastern Province',
  'North Central Province',
  'Uva Province',
  'Sabaragamuwa Province',
];

export const SRI_LANKAN_DISTRICTS = {
  'Southern Province': ['Matara', 'Galle', 'Hambantota'],
  'Western Province': ['Colombo', 'Gampaha', 'Kalutara'],
  'Central Province': ['Kandy', 'Matale', 'Nuwara Eliya'],
  'North Western Province': ['Kurunegala', 'Puttalam'],
  'Northern Province': ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'],
  'Eastern Province': ['Batticaloa', 'Ampara', 'Trincomalee'],
  'North Central Province': ['Anuradhapura', 'Polonnaruwa'],
  'Uva Province': ['Badulla', 'Monaragala'],
  'Sabaragamuwa Province': ['Ratnapura', 'Kegalle'],
};

// Sri Lankan Validation Regexes
export const PHONE_REGEX = /^(?:\+94\s?|0)?7[0-9]{8}$/;
export const POSTAL_CODE_REGEX = /^[0-9]{5}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * AddressStep Component
 *
 * Captures customer contact and delivery address with strict Sri Lankan geographic validation.
 * Satisfies AC2 (Sri Lankan validation rules) and AC4 (Guest checkout without forced auth).
 */
export function AddressStep({
  initialAddress = null,
  onSubmitAddress,
  isGuest = true,
  className = '',
}) {
  const [formData, setFormData] = useState({
    fullName: initialAddress?.fullName || '',
    email: initialAddress?.email || '',
    phone: initialAddress?.phone || '',
    line1: initialAddress?.line1 || initialAddress?.street || '',
    line2: initialAddress?.line2 || '',
    province: initialAddress?.province || initialAddress?.state || 'Southern Province',
    district: initialAddress?.district || 'Matara',
    city: initialAddress?.city || 'Dickwella',
    postalCode: initialAddress?.postalCode || initialAddress?.postal_code || '81100',
    deliveryNotes: initialAddress?.deliveryNotes || '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 3) return 'Full name must be at least 3 characters';
        return null;
      case 'email':
        if (!value.trim()) return 'Email address is required for order receipts';
        if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address';
        return null;
      case 'phone':
        if (!value.trim()) return 'Phone number is required for courier delivery';
        if (!PHONE_REGEX.test(value.trim().replace(/\s/g, ''))) {
          return 'Enter a valid Sri Lankan mobile number (e.g., +94771234567 or 0771234567)';
        }
        return null;
      case 'line1':
        if (!value.trim()) return 'Street address line 1 is required';
        return null;
      case 'city':
        if (!value.trim()) return 'City or Town is required';
        return null;
      case 'province':
        if (!value) return 'Province selection is required';
        return null;
      case 'district':
        if (!value) return 'District selection is required';
        return null;
      case 'postalCode':
        if (!value.trim()) return 'Postal code is required';
        if (!POSTAL_CODE_REGEX.test(value.trim())) {
          return 'Enter a valid 5-digit Sri Lankan postal code (e.g., 81100 for Dickwella, 81000 for Matara)';
        }
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextFormData = { ...formData, [name]: value };

    // If province changes, reset district to the first available district in that province
    if (name === 'province') {
      const districtsForProvince = SRI_LANKAN_DISTRICTS[value] || [];
      nextFormData.district = districtsForProvince[0] || '';
    }

    setFormData(nextFormData);

    if (touched[name]) {
      const errorMsg = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all as touched
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      if (typeof onSubmitAddress === 'function') {
        onSubmitAddress({
          ...formData,
          country: 'Sri Lanka',
        });
      }
    }
  };

  const availableDistricts = SRI_LANKAN_DISTRICTS[formData.province] || [];

  return (
    <form
      className={`address-step ${className}`}
      onSubmit={handleSubmit}
      noValidate
      data-testid="address-form"
    >
      <div className="address-step__section-header">
        <div className="address-step__title-wrap">
          <MapPin size={20} className="address-step__header-icon" />
          <h2 className="address-step__title">Customer & Delivery Information</h2>
        </div>
        {isGuest && (
          <span className="address-step__guest-badge" data-testid="guest-checkout-badge">
            <ShieldCheck size={14} /> Guest Checkout (No Account Required)
          </span>
        )}
      </div>

      <p className="address-step__subtitle">
        Enter your delivery address for expedited courier fulfillment across Sri Lanka.
      </p>

      {/* Contact Section */}
      <div className="address-step__grid">
        <div className="form-group address-step__field--full">
          <label htmlFor="fullName" className="form-label">
            Full Name <span className="text-danger">*</span>
          </label>
          <div className="input-with-icon">
            <User size={18} className="input-icon" />
            <input
              id="fullName"
              name="fullName"
              type="text"
              className={`form-input ${errors.fullName && touched.fullName ? 'form-input--error' : ''}`}
              placeholder="e.g. Kasun Kalhara"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              data-testid="input-fullname"
            />
          </div>
          {errors.fullName && touched.fullName && (
            <span className="form-error" data-testid="error-fullname">
              {errors.fullName}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address <span className="text-danger">*</span>
          </label>
          <div className="input-with-icon">
            <Mail size={18} className="input-icon" />
            <input
              id="email"
              name="email"
              type="email"
              className={`form-input ${errors.email && touched.email ? 'form-input--error' : ''}`}
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              data-testid="input-email"
            />
          </div>
          {errors.email && touched.email && (
            <span className="form-error" data-testid="error-email">
              {errors.email}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Mobile Number (+94) <span className="text-danger">*</span>
          </label>
          <div className="input-with-icon">
            <Phone size={18} className="input-icon" />
            <input
              id="phone"
              name="phone"
              type="tel"
              className={`form-input ${errors.phone && touched.phone ? 'form-input--error' : ''}`}
              placeholder="077 123 4567"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              data-testid="input-phone"
            />
          </div>
          {errors.phone && touched.phone && (
            <span className="form-error" data-testid="error-phone">
              {errors.phone}
            </span>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div className="address-step__divider">
        <span>Delivery Location</span>
      </div>

      <div className="address-step__grid">
        <div className="form-group address-step__field--full">
          <label htmlFor="line1" className="form-label">
            Street Address / House No. <span className="text-danger">*</span>
          </label>
          <div className="input-with-icon">
            <Building size={18} className="input-icon" />
            <input
              id="line1"
              name="line1"
              type="text"
              className={`form-input ${errors.line1 && touched.line1 ? 'form-input--error' : ''}`}
              placeholder="e.g. No. 45, Tangalle Road"
              value={formData.line1}
              onChange={handleChange}
              onBlur={handleBlur}
              data-testid="input-line1"
            />
          </div>
          {errors.line1 && touched.line1 && (
            <span className="form-error" data-testid="error-line1">
              {errors.line1}
            </span>
          )}
        </div>

        <div className="form-group address-step__field--full">
          <label htmlFor="line2" className="form-label">
            Apartment, Suite, Landmark (Optional)
          </label>
          <input
            id="line2"
            name="line2"
            type="text"
            className="form-input"
            placeholder="e.g. Near Dickwella Lighthouse, Apt 3"
            value={formData.line2}
            onChange={handleChange}
            data-testid="input-line2"
          />
        </div>

        <div className="form-group">
          <label htmlFor="province" className="form-label">
            Province <span className="text-danger">*</span>
          </label>
          <select
            id="province"
            name="province"
            className="form-select"
            value={formData.province}
            onChange={handleChange}
            onBlur={handleBlur}
            data-testid="select-province"
          >
            {SRI_LANKAN_PROVINCES.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="district" className="form-label">
            District <span className="text-danger">*</span>
          </label>
          <select
            id="district"
            name="district"
            className={`form-select ${errors.district && touched.district ? 'form-select--error' : ''}`}
            value={formData.district}
            onChange={handleChange}
            onBlur={handleBlur}
            data-testid="select-district"
          >
            {availableDistricts.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>
          {errors.district && touched.district && (
            <span className="form-error" data-testid="error-district">
              {errors.district}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="city" className="form-label">
            City / Town <span className="text-danger">*</span>
          </label>
          <input
            id="city"
            name="city"
            type="text"
            className={`form-input ${errors.city && touched.city ? 'form-input--error' : ''}`}
            placeholder="e.g. Dickwella"
            value={formData.city}
            onChange={handleChange}
            onBlur={handleBlur}
            data-testid="input-city"
          />
          {errors.city && touched.city && (
            <span className="form-error" data-testid="error-city">
              {errors.city}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="postalCode" className="form-label">
            Postal Code (5 Digits) <span className="text-danger">*</span>
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            maxLength={5}
            className={`form-input ${errors.postalCode && touched.postalCode ? 'form-input--error' : ''}`}
            placeholder="81100"
            value={formData.postalCode}
            onChange={handleChange}
            onBlur={handleBlur}
            data-testid="input-postalcode"
          />
          {errors.postalCode && touched.postalCode && (
            <span className="form-error" data-testid="error-postalcode">
              {errors.postalCode}
            </span>
          )}
        </div>
      </div>

      <div className="address-step__actions">
        <button
          type="submit"
          className="btn-primary address-step__submit-btn"
          data-testid="proceed-to-shipping-btn"
        >
          <span>Continue to Shipping Method</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}

export default AddressStep;
