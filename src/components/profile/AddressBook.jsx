import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Check,
  Trash2,
  Edit3,
  ShieldCheck,
  Phone,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import userApi from '../../api/user.api';
import './AddressBook.css';

const SRI_LANKA_DISTRICT_LIST = [
  'Matara',
  'Galle',
  'Hambantota',
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Mullaitivu',
  'Vavuniya',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
];

/**
 * AddressBook Component
 *
 * Manages customer's saved shipping addresses with Set as Default,
 * Add Address modal, and Delete actions (AC2).
 */
export function AddressBook({ addresses = [], onAddressesChange, className = '' }) {
  const [addressList, setAddressList] = useState(addresses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Form State
  const initialFormState = {
    recipient_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: 'Matara',
    postal_code: '',
    phone: '',
    is_default: addressList.length === 0,
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setFormData({
      ...initialFormState,
      is_default: addressList.length === 0,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddress(addr);
    setFormData({
      recipient_name: addr.recipient_name || '',
      address_line1: addr.address_line1 || '',
      address_line2: addr.address_line2 || '',
      city: addr.city || '',
      district: addr.district || 'Matara',
      postal_code: addr.postal_code || '',
      phone: addr.phone || '',
      is_default: !!addr.is_default,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    setErrorMessage(null);
  };

  const handleSetDefault = async (id) => {
    try {
      await userApi.setDefaultAddress(id);
      const updated = addressList.map((addr) => ({
        ...addr,
        is_default: addr.id === id,
      }));
      setAddressList(updated);
      if (typeof onAddressesChange === 'function') {
        onAddressesChange(updated);
      }
    } catch {
      // Local fallback
      const updated = addressList.map((addr) => ({
        ...addr,
        is_default: addr.id === id,
      }));
      setAddressList(updated);
      if (typeof onAddressesChange === 'function') {
        onAddressesChange(updated);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await userApi.deleteAddress(id);
      let updated = addressList.filter((addr) => addr.id !== id);
      // If we deleted the default and others remain, make first one default
      if (updated.length > 0 && !updated.some((a) => a.is_default)) {
        updated[0].is_default = true;
      }
      setAddressList(updated);
      if (typeof onAddressesChange === 'function') {
        onAddressesChange(updated);
      }
    } catch {
      let updated = addressList.filter((addr) => addr.id !== id);
      if (updated.length > 0 && !updated.some((a) => a.is_default)) {
        updated[0].is_default = true;
      }
      setAddressList(updated);
      if (typeof onAddressesChange === 'function') {
        onAddressesChange(updated);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validation
    if (!formData.recipient_name.trim()) {
      setErrorMessage('Recipient full name is required');
      return;
    }
    if (!formData.address_line1.trim()) {
      setErrorMessage('Street address is required');
      return;
    }
    if (!formData.city.trim()) {
      setErrorMessage('City is required');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Phone number is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingAddress) {
        // Edit existing
        const res = await userApi.updateAddress(editingAddress.id, formData);
        let updated = addressList.map((addr) =>
          addr.id === editingAddress.id ? { ...addr, ...formData } : addr
        );
        if (formData.is_default) {
          updated = updated.map((addr) => ({
            ...addr,
            is_default: addr.id === editingAddress.id,
          }));
        }
        setAddressList(updated);
        if (typeof onAddressesChange === 'function') onAddressesChange(updated);
      } else {
        // Add new
        const newAddr = await userApi.addAddress(formData);
        let updated = [...addressList];
        if (formData.is_default) {
          updated = updated.map((a) => ({ ...a, is_default: false }));
        }
        updated.push({
          id: newAddr.id || `addr-${Date.now()}`,
          ...formData,
        });
        setAddressList(updated);
        if (typeof onAddressesChange === 'function') onAddressesChange(updated);
      }
      handleCloseModal();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`address-book ${className}`} data-testid="address-book">
      {/* Header with Add Button */}
      <div className="address-book__header">
        <div>
          <h3 className="address-book__title">Saved Delivery Addresses</h3>
          <p className="address-book__subtitle">
            Manage your Sri Lankan shipping destinations for faster one-click checkout.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary address-book__add-btn"
          onClick={handleOpenAddModal}
          data-testid="add-address-btn"
        >
          <Plus size={16} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      {addressList.length === 0 ? (
        <div className="address-book__empty" data-testid="address-book-empty">
          <MapPin size={36} className="empty-icon" />
          <h4>No Saved Addresses Yet</h4>
          <p>Add your home or office address in Sri Lanka for expedited handloom delivery.</p>
          <button type="button" className="btn-secondary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Add First Address</span>
          </button>
        </div>
      ) : (
        <div className="address-book__grid" data-testid="address-cards-grid">
          {addressList.map((addr) => (
            <div
              key={addr.id}
              className={`address-card ${addr.is_default ? 'address-card--default' : ''}`}
              data-testid={`address-card-${addr.id}`}
            >
              {/* Card Header */}
              <div className="address-card__header">
                <div className="address-card__name-row">
                  <h4 className="address-card__name" data-testid="address-recipient-name">
                    {addr.recipient_name}
                  </h4>
                  {addr.is_default && (
                    <span className="address-badge-default" data-testid="badge-default-address">
                      <Check size={12} />
                      <span>Default</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card Details */}
              <div className="address-card__body">
                <p className="address-card__street">
                  {addr.address_line1}
                  {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                </p>
                <p className="address-card__city">
                  {addr.city}, {addr.district}
                  {addr.postal_code ? ` - ${addr.postal_code}` : ''}
                </p>
                <p className="address-card__phone">
                  <Phone size={14} />
                  <span>{addr.phone}</span>
                </p>
              </div>

              {/* Card Actions */}
              <div className="address-card__actions">
                {!addr.is_default && (
                  <button
                    type="button"
                    className="address-action-btn address-action-btn--default"
                    onClick={() => handleSetDefault(addr.id)}
                    data-testid={`set-default-btn-${addr.id}`}
                  >
                    Set as Default
                  </button>
                )}

                <div className="address-card__action-group">
                  <button
                    type="button"
                    className="address-action-icon-btn"
                    onClick={() => handleOpenEditModal(addr)}
                    aria-label="Edit address"
                    data-testid={`edit-address-btn-${addr.id}`}
                  >
                    <Edit3 size={16} />
                  </button>

                  <button
                    type="button"
                    className="address-action-icon-btn address-action-icon-btn--delete"
                    onClick={() => handleDelete(addr.id)}
                    aria-label="Delete address"
                    data-testid={`delete-address-btn-${addr.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div
          className="address-modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
          data-testid="address-modal-overlay"
        >
          <div
            className="address-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-modal-title"
            data-testid="address-modal"
          >
            <div className="address-modal__header">
              <h3 id="address-modal-title" className="address-modal__title">
                {editingAddress ? 'Edit Shipping Address' : 'Add New Shipping Address'}
              </h3>
              <button
                type="button"
                className="address-modal__close-btn"
                onClick={handleCloseModal}
                aria-label="Close modal"
                data-testid="close-address-modal-btn"
              >
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div className="address-modal__error" role="alert">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="address-modal__form">
              <div className="form-group">
                <label className="form-label" htmlFor="addr-recipient">
                  Recipient Full Name <span className="text-danger">*</span>
                </label>
                <input
                  id="addr-recipient"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Kasun Kalhara"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  required
                  data-testid="input-address-recipient"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="addr-street">
                  Street Address <span className="text-danger">*</span>
                </label>
                <input
                  id="addr-street"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 45 Temple Road, Dickwella"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  required
                  data-testid="input-address-line1"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="addr-line2">
                  Apartment, Suite, Unit (Optional)
                </label>
                <input
                  id="addr-line2"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Apt 3B / Near Dickwella Beach"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  data-testid="input-address-line2"
                />
              </div>

              <div className="address-modal__row">
                <div className="form-group">
                  <label className="form-label" htmlFor="addr-district">
                    District <span className="text-danger">*</span>
                  </label>
                  <select
                    id="addr-district"
                    className="form-select"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    data-testid="select-address-district"
                  >
                    {SRI_LANKA_DISTRICT_LIST.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="addr-city">
                    City / Town <span className="text-danger">*</span>
                  </label>
                  <input
                    id="addr-city"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dickwella"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    data-testid="input-address-city"
                  />
                </div>
              </div>

              <div className="address-modal__row">
                <div className="form-group">
                  <label className="form-label" htmlFor="addr-postal">
                    Postal Code (5 Digits)
                  </label>
                  <input
                    id="addr-postal"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 81100"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    maxLength={5}
                    data-testid="input-address-postal"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="addr-phone">
                    Mobile Phone (+94) <span className="text-danger">*</span>
                  </label>
                  <input
                    id="addr-phone"
                    type="tel"
                    className="form-input"
                    placeholder="077 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    data-testid="input-address-phone"
                  />
                </div>
              </div>

              <div className="form-group address-modal__checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    data-testid="checkbox-address-default"
                  />
                  <span>Set as default shipping address for all future orders</span>
                </label>
              </div>

              <div className="address-modal__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                  data-testid="submit-address-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spinner-icon" />
                      <span>Saving Address...</span>
                    </>
                  ) : (
                    <span>{editingAddress ? 'Update Address' : 'Save Address'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressBook;
