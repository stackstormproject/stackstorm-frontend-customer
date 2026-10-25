import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Award,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  ArrowLeft,
  LogOut,
  Save,
  Loader2,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { LoyaltyCard } from '../components/profile/LoyaltyCard';
import { AddressBook } from '../components/profile/AddressBook';
import userApi, { FALLBACK_PROFILE } from '../api/user.api';
import { useToast } from '../context/ToastContext';
import './CustomerProfilePage.css';

/**
 * CustomerProfilePage Component
 * 
 * Central self-service hub for registered customers to manage personal info,
 * shipping destinations, and view their Ceylon Heritage Loyalty tier (AC1–AC4).
 */
export function CustomerProfilePage({
  initialProfile = null,
  onBackToCatalog,
  onProfileUpdated,
  onLogout,
  className = '',
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'addresses' | 'loyalty'
  const [profile, setProfile] = useState(initialProfile || FALLBACK_PROFILE);
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    first_name: initialProfile?.first_name || FALLBACK_PROFILE.first_name,
    last_name: initialProfile?.last_name || FALLBACK_PROFILE.last_name,
    phone: initialProfile?.phone || FALLBACK_PROFILE.phone,
    marketing_opt_in: initialProfile?.marketing_opt_in ?? FALLBACK_PROFILE.marketing_opt_in,
  });

  useEffect(() => {
    let isMounted = true;
    if (!initialProfile) {
      userApi
        .getProfile()
        .then((data) => {
          if (isMounted && data) {
            setProfile(data);
            setFormData({
              first_name: data.first_name || '',
              last_name: data.last_name || '',
              phone: data.phone || '',
              marketing_opt_in: !!data.marketing_opt_in,
            });
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setProfile(initialProfile);
      setFormData({
        first_name: initialProfile.first_name || '',
        last_name: initialProfile.last_name || '',
        phone: initialProfile.phone || '',
        marketing_opt_in: !!initialProfile.marketing_opt_in,
      });
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [initialProfile]);

  const handlePersonalFormSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updated = await userApi.updateProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        marketing_opt_in: formData.marketing_opt_in,
      });

      const nextProfile = {
        ...profile,
        ...formData,
        ...updated,
      };

      setProfile(nextProfile);
      if (typeof onProfileUpdated === 'function') {
        onProfileUpdated(nextProfile);
      }

      toast.success('Your profile details have been successfully updated!', {
        title: 'Profile Saved',
        duration: 4000,
      });
    } catch (err) {
      toast.error(err.message || 'Could not update profile. Please try again.', {
        title: 'Save Failed',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressesChanged = (newAddresses) => {
    setProfile((prev) => ({
      ...prev,
      addresses: newAddresses,
    }));
    toast.info('Shipping address book updated.', { title: 'Address Book' });
  };

  // Avatar Initials
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Valued Customer';
  const initials = `${(profile.first_name?.[0] || 'D').toUpperCase()}${(profile.last_name?.[0] || 'C').toUpperCase()}`;
  const tier = (profile.loyalty?.tier || 'silver').toUpperCase();

  if (isLoading) {
    return (
      <div className="customer-profile-loading" data-testid="profile-loading">
        <Loader2 size={36} className="spinner-icon" />
        <p>Loading your Dickwella Fashion Corner profile...</p>
      </div>
    );
  }

  return (
    <div className={`customer-profile-page ${className}`} data-testid="customer-profile-page">
      <div className="container">
        {/* Navigation Breadcrumb / Back button & Logout */}
        <div className="customer-profile__nav-bar">
          <button
            type="button"
            className="customer-profile__back-btn"
            onClick={onBackToCatalog}
            data-testid="profile-back-to-catalog-btn"
          >
            <ArrowLeft size={16} />
            <span>Return to Boutique Catalog</span>
          </button>

          {onLogout && (
            <button
              type="button"
              className="customer-profile__logout-btn"
              onClick={onLogout}
              data-testid="profile-logout-btn"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Profile Hero Header */}
        <div className="customer-profile__hero-card">
          <div className="customer-profile__hero-left">
            <div className="customer-avatar" data-testid="customer-avatar">
              <span>{initials}</span>
            </div>

            <div className="customer-profile__hero-info">
              <div className="customer-profile__title-row">
                <h1 className="customer-profile__name" data-testid="customer-profile-name">
                  {fullName}
                </h1>
                <span className={`tier-badge-chip tier-badge-chip--${profile.loyalty?.tier || 'silver'}`} data-testid="header-tier-badge">
                  <Award size={13} />
                  <span>{tier}</span>
                </span>
              </div>

              <div className="customer-profile__meta-row">
                <span className="customer-meta-item">
                  <Mail size={14} />
                  <span>{profile.email}</span>
                </span>
                <span className="customer-meta-item">
                  <Phone size={14} />
                  <span>{profile.phone || 'No phone added'}</span>
                </span>
                <span className="customer-meta-item">
                  <Calendar size={14} />
                  <span>Member since {new Date(profile.created_at || '2026-01-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="customer-profile__quick-stats">
            <div className="quick-stat-box">
              <span className="quick-stat-val" data-testid="stat-loyalty-points">
                {(profile.loyalty?.points || 0).toLocaleString()}
              </span>
              <span className="quick-stat-label">Loyalty Points</span>
            </div>
            <div className="quick-stat-box">
              <span className="quick-stat-val" data-testid="stat-saved-addresses">
                {(profile.addresses?.length || 0)}
              </span>
              <span className="quick-stat-label">Saved Addresses</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="customer-profile__tabs" role="tablist" aria-label="Customer profile tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`profile-tab ${activeTab === 'overview' ? 'profile-tab--active' : ''}`}
            onClick={() => setActiveTab('overview')}
            data-testid="tab-profile-overview"
          >
            <User size={16} />
            <span>Personal Details</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'addresses'}
            className={`profile-tab ${activeTab === 'addresses' ? 'profile-tab--active' : ''}`}
            onClick={() => setActiveTab('addresses')}
            data-testid="tab-profile-addresses"
          >
            <MapPin size={16} />
            <span>Address Book ({(profile.addresses?.length || 0)})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'loyalty'}
            className={`profile-tab ${activeTab === 'loyalty' ? 'profile-tab--active' : ''}`}
            onClick={() => setActiveTab('loyalty')}
            data-testid="tab-profile-loyalty"
          >
            <Award size={16} />
            <span>Loyalty & Perks</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="customer-profile__content">
          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'overview' && (
            <div className="profile-tab-pane" data-testid="pane-overview">
              <div className="profile-details-grid">
                <form onSubmit={handlePersonalFormSubmit} className="profile-form-card" data-testid="profile-form">
                  <h3 className="pane-card-title">Edit Personal Information</h3>
                  <p className="pane-card-desc">
                    Keep your primary contact information up to date for order tracking and courier dispatch.
                  </p>

                  <div className="profile-form__row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="prof-first-name">
                        First Name <span className="text-danger">*</span>
                      </label>
                      <input
                        id="prof-first-name"
                        type="text"
                        className="form-input"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                        data-testid="input-profile-first-name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="prof-last-name">
                        Last Name <span className="text-danger">*</span>
                      </label>
                      <input
                        id="prof-last-name"
                        type="text"
                        className="form-input"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                        data-testid="input-profile-last-name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="prof-email">
                      Email Address (Permanent Account Identifier)
                    </label>
                    <input
                      id="prof-email"
                      type="email"
                      className="form-input"
                      value={profile.email}
                      disabled
                      aria-describedby="prof-email-help"
                      data-testid="input-profile-email"
                    />
                    <span id="prof-email-help" className="form-help">
                      Contact boutique support if you need to migrate your account to a new email.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="prof-phone">
                      Mobile Number (+94 Sri Lanka) <span className="text-danger">*</span>
                    </label>
                    <input
                      id="prof-phone"
                      type="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="077 123 4567"
                      data-testid="input-profile-phone"
                    />
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.marketing_opt_in}
                        onChange={(e) => setFormData({ ...formData, marketing_opt_in: e.target.checked })}
                        data-testid="checkbox-marketing-opt-in"
                      />
                      <span>
                        Receive exclusive Dickwella seasonal batik catalogs and member-only promotions.
                      </span>
                    </label>
                  </div>

                  <div className="profile-form__actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSaving}
                      data-testid="save-profile-btn"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={16} className="spinner-icon" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Account Security & Fast Links Card */}
                <div className="profile-side-card">
                  <div className="side-card-block">
                    <div className="side-card-title-row">
                      <ShieldCheck size={20} color="#10B981" />
                      <h4>Account Security</h4>
                    </div>
                    <p>Password last updated 3 months ago. Two-factor authentication available via SMS OTP.</p>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => toast.info('Password reset email dispatched to your inbox.', { title: 'Security' })}
                    >
                      Change Password
                    </button>
                  </div>

                  <div className="side-card-block">
                    <div className="side-card-title-row">
                      <ShoppingBag size={20} color="#D97706" />
                      <h4>Quick Actions</h4>
                    </div>
                    <ul className="side-card-links">
                      <li><a href="#orders" onClick={onBackToCatalog}>View Order History</a></li>
                      <li><a href="#wishlist" onClick={onBackToCatalog}>Manage Saved Wishlist</a></li>
                      <li><a href="#returns" onClick={onBackToCatalog}>30-Day Return Requests</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESS BOOK */}
          {activeTab === 'addresses' && (
            <div className="profile-tab-pane" data-testid="pane-addresses">
              <AddressBook
                addresses={profile.addresses || []}
                onAddressesChange={handleAddressesChanged}
              />
            </div>
          )}

          {/* TAB 3: LOYALTY & REWARDS */}
          {activeTab === 'loyalty' && (
            <div className="profile-tab-pane" data-testid="pane-loyalty">
              <LoyaltyCard loyalty={profile.loyalty} />

              {/* Tier Comparison Table */}
              <div className="loyalty-tiers-breakdown">
                <h3 className="breakdown-title">Ceylon Heritage Tier Privilege Matrix</h3>
                <div className="breakdown-table-wrapper">
                  <table className="breakdown-table">
                    <thead>
                      <tr>
                        <th>Tier Level</th>
                        <th>Spending Requirement</th>
                        <th>Points Accrual</th>
                        <th>Shipping Perks</th>
                        <th>Boutique Privileges</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={profile.loyalty?.tier === 'silver' ? 'tier-active-row' : ''}>
                        <td><strong>Silver</strong></td>
                        <td>Entry Level</td>
                        <td>1 pt / LKR 100</td>
                        <td>Free over LKR 10,000</td>
                        <td>30-Day Returns, Birthday Discount</td>
                      </tr>
                      <tr className={profile.loyalty?.tier === 'gold' ? 'tier-active-row' : ''}>
                        <td><strong>Gold ⭐</strong></td>
                        <td>LKR 25,000+</td>
                        <td>1.5 pts / LKR 100</td>
                        <td>Free Islandwide Courier</td>
                        <td>Early VIP Drops, Priority Support</td>
                      </tr>
                      <tr className={profile.loyalty?.tier === 'platinum' ? 'tier-active-row' : ''}>
                        <td><strong>Platinum 💎</strong></td>
                        <td>LKR 100,000+</td>
                        <td>2.0 pts / LKR 100</td>
                        <td>Free Same-Day / Express</td>
                        <td>Bespoke Handloom Fitting, Gala Invite</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerProfilePage;
