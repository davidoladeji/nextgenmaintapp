'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Building, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AcceptInvitationPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { token } = params;
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // For new users
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Invalid invitation');
      } else {
        setInvitation(result.data.invitation);
        setHasAccount(result.data.has_account);
      }
    } catch (err) {
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!hasAccount && (!name.trim() || !password || password !== confirmPassword)) {
      toast.error('Please fill all fields and ensure passwords match');
      return;
    }

    setAccepting(true);

    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hasAccount ? {} : { name: name.trim(), password }),
      });

      const result = await response.json();

      if (result.success) {
        // Save token and redirect
        localStorage.setItem('auth-token', result.data.session_token);
        toast.success(result.message);
        setTimeout(() => router.push('/'), 1000);
      } else {
        toast.error(result.error || 'Failed to accept invitation');
      }
    } catch (err) {
      toast.error('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-monday-paleBlue via-white to-monday-lightPurple flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4 mx-auto" />
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary btn-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-monday-paleBlue via-white to-monday-lightPurple flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-r from-monday-purple to-monday-softPurple px-8 py-6 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <Mail className="w-8 h-8" />
            <h1 className="text-2xl font-bold">You're Invited!</h1>
          </div>
          <p className="text-white/90">Join your team on NextGenMaint</p>
        </div>

        <div className="p-8 space-y-6">
          {invitation && (
            <>
              <div className="bg-monday-lightPurple border border-monday-purple/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Building className="w-5 h-5 text-monday-purple mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <strong>{invitation.organization?.name}</strong> has invited you to join as{' '}
                      <span className="font-semibold capitalize">{invitation.role.replace('_', ' ')}</span>
                    </p>
                    {invitation.inviter && (
                      <p className="text-xs text-gray-600 mt-1">
                        Invited by {invitation.inviter.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {!hasAccount ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">Create your account to get started:</p>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Password *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Confirm Password *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple"
                    />
                  </div>

                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full py-3 bg-gradient-to-r from-monday-purple to-monday-softPurple text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4 mr-2 inline" />
                    {accepting ? 'Creating Account...' : 'Create Account & Join'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-700 mb-4">
                    You already have an account with <strong>{invitation.email}</strong>
                  </p>
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full py-3 bg-gradient-to-r from-monday-purple to-monday-softPurple text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2 inline" />
                    {accepting ? 'Joining...' : `Join ${invitation.organization?.name}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
