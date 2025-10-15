'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import { isSuperAdmin } from '@/lib/permissions-client';
import { ArrowLeft, Users, Search } from 'lucide-react';
import { readDatabase } from '@/lib/database-simple';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSuperAdmin(user)) {
      toast.error('Superadmin access required');
      router.push('/');
      return;
    }

    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      // For now, we'll need to create an admin API to get all users
      // This is a client-side workaround using the auth validation
      const response = await fetch('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        // In a real implementation, we'd have GET /api/admin/users
        // For now, show placeholder
        setUsers([
          { id: '1', name: 'Platform Superadmin', email: 'superadmin@nextgenmaint.com', is_superadmin: true, created_at: new Date().toISOString() },
          { id: '2', name: 'Admin User', email: 'admin@fmea.local', is_superadmin: false, created_at: new Date().toISOString() },
          { id: '3', name: 'John Smith', email: 'john@democorp.com', is_superadmin: false, created_at: new Date().toISOString() },
        ]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || !isSuperAdmin(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Manage Users</h1>
              <p className="text-sm text-gray-600">All users across all organizations</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">
              All Users ({filteredUsers.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="spinner mx-auto mb-4" />
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <div key={u.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-monday-purple to-monday-softPurple rounded-full flex items-center justify-center text-white font-semibold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-gray-900">{u.name}</div>
                          {u.is_superadmin && (
                            <span className="px-2 py-0.5 bg-monday-purple text-white text-xs rounded-full font-medium">
                              Superadmin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{u.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Joined {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
