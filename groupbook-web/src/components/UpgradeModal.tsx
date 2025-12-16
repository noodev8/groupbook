'use client';

/*
=======================================================================================================================================
Upgrade Modal Component
=======================================================================================================================================
Purpose: Shows pricing options when a free user tries to create a second event.
         Redirects to Stripe Checkout for payment.
=======================================================================================================================================
*/

import { useState } from 'react';
import { createCheckoutSession } from '@/lib/api';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);
  const [error, setError] = useState('');

  const handleUpgrade = async (priceType: 'monthly' | 'annual') => {
    setLoading(priceType);
    setError('');

    const result = await createCheckoutSession(priceType);

    if (result.success && result.data) {
      // Redirect to Stripe Checkout
      window.location.href = result.data.checkout_url;
    } else {
      setError(result.error || 'Failed to start checkout');
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 md:p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Upgrade to Kitchen Ready Pro
            </h2>
            <p className="mt-2 text-sm md:text-base text-gray-600">
              You&apos;ve reached your free event limit. Upgrade to create unlimited events.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Pricing Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Monthly */}
            <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">£35</p>
                <p className="text-sm text-gray-500">per month</p>
              </div>
              <button
                onClick={() => handleUpgrade('monthly')}
                disabled={loading !== null}
                className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'monthly' ? 'Redirecting...' : 'Choose Monthly'}
              </button>
            </div>

            {/* Annual */}
            <div className="border-2 border-blue-500 rounded-lg p-4 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded">
                  Save 29%
                </span>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">£299</p>
                <p className="text-sm text-gray-500">per year</p>
                <p className="text-xs text-blue-600 mt-1">£24.92/month</p>
              </div>
              <button
                onClick={() => handleUpgrade('annual')}
                disabled={loading !== null}
                className="mt-4 w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'annual' ? 'Redirecting...' : 'Choose Annual'}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-900 mb-2">What you get:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Unlimited events
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Unlimited guests
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </li>
            </ul>
          </div>

          {/* Cancel link */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
