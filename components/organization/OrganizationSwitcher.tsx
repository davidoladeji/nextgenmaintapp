'use client';

import { useState, useEffect } from 'react';
import { Building, Check, ChevronDown, Plus } from 'lucide-react';
import { useOrganization, useAuth, useProject } from '@/lib/store';
import { Organization } from '@/types';
import CreateOrganizationModal from './CreateOrganizationModal';

export default function OrganizationSwitcher() {
  const { currentOrganization, organizations, setCurrentOrganization, setOrganizations } = useOrganization();
  const { setCurrentProject } = useProject();
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadOrganizations();
    }
  }, [token]);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setOrganizations(result.data);

        // Auto-select first organization if none selected
        if (!currentOrganization && result.data.length > 0) {
          // Check if there's a saved org in localStorage
          const savedOrgId = localStorage.getItem('current-organization-id');
          const savedOrg = result.data.find((org: Organization) => org.id === savedOrgId);

          setCurrentOrganization(savedOrg || result.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchOrganization = (org: Organization) => {
    setCurrentOrganization(org);
    setCurrentProject(null); // Clear current project when switching organizations
    setIsOpen(false);
  };

  const handleCreateSuccess = (newOrg: Organization) => {
    setOrganizations([...organizations, newOrg]);
    setCurrentOrganization(newOrg);
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Building className="w-4 h-4 animate-pulse" />
          <span>Loading organizations...</span>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-monday-purple to-monday-softPurple text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Create Organization</span>
        </button>

        {showCreateModal && (
          <CreateOrganizationModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      {/* Current Organization Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-monday-purple to-monday-softPurple rounded-lg flex items-center justify-center shadow-sm">
            {currentOrganization?.logo_url ? (
              <img
                src={currentOrganization.logo_url}
                alt={currentOrganization.name}
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              <Building className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {currentOrganization?.name || 'Select Organization'}
            </div>
            {currentOrganization && (
              <div className="text-xs text-gray-500 capitalize">{currentOrganization.plan} Plan</div>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="py-1 max-h-64 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitchOrganization(org)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-monday-purple to-monday-softPurple rounded flex items-center justify-center">
                    {org.logo_url ? (
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className="w-full h-full rounded object-cover"
                      />
                    ) : (
                      <Building className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{org.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{org.plan}</div>
                  </div>
                </div>
                {currentOrganization?.id === org.id && (
                  <Check className="w-4 h-4 text-monday-purple flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-monday-purple hover:bg-monday-lightPurple transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Create Organization</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
