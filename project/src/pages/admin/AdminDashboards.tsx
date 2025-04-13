import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Dashboard {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}


export function AdminDashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboards();
  }, []);

  async function fetchDashboards() {
    try {
     const { data, error } = await supabase
  .from('dashboards')
  .select(`
    id,
    title,
    file_info,
    created_at,
    user_id,
    profiles (
      full_name
    )
  `)
  .order('created_at', { ascending: false });

      if (error) throw error;
      setDashboards(data || []);
    } catch (error) {
      console.error('Error fetching dashboards:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the list after deletion
      fetchDashboards();
    } catch (error) {
      console.error('Error deleting dashboard:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Dashboards</h1>
      
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
      <thead>
  <tr className="text-left border-b border-gray-700">
    <th className="pb-3 text-gray-400 font-medium">Title</th>
    <th className="pb-3 text-gray-400 font-medium">Created At</th>
    <th className="pb-3 text-gray-400 font-medium">User</th>
    <th className="pb-3 text-gray-400 font-medium">Actions</th>
  </tr>
</thead>
<tbody>
  {dashboards.map((dashboard) => (
    <tr key={dashboard.id} className="border-b border-gray-700/50">
      <td className="py-4">
        <div className="font-medium">{dashboard.title}</div>
      </td>
      <td className="py-4 text-gray-400">
        {new Date(dashboard.created_at).toLocaleDateString()}
      </td>
      <td className="py-4 text-gray-400">
        {dashboard.profiles?.full_name || 'Unknown'}
      </td>
      <td className="py-4">
        <button
          onClick={() => navigate(`/dashboard/${dashboard.id}`)}
          className="text-blue-500 hover:text-blue-400 mr-4"
        >
          View
        </button>
        <button
          onClick={() => handleDelete(dashboard.id)}
          className="text-red-500 hover:text-red-400"
        >
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>

          </table>
          
          {dashboards.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No dashboards found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}