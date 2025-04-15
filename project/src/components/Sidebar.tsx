import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  CreditCard,
  LogOut,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Upload', href: '/upload', icon: Upload },
  ];
  
  return (
    <div className="h-full w-64 bg-gray-900/80 backdrop-blur-sm border-r border-gray-800 flex flex-col">
      {/* Logo and brand */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              DataDash.io
            </h1>
            <p className="text-xs text-gray-500">Analytics Platform</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-6 space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pl-4">Main Menu</p>
        
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
                          (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-2.5 rounded-xl transition-all group ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className="ml-3">{item.name}</span>
              {isActive && (
                <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
              )}
            </Link>
          );
        })}
        
        <div className="pt-4 mt-4 border-t border-gray-800">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pl-4">Support</p>
          
          <Link
            to="/help"
            className="flex items-center px-4 py-2.5 rounded-xl text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 transition-all group"
          >
            <HelpCircle className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-300" />
            <span className="ml-3">Help & Support</span>
          </Link>
        </div>
      </nav>
      
      {/* Plans and Logout buttons */}
      <div className="p-6 border-t border-gray-800 space-y-2">
        <Link
          to="/plans"
          className="w-full flex items-center px-4 py-2.5 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 rounded-xl transition-all group"
        >
          <CreditCard className="h-5 w-5 flex-shrink-0 group-hover:text-blue-400" />
          <span className="ml-3">Subscription Plans</span>
        </Link>
        
        <button
          onClick={() => signOut()}
          className="w-full flex items-center px-4 py-2.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all group"
        >
          <LogOut className="h-5 w-5 flex-shrink-0 group-hover:text-red-400" />
          <span className="ml-3">Logout</span>
        </button>
      </div>
      
      {/* Version info */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-gray-500">Version 1.2.0</p>
      </div>
    </div>
  );
}