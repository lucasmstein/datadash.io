import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  LineChart, 
  BarChart2, 
  PieChart,
  Clock, 
  Filter,
  FileSpreadsheet,
  Calendar,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Dashboard as DashboardType } from '../types';

export function Dashboard() {
  const [dashboards, setDashboards] = useState<DashboardType[]>([]);
  const [filteredDashboards, setFilteredDashboards] = useState<DashboardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent'>('all');

  useEffect(() => {
    async function fetchDashboards() {
      try {
        const { data, error } = await supabase
          .from('dashboards')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDashboards(data || []);
        setFilteredDashboards(data || []);
      } catch (error) {
        console.error('Error fetching dashboards:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboards();
  }, []);

  useEffect(() => {
    let filtered = [...dashboards];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(dashboard => 
        dashboard.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dashboard.file_info.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply time filter
    if (activeFilter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(dashboard => 
        new Date(dashboard.created_at) > oneWeekAgo
      );
    }
    
    setFilteredDashboards(filtered);
  }, [searchQuery, activeFilter, dashboards]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  };
  
  // Choose a chart icon based on the dashboard name/index
  const getChartIcon = (dashboard: DashboardType, index: number) => {
    const name = dashboard.title.toLowerCase();
    if (name.includes('category') || name.includes('categoria')) {
      return <PieChart className="w-6 h-6" />;
    } else if (name.includes('transaction') || name.includes('transac')) {
      return <BarChart2 className="w-6 h-6" />;
    } else {
      // Fallback to random icon based on index
      const icons = [LineChart, BarChart2, PieChart];
      const Icon = icons[index % icons.length];
      return <Icon className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400 animate-pulse">Loading your dashboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            My Dashboards
          </h1>
          <p className="text-gray-400 mt-1">
            View and manage your data visualization dashboards
          </p>
        </div>
        
        <Link 
          to="/upload" 
          className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Dashboard
        </Link>
      </div>
      
      {/* Search and filter bar */}
      <div className="relative flex flex-col sm:flex-row items-stretch gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search dashboards..."
            className="pl-10 w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <div className="bg-gray-800 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              All
            </button>
            <button
              onClick={() => setActiveFilter('recent')}
              className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                activeFilter === 'recent' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Recent
            </button>
          </div>
        </div>
      </div>

      {filteredDashboards.length === 0 ? (
        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
            <LineChart className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">
            {searchQuery || activeFilter === 'recent' 
              ? 'No matching dashboards found' 
              : 'No dashboards yet'}
          </h3>
          <p className="text-gray-400 mb-8 max-w-md">
            {searchQuery || activeFilter === 'recent' 
              ? 'Try adjusting your search criteria or create a new dashboard' 
              : 'Upload a CSV file to create your first interactive data dashboard'}
          </p>
          <Link 
            to="/upload" 
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map((dashboard, index) => (
            <Link
              key={dashboard.id}
              to={`/dashboard/${dashboard.id}`}
              className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 hover:bg-gray-800/30 transition-all group hover:shadow-lg hover:shadow-blue-500/5 hover:translate-y-[-2px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-400">
                  {getChartIcon(dashboard, index)}
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {getTimeAgo(dashboard.created_at)}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                  {dashboard.title}
                </h3>
                
                <div className="flex items-center text-sm text-gray-400">
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="truncate">{dashboard.file_info.name}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(dashboard.created_at)}
                </div>
                <div className="text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  View Dashboard
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}