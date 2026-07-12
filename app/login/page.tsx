'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Sparkles, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (!navigator.onLine) {
      setError("Network error: You appear to be offline. Please check your internet connection.");
      setLoading(false);
      return;
    }

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccessMsg('If an account exists, a password reset link has been sent to your email.');
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("This email is already registered. Please sign in instead.");
          }
          throw error;
        }
        setSuccessMsg('Check your email for the confirmation link. Note: If you have Google Provider inactive, that may cause issues on this platform.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
           if (error.message.includes("Invalid login credentials")) {
             throw new Error("Incorrect email or password. Please try again.");
           }
           if (error.message.includes("Email not confirmed")) {
             throw new Error("Please verify your email address before signing in.");
           }
           throw error;
        }
        window.location.href = '/';
      }
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        setError("Network error: Unable to connect to authentication server.");
      } else {
        setError(err.message || 'An unexpected authentication error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!navigator.onLine) {
      setError("Network error: You appear to be offline.");
      return;
    }
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        setError("Network error: Unable to reach Google sign-in securely.");
      } else {
        setError(err.message || 'Failed to initialize Google Sign In.');
      }
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
            {isForgotPassword ? 'Reset Password' : 'Welcome to AtlasCV'}
          </h1>
          <p className="text-gray-400 text-sm mt-2 text-center">
            {isForgotPassword 
              ? 'Enter your email to receive a password reset link.'
              : 'Sign in to generate your professional placement kit.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>
          
          {!isForgotPassword && (
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>
          )}

          {!isForgotPassword && !isSignUp && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setIsForgotPassword(true); setError(null); setSuccessMsg(null); }}
                className="text-xs text-green-500 hover:text-green-400 font-medium transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all"
          >
            {loading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Sign In'))}
          </button>
        </form>

        {!isForgotPassword && (
          <>
            <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
              <span className="w-1/5 border-b border-white/10"></span>
              <span className="text-xs uppercase tracking-wider">or continue with</span>
              <span className="w-1/5 border-b border-white/10"></span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="mt-6 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </>
        )}

        <p className="mt-8 text-center text-sm text-gray-400">
          {isForgotPassword ? (
            <button
              onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMsg(null); }}
              className="text-green-500 hover:text-green-400 font-medium transition-colors"
            >
              Back to Sign In
            </button>
          ) : (
            <>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMsg(null); }}
                className="text-green-500 hover:text-green-400 font-medium transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
