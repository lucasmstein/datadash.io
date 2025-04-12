import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LineChart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Dashboard as DashboardType } from '../types';

export function Dashboard() {
  const [dashboards, setDashboards] = useState<DashboardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboards() {
      try {
        const { data, error } = await supabase
          .from('dashboards')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDashboards(data || []);
      } catch (error) {
        console.error('Error fetching dashboards:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboards();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Dashboards</h1>
        <Link to="/upload" className="btn btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New Dashboard
        </Link>
      </div>

      {dashboards.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12">
          <LineChart className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">No dashboards yet</h3>
          <p className="text-gray-400 mb-6">Upload a CSV file to create your first dashboard</p>
          <Link to="/upload" className="btn btn-primary">
            Create Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <Link
              key={dashboard.id}
              to={`/dashboard/${dashboard.id}`}
              className="card hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-lg font-medium mb-2">{dashboard.title}</h3>
              <div className="text-sm text-gray-400">
                {new Date(dashboard.created_at).toLocaleDateString()}
              </div>
              <div className="mt-4 text-sm text-gray-300">
                {dashboard.file_info.name}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}