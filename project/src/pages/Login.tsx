// Componente de Login Melhorado
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, ChevronRight, LayoutDashboard, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);

  useEffect(() => {
    // Check if user just verified their email
    const verified = new URLSearchParams(location.search).get('verified');
    if (verified === 'true') {
      setShowVerificationSuccess(true);
      // Clear the URL parameter
      window.history.replaceState({}, '', '/login');
      // Hide success message after 5 seconds
      setTimeout(() => setShowVerificationSuccess(false), 5000);
    }
  }, [location]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
  
    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
  
    // Validate password
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
  
    setLoading(true);
  
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;
      navigate('/');
    } catch (err: unknown) {
      // Tipagem adequada para o erro
      const error = err as { message?: string };
      
      // Provide more user-friendly error messages
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in.');
      } else {
        setError('Unable to sign in. Please try again later.');
        console.error('Sign in error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error: googleError } = await signInWithGoogle();
      if (googleError) throw googleError;
    } catch (err) {
      setError('Unable to sign in with Google. Please try again later.');
      console.error('Google sign in error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mr-3">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              DataDash.io
            </h1>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-bold text-white">
          Welcome back
        </h2>
        <p className="mt-3 text-center text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
            Create one now
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          {showVerificationSuccess && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 px-5 py-4 rounded-xl text-sm flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-3 text-green-400 flex-shrink-0" />
              <span>Email verified successfully! You can now log in.</span>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-5 py-3 border border-gray-700 rounded-xl shadow-sm text-sm font-medium text-white bg-gray-800/60 hover:bg-gray-800 transition-all"
          >
            <img
              className="w-5 h-5 mr-3"
              src="https://www.google.com/favicon.ico"
              alt="Google"
            />
            Continue with Google
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900/60 backdrop-blur-sm text-gray-400">Or continue with email</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-xl text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-gray-800/60 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-gray-800/60 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-5 py-3 mt-6 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}