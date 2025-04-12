import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { Loader2 } from 'lucide-react';

export function AdminGuard() {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}