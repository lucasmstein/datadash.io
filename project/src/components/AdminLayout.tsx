import React from 'react';
import { Settings } from 'lucide-react';

import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  CreditCard,
  Upload,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function AdminLayout() {
  const location = useLocation();
  const { signOut } = useAuthStore();

  const navigation = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Dashboards', href: '/admin/dashboards', icon: FileSpreadsheet },
    { name: 'Plans', href: '/admin/plans', icon: CreditCard },
    { name: 'Uploads', href: '/admin/uploads', icon: Upload },
    { name: 'Settings', href: '/admin/settings', icon: Settings }

  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="w-64 bg-gray-800 p-6">
        <div className="flex items-center mb-8">
          <LayoutDashboard className="h-8 w-8 text-blue-500" />
          <span className="ml-2 text-xl font-bold">Admin Panel</span>
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
                  location.pathname === item.href
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="ml-3">{item.name}</span>
              </Link>
            );
          })}
          
          <button
            onClick={() => signOut()}
            className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3">Logout</span>
          </button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">
              {navigation.find(item => item.href === location.pathname)?.name || 'Admin'}
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}