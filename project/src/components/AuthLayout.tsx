import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const AuthLayout = () => {
  const { session } = useAuthStore();
  const location = useLocation();

  // If user is already authenticated, redirect to dashboard
  if (session) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Outlet />
    </div>
  );
};