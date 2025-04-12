import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function EmailVerification() {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the token from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = hashParams.get('access_token');

        if (!token) {
          throw new Error('No verification token found');
        }

        // Set the session with the token
        const { error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: token,
        });

        if (error) throw error;

        // Wait a moment to show success state
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 2000);
      } catch (err: any) {
        console.error('Verification error:', err);
        setError('Failed to verify email. The link may be invalid or expired.');
      } finally {
        setVerifying(false);
      }
    };

    handleEmailVerification();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0B1121] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#151F32] py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          {verifying ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Verifying your email
              </h2>
              <p className="text-gray-400">
                Please wait while we verify your email address...
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-400 mb-6">
                {error}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center text-blue-500 hover:text-blue-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </button>
            </div>
          ) : (
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-400">
                Your email has been verified. Redirecting to login...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}