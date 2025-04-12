import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  User, 
  CreditCard,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Plans', href: '/plans', icon: CreditCard },
  ];

  return (
    <div className="w-64 bg-gray-800 p-6">
      <div className="flex items-center mb-8">
        <LayoutDashboard className="h-8 w-8 text-blue-500" />
        <span className="ml-2 text-xl font-bold">DataDash.io</span>
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
  );
}