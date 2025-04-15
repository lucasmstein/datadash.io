import React, { useEffect, useState } from 'react';
import { User, Save, Loader2, Mail, Building, Lock, Shield, Bell, Key, AlertTriangle, CheckCircle2, ChevronRight, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';

export function Profile() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    full_name: '',
    company_name: '',
    email_notifications: false,
    two_factor_enabled: false,
    avatar_url: '',
    role: 'User',
    joined_date: ''
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
            two_factor_enabled: data.two_factor_enabled || false,
            avatar_url: data.avatar_url || '',
            role: data.role || 'User',
            joined_date: data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A'
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

  const handleSubmit = async (e) => {
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
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!profile.full_name) return 'U';
    return profile.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-6">
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 text-center">
            <div className="relative mx-auto mb-4">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name} 
                  className="w-24 h-24 rounded-full mx-auto border-2 border-blue-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                  {getInitials()}
                </div>
              )}
              <button className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600 transition-colors border-2 border-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
            <h3 className="text-lg font-semibold">{profile.full_name || 'User'}</h3>
            <p className="text-sm text-gray-400">{profile.role}</p>
            <p className="text-xs text-gray-500 mt-1">Member since {profile.joined_date}</p>
          </div>
          
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden">
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left ${
                  activeTab === 'profile' 
                    ? 'bg-blue-500/10 border-l-2 border-blue-500 text-blue-500' 
                    : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Personal Info</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left ${
                  activeTab === 'security' 
                    ? 'bg-blue-500/10 border-l-2 border-blue-500 text-blue-500' 
                    : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Security</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left ${
                  activeTab === 'notifications' 
                    ? 'bg-blue-500/10 border-l-2 border-blue-500 text-blue-500' 
                    : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </button>
              
              <button 
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/10 hover:text-red-500"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          {/* Personal Info Tab */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Personal Information</h1>
                  <p className="text-gray-400">Manage your personal details and preferences</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-400" />
                          Full Name
                        </div>
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="company_name" className="block text-sm font-medium text-gray-300 mb-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-400" />
                          Company Name
                        </div>
                      </label>
                      <input
                        type="text"
                        id="company_name"
                        value={profile.company_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, company_name: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Your company name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-400" />
                        Email Address
                      </div>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={user?.email}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-800/30 border border-gray-700 rounded-lg text-gray-500"
                    />
                    <p className="mt-2 text-sm text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Contact support to change your email address
                    </p>
                  </div>
                </div>

                <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-400" />
                    Notification Preferences
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-800/40 rounded-lg transition-colors">
                      <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-gray-400">Receive updates, alerts, and marketing emails</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={profile.email_notifications}
                          onChange={(e) => setProfile(prev => ({ ...prev, email_notifications: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 hover:bg-gray-800/40 rounded-lg transition-colors">
                      <div>
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={profile.two_factor_enabled}
                          onChange={(e) => setProfile(prev => ({ ...prev, two_factor_enabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-4 rounded-xl">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-500 px-5 py-4 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <p>Profile updated successfully</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                  <Shield className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Security Settings</h1>
                  <p className="text-gray-400">Manage your account security and privacy</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-400" />
                    Authentication
                  </h2>
                  
                  <div className="flex items-center justify-between p-4 hover:bg-gray-800/40 rounded-lg transition-colors border border-gray-800">
                    <div>
                      <h3 className="font-medium">Password</h3>
                      <p className="text-sm text-gray-400">Last changed 30 days ago</p>
                    </div>
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 transition-colors">
                      Change Password
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 hover:bg-gray-800/40 rounded-lg transition-colors border border-gray-800">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-400">{profile.two_factor_enabled ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 transition-colors">
                      {profile.two_factor_enabled ? 'Manage' : 'Enable'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 hover:bg-gray-800/40 rounded-lg transition-colors border border-gray-800">
                    <div>
                      <h3 className="font-medium">Active Sessions</h3>
                      <p className="text-sm text-gray-400">Manage devices where you're logged in</p>
                    </div>
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 transition-colors">
                      View Sessions
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </h2>
                  
                  <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div>
                      <h3 className="font-medium text-red-400">Delete Account</h3>
                      <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                    </div>
                    <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg flex items-center gap-2 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                  <Bell className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Notification Settings</h1>
                  <p className="text-gray-400">Manage how and when you receive notifications</p>
                </div>
              </div>

              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 space-y-6">
                <h2 className="text-lg font-semibold mb-2">Email Notifications</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-800/40 rounded-lg transition-colors">
                    <div>
                      <h3 className="font-medium">System Updates</h3>
                      <p className="text-sm text-gray-400">Information about new features and improvements</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 hover:bg-gray-800/40 rounded-lg transition-colors">
                    <div>
                      <h3 className="font-medium">Account Activity</h3>
                      <p className="text-sm text-gray-400">Login attempts, password changes, etc.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 hover:bg-gray-800/40 rounded-lg transition-colors">
                    <div>
                      <h3 className="font-medium">Marketing & Promotions</h3>
                      <p className="text-sm text-gray-400">Special offers, new products, and events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-700">
                  <h2 className="text-lg font-semibold mb-4">In-App Notifications</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-800/40 rounded-lg transition-colors">
                      <div>
                        <h3 className="font-medium">Dashboard Updates</h3>
                        <p className="text-sm text-gray-400">Notifications about changes to your dashboards</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 hover:bg-gray-800/40 rounded-lg transition-colors">
                      <div>
                        <h3 className="font-medium">Collaboration</h3>
                        <p className="text-sm text-gray-400">Notifications about comments and mentions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-6">
                  <button
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}