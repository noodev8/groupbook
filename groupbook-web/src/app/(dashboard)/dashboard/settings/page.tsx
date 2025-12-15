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
import { getBranding, updateBranding, updateProfile, Branding } from '@/lib/api';

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
  const { user, isLoading, logout, updateUser } = useAuth();
  const router = useRouter();

  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Restaurant name state
  const [restaurantName, setRestaurantName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  // Terms link state
  const [termsLink, setTermsLink] = useState('');
  const [savingTerms, setSavingTerms] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch current branding on mount
  useEffect(() => {
    const fetchBranding = async () => {
      const result = await getBranding();
      if (result.success && result.data) {
        setBranding(result.data.branding);
        setTermsLink(result.data.branding.terms_link || '');
      } else {
        if (result.return_code === 'UNAUTHORIZED') {
          logout();
          return;
        }
        setError(result.error || 'Failed to load branding settings');
      }
      setLoading(false);
    };

    if (user) {
      fetchBranding();
    }
  }, [user, logout]);

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
  const saveBranding = async (logoUrl: string | null, heroUrl: string | null, termsLink?: string | null) => {
    setError('');
    const result = await updateBranding(logoUrl, heroUrl, termsLink);
    if (result.success) {
      setSuccess('Saved');
      setTimeout(() => setSuccess(''), 2000);
      return true;
    } else {
      if (result.return_code === 'UNAUTHORIZED') {
        logout();
        return false;
      }
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
      if (result.return_code === 'UNAUTHORIZED') {
        logout();
        return;
      }
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

  // Show loading state
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-500 text-sm md:text-base">Loading...</p>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm md:text-base text-blue-600 hover:text-blue-800">
              &larr; Back
            </Link>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8 sm:px-6 lg:px-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
            {success}
          </div>
        )}

        {/* Restaurant Name Section */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Restaurant Name</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Your restaurant name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={savingName}
            />
            <button
              onClick={handleSaveRestaurantName}
              disabled={savingName || restaurantName === user?.restaurant_name}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm font-medium disabled:opacity-50 flex-shrink-0"
            >
              {savingName ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Branding Section Header */}
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Branding</h2>
        <p className="text-sm text-gray-600 mb-4">
          Customize how your guest booking pages look. Upload your logo and a header image.
        </p>

        {/* Logo Section */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Logo</h2>
          <p className="text-xs md:text-sm text-gray-500 mb-4">
            Recommended: PNG with transparent background. Will be resized to fit within 400x150 pixels.
          </p>

          {branding?.logo_url ? (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <Image
                  src={getLogoUrl(branding.logo_url)}
                  alt="Logo preview"
                  width={400}
                  height={150}
                  className="max-h-[150px] w-auto object-contain"
                  unoptimized
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploadingLogo ? 'Uploading...' : 'Replace'}
                </button>
                <button
                  onClick={handleRemoveLogo}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <span className="text-sm text-gray-600">
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
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Header Image</h2>
          <p className="text-xs md:text-sm text-gray-500 mb-4">
            A wide banner image for the top of your guest pages. Will be cropped to 1200x400 pixels (3:1 ratio).
          </p>

          {branding?.hero_image_url ? (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src={getHeroUrl(branding.hero_image_url)}
                  alt="Hero image preview"
                  width={1200}
                  height={400}
                  className="w-full h-auto"
                  unoptimized
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => heroInputRef.current?.click()}
                  disabled={uploadingHero}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploadingHero ? 'Uploading...' : 'Replace'}
                </button>
                <button
                  onClick={handleRemoveHero}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => heroInputRef.current?.click()}
              disabled={uploadingHero}
              className="w-full py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <span className="text-sm text-gray-600">
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
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Booking Terms</h2>
          <p className="text-xs md:text-sm text-gray-500 mb-4">
            Link to your booking terms and conditions. Guests will see a notice at the bottom of the booking page.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={termsLink}
              onChange={(e) => setTermsLink(e.target.value)}
              placeholder="https://yourrestaurant.com/terms"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={savingTerms}
            />
            <button
              onClick={handleSaveTermsLink}
              disabled={savingTerms || termsLink === (branding?.terms_link || '')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm font-medium disabled:opacity-50 flex-shrink-0"
            >
              {savingTerms ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
