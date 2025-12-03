'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import LoginForm from '@/components/auth/LoginForm';
import Dashboard from '@/components/dashboard/Dashboard';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function Home() {
  const router = useRouter();
  const { user, token, isInitializing } = useAuth();

  useEffect(() => {
    // Check if new user needs onboarding
    if (user && token && typeof window !== 'undefined') {
      const needsOnboarding = localStorage.getItem('needs-onboarding');
      if (needsOnboarding === 'true') {
        router.push('/onboarding');
      }
    }
  }, [user, token]);

  // Show loading while checking auth state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              NextGenMaint
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              AI-powered reliability engineering toolkit
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}