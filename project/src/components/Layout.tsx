import React, { useState } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Sidebar } from './Sidebar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Loader2, User, Bell, ChevronDown, Menu, X } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export function Layout() {
  const { user, loading, signOut } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { subscription } = useSubscription();
  
  // Função simples para alternar a sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Identifica o nível do plano para a badge
  const getPlanBadgeColor = () => {
    const planName = subscription?.subscription_plans?.name?.toLowerCase() || '';
    
    if (planName.includes('premium') || planName.includes('enterprise')) {
      return 'bg-gradient-to-r from-purple-500 to-pink-500';
    } else if (planName.includes('pro')) {
      return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    } else {
      return 'bg-gradient-to-r from-gray-600 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
            <div className="relative animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-400 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Sidebar com classe de largura baseada no estado */}
      <div className={`${sidebarCollapsed ? 'w-0 -translate-x-full' : 'w-64'} transition-all duration-300 ease-in-out h-screen overflow-hidden flex-shrink-0`}>
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 shadow-md sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              {/* Botão de toggle simplificado */}
              <button 
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-gray-800 focus:outline-none"
                aria-label={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
              >
                {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-400">System Status: Online</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-300 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              </button>
              
              <LanguageSwitcher />
              
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 group"
                >
                  <div className="relative">
                    {user?.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full border border-gray-700 group-hover:border-blue-500 transition-colors"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold group-hover:shadow-md group-hover:shadow-blue-500/20 transition-all">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    
                    {/* Plan badge */}
                    {subscription?.subscription_plans?.name && (
                      <div className={`absolute -bottom-1 -right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white ${getPlanBadgeColor()}`}>
                        {subscription.subscription_plans.name === 'Starter' ? 'S' : subscription.subscription_plans.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <span className="hidden md:inline-flex items-center text-sm text-gray-300 group-hover:text-white transition-colors gap-1">
                    <span className="max-w-[80px] truncate">
                      {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </span>
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-60 py-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-30">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-medium truncate">{user?.email}</p>
                      
                      {subscription?.subscription_plans?.name && (
                        <div className="mt-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full text-white ${getPlanBadgeColor()}`}>
                            {subscription.subscription_plans.name} Plan
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Profile Settings
                      </div>
                    </Link>
                    
                    <Link 
                      to="/plans" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                          <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                        Subscription Plans
                      </div>
                    </Link>
                    
                    <div className="border-t border-gray-700 my-1"></div>
                    <button 
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Sign Out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto px-4 py-6 md:p-8">
          <div className="h-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        <footer className="bg-gray-900/60 backdrop-blur-sm border-t border-gray-800 py-3 px-4 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div>
              &copy; {new Date().getFullYear()} Your SaaS Company. All rights reserved.
            </div>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}