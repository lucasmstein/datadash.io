import React, { useEffect, useState } from 'react';
import { 
  Users as UsersIcon,
  FileSpreadsheet,
  Upload as UploadIcon,
  DollarSign,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalUsers: number;
  totalDashboards: number;
  totalUploads: number;
  totalRevenue: number;
  usersByPlan: {
    name: string;
    users: number;
  }[];
  recentUploads: {
    id: string;
    file_name: string;
    user_name: string;
    created_at: string;
  }[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          { count: usersCount },
          { count: dashboardsCount },
          { data: subscriptions },
          { data: uploads }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact' }),
          supabase.from('dashboards').select('*', { count: 'exact' }),
          supabase.from('subscriptions')
            .select(`
              subscription_plans (
                name,
                price_monthly
              )
            `),
          supabase.from('dashboards')
            .select(`
              id,
              file_info,
              created_at,
              user_id,
              profiles!dashboards_user_id_fkey (
                full_name
              )
            `)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        // Calculate total revenue
        const revenue = subscriptions?.reduce((total, sub) => {
          return total + (sub.subscription_plans?.price_monthly || 0);
        }, 0) || 0;

        // Count users by plan
        const planCounts = subscriptions?.reduce((acc, sub) => {
          const planName = sub.subscription_plans?.name || 'Free';
          acc[planName] = (acc[planName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const usersByPlan = Object.entries(planCounts || {}).map(([name, users]) => ({
          name,
          users
        }));
console.log('uploads:', uploads);

        // Format recent uploads
        const recentUploads = uploads?.map(upload => ({
          id: upload.id,
file_name: upload.file_info?.name || 'Unknown file',
          user_name: upload.profiles?.full_name || 'Unknown',
          created_at: upload.created_at
        })) || [];

        setStats({
          totalUsers: usersCount || 0,
          totalDashboards: dashboardsCount || 0,
          totalUploads: dashboardsCount || 0,
          totalRevenue: revenue,
          usersByPlan,
          recentUploads
        });
      } catch (err: any) {
        console.error('Error loading admin stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-red-500">
        Error loading statistics: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-semibold">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <UsersIcon className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Dashboards</p>
              <p className="text-2xl font-semibold">{stats.totalDashboards}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <FileSpreadsheet className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Uploads</p>
              <p className="text-2xl font-semibold">{stats.totalUploads}</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <UploadIcon className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-semibold">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Users by Plan Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Users by Plan</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.usersByPlan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="pb-3 text-gray-400 font-medium">File Name</th>
                <th className="pb-3 text-gray-400 font-medium">User</th>
                <th className="pb-3 text-gray-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUploads.map((upload) => (
                <tr key={upload.id} className="border-b border-gray-700/50">
                  <td className="py-3">{upload.file_name}</td>
                  <td className="py-3">{upload.user_name}</td>
                  <td className="py-3">
                    {new Date(upload.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}