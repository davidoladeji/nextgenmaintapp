'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import LoginForm from '@/components/auth/LoginForm';
import Dashboard from '@/components/dashboard/Dashboard';

export default function Home() {
  const router = useRouter();
  const { user, token } = useAuth();

  useEffect(() => {
    // Check if new user needs onboarding
    if (user && token && typeof window !== 'undefined') {
      const needsOnboarding = localStorage.getItem('needs-onboarding');
      if (needsOnboarding === 'true') {
        router.push('/onboarding');
      }
    }
  }, [user, token]);

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              NextGenMaint
            </h1>
            <p className="text-gray-600">
              AI-powered reliability engineering toolkit
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  return <Dashboard />;
}