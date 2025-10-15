'use client';

import { useState } from 'react';
import { LogOut, Settings, User, Menu, Bot, HelpCircle, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useUI } from '@/lib/store';
import { isSuperAdmin } from '@/lib/permissions-client';
import toast from 'react-hot-toast';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    aiChatMinimized, 
    setAiChatMinimized,
    restartOnboarding
  } = useUI();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      toast.success('Logged out successfully');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4" data-tour="header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              AI-Assisted FMEA Builder
            </h1>
            <p className="text-sm text-gray-500">
              Reliability Engineering Toolkit
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Admin Panel Button (Superadmin Only) */}
          {user && isSuperAdmin(user) && (
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-monday-purple to-monday-pink text-white rounded-lg hover:shadow-lg transition-all"
              title="Platform Administration"
            >
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Admin Panel</span>
            </button>
          )}

          {/* Help / Onboarding */}
          <button
            onClick={restartOnboarding}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
            title="Start guided tour"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* AI Chat Toggle */}
          <button
            onClick={() => setAiChatMinimized(!aiChatMinimized)}
            className={`p-2 rounded-md transition-colors ${
              aiChatMinimized 
                ? 'hover:bg-gray-100 text-gray-600' 
                : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
            }`}
            title={aiChatMinimized ? 'Show AI Assistant' : 'Hide AI Assistant'}
          >
            <Bot className={`w-5 h-5 ${aiChatMinimized ? 'opacity-50' : ''}`} />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // TODO: Open settings modal
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close user menu on outside click */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}