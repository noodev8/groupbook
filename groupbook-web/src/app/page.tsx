'use client';

/*
=======================================================================================================================================
Home Page
=======================================================================================================================================
Purpose: Root page that redirects to login or dashboard based on authentication state.
=======================================================================================================================================
*/

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  // Show loading while determining auth state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}
