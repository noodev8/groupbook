'use client';

/*
=======================================================================================================================================
Settings Page
=======================================================================================================================================
Purpose: Allows staff to update their restaurant name and upload branding images.
         Uses Cloudinary for image hosting with transformations applied on delivery.
=======================================================================================================================================
*/

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { updateBranding, updateProfile, createPortalSession, createCheckoutSession, Branding, getBranding, getBillingStatus, BillingStatus } from '@/lib/api';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Cloudinary transformation URLs
const getLogoUrl = (url: string) => {
  // Transform: max 400x150, fit within bounds
  return url.replace('/upload/', '/upload/w_400,h_150,c_fit/');
};

const getHeroUrl = (url: string) => {
  // Transform: 1200x400, fill and crop to aspect ratio
  return url.replace('/upload/', '/upload/w_1200,h_400,c_fill/');
};

export default function SettingsPage() {
  const { user, isLoading, updateUser } = useAuth();
  const router = useRouter();

  // Branding and billing state
  const [branding, setBranding] = useState<Branding | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [billingDataLoading, setBillingDataLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);

  // Restaurant name state
  const [restaurantName, setRestaurantName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  // Terms link state
  const [termsLink, setTermsLink] = useState('');
  const [savingTerms, setSavingTerms] = useState(false);
  const [termsInitialized, setTermsInitialized] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const loading = brandingLoading || billingDataLoading;

  // Fetch branding on mount
  useEffect(() => {
    if (!user) return;

    getBranding().then((result) => {
      if (result.success && result.data) {
        setBranding(result.data.branding);
        if (!termsInitialized) {
          setTermsLink(result.data.branding.terms_link || '');
          setTermsInitialized(true);
        }
      }
      setBrandingLoading(false);
    });
  }, [user, termsInitialized]);

  // Fetch billing on mount
  useEffect(() => {
    if (!user) return;

    getBillingStatus().then((result) => {
      if (result.success && result.data) {
        setBilling(result.data.billing);
      }
      setBillingDataLoading(false);
    });
  }, [user]);

  // Initialize restaurant name from user
  useEffect(() => {
    if (user) {
      setRestaurantName(user.restaurant_name);
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Upload image to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || '');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Cloudinary error:', data);
        throw new Error(data.error?.message || 'Upload failed');
      }

      return data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      return null;
    }
  };

  // Save branding to database
  const saveBranding = async (logoUrl: string | null, heroUrl: string | null, termsLinkValue?: string | null) => {
    setError('');
    const result = await updateBranding(logoUrl, heroUrl, termsLinkValue);
    if (result.success) {
      setSuccess('Saved');
      setTimeout(() => setSuccess(''), 2000);
      return true;
    } else {
      setError(result.error || 'Failed to save');
      return false;
    }
  };

  // Save restaurant name
  const handleSaveRestaurantName = async () => {
    if (!restaurantName.trim()) {
      setError('Restaurant name is required');
      return;
    }

    setSavingName(true);
    setError('');
    setSuccess('');

    const result = await updateProfile(restaurantName.trim());

    if (result.success && result.data) {
      updateUser(result.data.user);
      setSuccess('Saved');
      setTimeout(() => setSuccess(''), 2000);
    } else {
      setError(result.error || 'Failed to save restaurant name');
    }

    setSavingName(false);
  };

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError('');
    setSuccess('');

    const url = await uploadToCloudinary(file);
    if (url) {
      const newBranding = { logo_url: url, hero_image_url: branding?.hero_image_url || null, terms_link: branding?.terms_link || null };
      setBranding(newBranding);
      await saveBranding(newBranding.logo_url, newBranding.hero_image_url, newBranding.terms_link);
    } else {
      setError('Failed to upload logo. Please try again.');
    }

    setUploadingLogo(false);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // Handle hero image upload
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    setError('');
    setSuccess('');

    const url = await uploadToCloudinary(file);
    if (url) {
      const newBranding = { logo_url: branding?.logo_url || null, hero_image_url: url, terms_link: branding?.terms_link || null };
      setBranding(newBranding);
      await saveBranding(newBranding.logo_url, newBranding.hero_image_url, newBranding.terms_link);
    } else {
      setError('Failed to upload hero image. Please try again.');
    }

    setUploadingHero(false);
    if (heroInputRef.current) {
      heroInputRef.current.value = '';
    }
  };

  // Remove logo
  const handleRemoveLogo = async () => {
    const newBranding = { logo_url: null, hero_image_url: branding?.hero_image_url || null, terms_link: branding?.terms_link || null };
    setBranding(newBranding);
    await saveBranding(newBranding.logo_url, newBranding.hero_image_url, newBranding.terms_link);
  };

  // Remove hero image
  const handleRemoveHero = async () => {
    const newBranding = { logo_url: branding?.logo_url || null, hero_image_url: null, terms_link: branding?.terms_link || null };
    setBranding(newBranding);
    await saveBranding(newBranding.logo_url, newBranding.hero_image_url, newBranding.terms_link);
  };

  // Save terms link
  const handleSaveTermsLink = async () => {
    setSavingTerms(true);
    setError('');
    setSuccess('');

    const trimmedLink = termsLink.trim() || null;
    const newBranding = { logo_url: branding?.logo_url || null, hero_image_url: branding?.hero_image_url || null, terms_link: trimmedLink };
    setBranding(newBranding);
    await saveBranding(newBranding.logo_url, newBranding.hero_image_url, newBranding.terms_link);

    setSavingTerms(false);
  };

  // Open Stripe billing portal
  const handleManageBilling = async () => {
    setBillingLoading(true);
    setError('');

    const result = await createPortalSession();
    if (result.success && result.data) {
      window.open(result.data.portal_url, '_blank');
    } else {
      setError(result.error || 'Failed to open billing portal');
    }

    setBillingLoading(false);
  };

  // Start upgrade checkout
  const handleUpgrade = async (priceType: 'monthly' | 'annual') => {
    setBillingLoading(true);
    setError('');

    const result = await createCheckoutSession(priceType);
    if (result.success && result.data) {
      window.location.href = result.data.checkout_url;
    } else {
      setError(result.error || 'Failed to start checkout');
      setBillingLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Show loading state
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with gradient accent */}
      <header className="bg-white border-b-2 border-transparent" style={{ borderImage: 'linear-gradient(to right, #8b5cf6, #d946ef) 1' }}>
        <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-violet-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-3 rounded-xl text-sm shadow-lg shadow-violet-500/25">
            {success}
          </div>
        )}

        {/* Restaurant Name Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Restaurant Name</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Your restaurant name"
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
              disabled={savingName}
            />
            <button
              onClick={handleSaveRestaurantName}
              disabled={savingName || restaurantName === user?.restaurant_name}
              className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                restaurantName !== user?.restaurant_name && !savingName
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90 shadow-lg shadow-violet-500/25'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {savingName ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Subscription</h2>

          {billing && (
            <div>
              {/* Free user */}
              {billing.status === 'free' && (
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    Current plan: <span className="font-semibold text-slate-900">Free</span> (1 event)
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleUpgrade('monthly')}
                      disabled={billingLoading}
                      className="px-5 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-violet-200 disabled:opacity-50 transition-all"
                    >
                      Upgrade - £35/month
                    </button>
                    <button
                      onClick={() => handleUpgrade('annual')}
                      disabled={billingLoading}
                      className="px-5 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25"
                    >
                      Upgrade - £299/year (Save 29%)
                    </button>
                  </div>
                </div>
              )}

              {/* Active subscriber */}
              {(billing.status === 'active' || billing.status === 'cancelled') && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    Current plan: <span className="font-semibold text-slate-900">
                      Pro ({billing.plan === 'monthly' ? 'Monthly' : 'Annual'})
                    </span>
                  </p>
                  {billing.current_period_end && (
                    <p className="text-sm text-slate-500 mb-4">
                      {billing.status === 'cancelled' ? 'Access until' : 'Renews'}: {formatDate(billing.current_period_end)}
                    </p>
                  )}
                  {billing.status === 'cancelled' && (
                    <p className="text-sm text-amber-600 mb-4">
                      Your subscription has been cancelled. You&apos;ll retain access until the end of your billing period.
                    </p>
                  )}
                  <button
                    onClick={handleManageBilling}
                    disabled={billingLoading}
                    className="px-5 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-violet-200 disabled:opacity-50 transition-all"
                  >
                    {billingLoading ? 'Opening...' : 'Manage Billing'}
                  </button>
                </div>
              )}

              {/* Past due */}
              {billing.status === 'past_due' && (
                <div>
                  <p className="text-sm text-red-600 mb-4">
                    Your payment failed. Please update your payment method to keep your subscription active.
                  </p>
                  <button
                    onClick={handleManageBilling}
                    disabled={billingLoading}
                    className="px-5 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {billingLoading ? 'Opening...' : 'Update Payment Method'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Branding Section Header */}
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Branding</h2>
        <p className="text-sm text-slate-500 mb-4">
          Customize how your guest booking pages look. Upload your logo and a header image.
        </p>

        {/* Logo Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Logo</h2>
          <p className="text-xs text-slate-500 mb-4">
            Recommended: PNG with transparent background. Will be resized to fit within 400x150 pixels.
          </p>

          {branding?.logo_url ? (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <Image
                  src={getLogoUrl(branding.logo_url)}
                  alt="Logo preview"
                  width={400}
                  height={150}
                  className="max-h-[150px] w-auto object-contain"
                  unoptimized
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-violet-200 disabled:opacity-50 transition-all"
                >
                  {uploadingLogo ? 'Uploading...' : 'Replace'}
                </button>
                <button
                  onClick={handleRemoveLogo}
                  className="px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="w-full py-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors disabled:opacity-50"
            >
              <span className="text-sm text-slate-600">
                {uploadingLogo ? 'Uploading...' : 'Click to upload logo'}
              </span>
            </button>
          )}

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>

        {/* Hero Image Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Header Image</h2>
          <p className="text-xs text-slate-500 mb-4">
            A wide banner image for the top of your guest pages. Will be cropped to 1200x400 pixels (3:1 ratio).
          </p>

          {branding?.hero_image_url ? (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <Image
                  src={getHeroUrl(branding.hero_image_url)}
                  alt="Hero image preview"
                  width={1200}
                  height={400}
                  className="w-full h-auto"
                  unoptimized
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => heroInputRef.current?.click()}
                  disabled={uploadingHero}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-violet-200 disabled:opacity-50 transition-all"
                >
                  {uploadingHero ? 'Uploading...' : 'Replace'}
                </button>
                <button
                  onClick={handleRemoveHero}
                  className="px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => heroInputRef.current?.click()}
              disabled={uploadingHero}
              className="w-full py-12 border-2 border-dashed border-slate-300 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors disabled:opacity-50"
            >
              <span className="text-sm text-slate-600">
                {uploadingHero ? 'Uploading...' : 'Click to upload header image'}
              </span>
            </button>
          )}

          <input
            ref={heroInputRef}
            type="file"
            accept="image/*"
            onChange={handleHeroUpload}
            className="hidden"
          />
        </div>

        {/* Booking Terms Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Booking Terms</h2>
          <p className="text-xs text-slate-500 mb-4">
            Link to your booking terms and conditions. Guests will see a notice at the bottom of the booking page.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={termsLink}
              onChange={(e) => setTermsLink(e.target.value)}
              placeholder="https://yourrestaurant.com/terms"
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
              disabled={savingTerms}
            />
            <button
              onClick={handleSaveTermsLink}
              disabled={savingTerms || termsLink === (branding?.terms_link || '')}
              className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                termsLink !== (branding?.terms_link || '') && !savingTerms
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90 shadow-lg shadow-violet-500/25'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {savingTerms ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
