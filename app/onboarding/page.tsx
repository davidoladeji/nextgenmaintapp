'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useOrganization } from '@/lib/store';
import { Building, Users, Rocket, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { setCurrentOrganization, setOrganizations } = useOrganization();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Organization Setup
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [industry, setIndustry] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [plan, setPlan] = useState<'free' | 'starter' | 'professional' | 'enterprise'>('free');

  // Step 2: Team Invites (optional)
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState('editor');

  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!token || !user) {
      router.push('/');
      return;
    }

    // Check if already has organization (skip onboarding)
    checkExistingOrganization();
  }, [token, user]);

  const checkExistingOrganization = async () => {
    try {
      const response = await fetch('/api/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success && result.data.length > 0) {
        // User already has organization, skip onboarding
        router.push('/');
      }
    } catch (error) {
      console.error('Error checking organizations:', error);
    }
  };

  // Auto-generate slug from org name
  const handleOrgNameChange = (value: string) => {
    setOrgName(value);
    const generatedSlug = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50);
    setOrgSlug(generatedSlug);
  };

  // Determine plan based on team size
  useEffect(() => {
    if (teamSize === '1-3') setPlan('free');
    else if (teamSize === '4-10') setPlan('starter');
    else if (teamSize === '11-50') setPlan('professional');
    else if (teamSize === '51+') setPlan('enterprise');
  }, [teamSize]);

  const handleCreateOrganization = async () => {
    if (!orgName.trim() || !orgSlug.trim()) {
      toast.error('Please fill in organization name');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: orgName.trim(), slug: orgSlug.trim(), plan }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Organization created successfully!');
        setCreatedOrgId(result.data.id);
        setCurrentOrganization(result.data);
        setOrganizations([result.data]);
        setStep(2); // Move to invites step
      } else {
        toast.error(result.error || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvite = () => {
    if (!newInviteEmail.trim()) return;

    // Validate email format
    if (!/^\S+@\S+\.\S+$/.test(newInviteEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    setInvites([...invites, { email: newInviteEmail.trim(), role: newInviteRole }]);
    setNewInviteEmail('');
  };

  const handleRemoveInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const handleSendInvites = async () => {
    if (!createdOrgId) return;

    setLoading(true);

    try {
      // Send all invitations
      const promises = invites.map((invite) =>
        fetch(`/api/organizations/${createdOrgId}/invitations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(invite),
        })
      );

      await Promise.all(promises);
      toast.success(`${invites.length} invitation(s) sent!`);
      setStep(3); // Move to completion
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast.error('Failed to send some invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipInvites = () => {
    setStep(3);
  };

  const handleComplete = () => {
    // Clear onboarding flag
    localStorage.removeItem('needs-onboarding');
    router.push('/');
  };

  if (!token || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-monday-paleBlue via-white to-monday-lightPurple flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s < step
                      ? 'bg-monday-teal text-white'
                      : s === step
                      ? 'bg-monday-purple text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      s < step ? 'bg-monday-teal' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Step 1: Create Organization */}
          {step === 1 && (
            <div>
              <div className="bg-gradient-to-r from-monday-purple to-monday-softPurple px-8 py-6 text-white">
                <div className="flex items-center space-x-3 mb-2">
                  <Building className="w-8 h-8" />
                  <h1 className="text-2xl font-bold">Welcome to NextGenMaint!</h1>
                </div>
                <p className="text-white/90">Let's set up your organization to get started</p>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => handleOrgNameChange(e.target.value)}
                    placeholder="e.g., Acme Mining Corp"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    URL Identifier
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">nextgenmaint.com/</span>
                    <input
                      type="text"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="acme-mining"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Industry
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple"
                  >
                    <option value="">Select industry...</option>
                    <option value="mining">Mining</option>
                    <option value="oil-gas">Oil & Gas</option>
                    <option value="utilities">Utilities</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="power">Power Generation</option>
                    <option value="water">Water Treatment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Team Size
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: '1-3', label: '1-3 users', plan: 'Free' },
                      { value: '4-10', label: '4-10 users', plan: 'Starter' },
                      { value: '11-50', label: '11-50 users', plan: 'Pro' },
                      { value: '51+', label: '51+ users', plan: 'Enterprise' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTeamSize(option.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          teamSize === option.value
                            ? 'border-monday-purple bg-monday-lightPurple'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-600 mt-1">{option.plan} Plan</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateOrganization}
                  disabled={loading || !orgName.trim() || !orgSlug.trim()}
                  className="w-full py-3 bg-gradient-to-r from-monday-purple to-monday-softPurple text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Invite Team (Optional) */}
          {step === 2 && (
            <div>
              <div className="bg-gradient-to-r from-monday-teal to-monday-lime px-8 py-6 text-white">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="w-8 h-8" />
                  <h1 className="text-2xl font-bold">Invite Your Team</h1>
                </div>
                <p className="text-white/90">Add team members to collaborate (optional - you can do this later)</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={newInviteEmail}
                    onChange={(e) => setNewInviteEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddInvite()}
                    placeholder="colleague@example.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-teal"
                  />
                  <select
                    value={newInviteRole}
                    onChange={(e) => setNewInviteRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-teal"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="org_admin">Org Admin</option>
                  </select>
                  <button
                    onClick={handleAddInvite}
                    className="px-4 py-2 bg-monday-teal text-white rounded-lg hover:bg-monday-teal/90 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {invites.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-900">Team Members to Invite ({invites.length})</h3>
                    {invites.map((invite, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <div className="font-medium text-sm">{invite.email}</div>
                          <div className="text-xs text-gray-600 capitalize">{invite.role.replace('_', ' ')}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveInvite(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSkipInvites}
                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Skip for Now
                  </button>
                  {invites.length > 0 && (
                    <button
                      onClick={handleSendInvites}
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-monday-teal to-monday-lime text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : `Send ${invites.length} Invite(s)`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div>
              <div className="bg-gradient-to-r from-monday-lime to-monday-teal px-8 py-6 text-white">
                <div className="flex items-center space-x-3 mb-2">
                  <Rocket className="w-8 h-8" />
                  <h1 className="text-2xl font-bold">You're All Set!</h1>
                </div>
                <p className="text-white/90">Your organization is ready. Let's build your first FMEA!</p>
              </div>

              <div className="p-8 space-y-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-monday-lime to-monday-teal rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Organization Created!</h2>
                  <p className="text-gray-600">
                    {invites.length > 0
                      ? `${invites.length} invitation(s) sent to your team members`
                      : 'You can invite team members anytime from the dashboard'}
                  </p>
                </div>

                <div className="bg-monday-paleBlue border border-monday-purple/20 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Next steps:</strong>
                  </p>
                  <ul className="text-sm text-gray-700 mt-2 text-left space-y-1 max-w-md mx-auto">
                    <li>• Create your first FMEA project</li>
                    <li>• Import existing Excel FMEAs</li>
                    <li>• Explore AI-assisted failure mode suggestions</li>
                    <li>• Configure risk thresholds in Settings</li>
                  </ul>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full py-3 bg-gradient-to-r from-monday-purple to-monday-softPurple text-white rounded-lg font-semibold hover:shadow-lg transition-all text-lg"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        {step === 1 && (
          <p className="text-center text-sm text-gray-600 mt-4">
            Need help? Contact support@nextgenmaint.com
          </p>
        )}
      </div>
    </div>
  );
}
