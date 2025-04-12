import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { AuthLayout } from './components/AuthLayout';
import { AdminLayout } from './components/AdminLayout';
import { AdminGuard } from './components/AdminGuard';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { DashboardView } from './pages/DashboardView';
import { Profile } from './pages/Profile';
import { Plans } from './pages/Plans';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { EmailVerification } from './pages/EmailVerification';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminDashboards } from './pages/admin/AdminDashboards';
import { AdminPlans } from './pages/admin/AdminPlans';
import { AdminUploads } from './pages/admin/AdminUploads';
import { useLanguage } from './hooks/useLanguage';

// Create a client
const queryClient = new QueryClient();

function App() {
  // Initialize language preferences
  useLanguage();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<EmailVerification />} />
          </Route>
          
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/dashboard/:id" element={<DashboardView />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/plans" element={<Plans />} />
          </Route>

          <Route element={<AdminGuard />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/dashboards" element={<AdminDashboards />} />
              <Route path="/admin/plans" element={<AdminPlans />} />
              <Route path="/admin/uploads" element={<AdminUploads />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;