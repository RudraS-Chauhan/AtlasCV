'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Lock, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    // Check if we have an access_token in the URL hash (implicit flow)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ data, error }) => {
        if (!error && data.session) {
          setSession(data.session);
        }
      });
      // Optional: Clear hash after parsing
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Make sure we have a session before attempting to update the user
    if (!session) {
      setError("Waiting for authentication session... Please wait a moment, or click the email link again.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (!navigator.onLine) {
      setError("Network error: You appear to be offline. Please check your internet connection.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        setError("Network error: Unable to connect to the authentication server.");
      } else if (err.message.includes("Token expired")) {
        setError("Your password reset link has expired. Please request a new one from the login page.");
      } else if (err.message.includes("Current password required") || err.message.includes("Auth session missing")) {
        setError("Invalid or expired reset link. Please try opening the link from your email again, or request a new one.");
      } else {
        setError(err.message || 'Failed to update password. Please try requesting a new reset link.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 font-sans">
      <div className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Set New Password
          </h1>
          <p className="text-gray-400 text-sm mt-2 text-center">
             Choose a new password for your account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center">
            Password updated successfully! Redirecting you to the app...
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all mt-4"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}