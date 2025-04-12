import React, { useEffect, useState } from 'react';
import { Users, Loader2, Search, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  created_at: string;
  full_name: string;
  company_name: string;
  role: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      // First, fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, role, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch auth users through our edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const { users: authUsers } = await response.json();

      // Combine the data
      const combinedUsers = profiles?.map(profile => {
        const authUser = authUsers.find((user: any) => user.id === profile.id);
        return {
          id: profile.id,
          email: authUser?.email || 'N/A',
          created_at: profile.created_at,
          full_name: profile.full_name || 'Unnamed User',
          company_name: profile.company_name || 'N/A',
          role: profile.role
        };
      }) || [];

      setUsers(combinedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeleting(userId);
    try {
      const { error } = await supabase.rpc('delete_user', {
        target_user_id: userId
      });

      if (error) throw error;

      // Remove user from local state
      setUsers(users.filter(user => user.id !== userId));
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.full_name.toLowerCase().includes(searchLower) ||
      user.company_name.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">All Users</h2>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="pb-3 text-gray-400 font-medium">User</th>
                <th className="pb-3 text-gray-400 font-medium">Company</th>
                <th className="pb-3 text-gray-400 font-medium">Role</th>
                <th className="pb-3 text-gray-400 font-medium">Joined</th>
                <th className="pb-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-700/50">
                  <td className="py-4">
                    <div>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-4">{user.company_name}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-500/10 text-purple-500'
                        : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {user.role === 'admin' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Admin
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          User
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-4 text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deleting === user.id || user.role === 'admin'}
                      className="text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={user.role === 'admin' ? "Can't delete admin users" : 'Delete user'}
                    >
                      {deleting === user.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              {searchTerm ? 'No users found matching your search' : 'No users found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}