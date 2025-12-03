'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useOrganization } from '@/lib/store';
import TeamMembersPage from '@/components/organization/TeamMembersPage';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function TeamsPage() {
  const router = useRouter();
  const { user, token, isInitializing } = useAuth();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    // Wait for auth initialization
    if (isInitializing) {
      return;
    }

    if (!user || !token) {
      router.push('/');
    }
  }, [user, token, isInitializing]);

  // Show loading during initialization
  if (isInitializing) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !currentOrganization) {
    return null;
  }

  return (
    <DashboardLayout>
      <TeamMembersPage />
    </DashboardLayout>
  );
}
