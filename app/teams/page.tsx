'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useOrganization } from '@/lib/store';
import TeamMembersPage from '@/components/organization/TeamMembersPage';
import { ArrowLeft } from 'lucide-react';

export default function TeamsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (!user || !token) {
      router.push('/');
    }
  }, [user, token]);

  if (!user || !currentOrganization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Team Management</h1>
            <p className="text-sm text-gray-600">{currentOrganization.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <TeamMembersPage />
    </div>
  );
}
