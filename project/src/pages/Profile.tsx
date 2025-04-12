import React, { useEffect, useState } from 'react';
import { User, Save, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';

export function Profile() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    full_name: '',
    company_name: '',
    email_notifications: false,
    two_factor_enabled: false
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        if (!user?.id) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Set profile state from data
          setProfile({
            full_name: data.full_name || '',
            company_name: data.company_name || '',
            email_notifications: data.email_notifications || false,
            two_factor_enabled: data.two_factor_enabled || false
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      }
    }

    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: profile.full_name,
          company_name: profile.company_name,
          email_notifications: profile.email_notifications,
          two_factor_enabled: profile.two_factor_enabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <User className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-gray-400">Manage your account preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="grid gap-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  className="input w-full"
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  id="company_name"
                  value={profile.company_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, company_name: e.target.value }))}
                  className="input w-full"
                  placeholder="Your company name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={user?.email}
                  disabled
                  className="input w-full opacity-70"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Contact support to change your email address
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Preferences</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email_notifications"
                  checked={profile.email_notifications}
                  onChange={(e) => setProfile(prev => ({ ...prev, email_notifications: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                />
                <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-300">
                  Receive email notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="two_factor"
                  checked={profile.two_factor_enabled}
                  onChange={(e) => setProfile(prev => ({ ...prev, two_factor_enabled: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                />
                <label htmlFor="two_factor" className="ml-2 block text-sm text-gray-300">
                  Enable two-factor authentication
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-xl">
            Profile updated successfully
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Account Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-700">
            <div>
              <h3 className="font-medium">Password</h3>
              <p className="text-sm text-gray-400">Last changed 30 days ago</p>
            </div>
            <button className="btn btn-secondary">
              Change Password
            </button>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-medium">Account Deletion</h3>
              <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
            </div>
            <button className="btn bg-red-500/10 text-red-500 hover:bg-red-500/20">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}