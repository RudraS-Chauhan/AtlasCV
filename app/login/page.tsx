'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  CheckCircle2, 
  FileText, 
  Linkedin, 
  Send, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col md:grid md:grid-cols-12 font-sans selection:bg-green-500/20 selection:text-green-400">
      
      {/* LEFT SIDE: Core Value Proposition Showcase (Desktop: 7 cols, Mobile: Stacked top) */}
      <div className="md:col-span-7 bg-[#0d0d11]/80 border-b md:border-b-0 md:border-r border-white/5 p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-green-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 right-10 w-80 h-80 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <Sparkles className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-extrabold text-white tracking-tight flex items-center gap-2">
              AtlasCV
              <span className="text-[9px] px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-mono uppercase tracking-widest">PRO</span>
            </h2>
            <p className="text-[10px] text-gray-500 font-mono tracking-wider">CAREER ACCELERATION ENGINE</p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 my-12 md:my-auto max-w-xl space-y-6">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/10 border border-green-500/20 text-green-400 font-mono uppercase tracking-wider">
            Concept Prototype • Powered by AI Studio
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-extrabold text-white leading-[1.1] tracking-tight">
            Transform Raw Projects into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Placement-Ready Kit</span>.
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            AtlasCV bridges the off-campus guidance gap. Input your basic details, qualifications, and rough project lists, and get an ATS-optimized LaTeX resume, 5 LinkedIn branding headlines, a recruiter cold outreach email, and a project-specific interview prep sheet instantly.
          </p>

          {/* Pillars of Trust */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <div className="flex gap-3 bg-white/[0.01] border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 text-green-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">ATS-Approved Layouts</h4>
                <p className="text-[11px] text-gray-500 leading-normal mt-0.5">Single-column structured formats ready to copy directly into Word or LaTeX.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-white/[0.01] border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                <Linkedin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">5x LinkedIn Branding</h4>
                <p className="text-[11px] text-gray-500 leading-normal mt-0.5">Headline variations targeted to multiple personal branding styles.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-white/[0.01] border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 text-teal-400">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Cold Outreach Email</h4>
                <p className="text-[11px] text-gray-500 leading-normal mt-0.5">Pre-formatted templates showcasing your project metrics to hiring managers.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-white/[0.01] border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Custom Interview Prep</h4>
                <p className="text-[11px] text-gray-500 leading-normal mt-0.5">A tailored list of behavioral & technical questions mapped to your stack.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guided Roadmap Footer Preview */}
        <div className="relative z-10 border-t border-white/5 pt-6 hidden md:block">
          <p className="text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-3">Your Journey to Dream Company Application</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-green-400 font-semibold font-mono">
              <span className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-[10px]">1</span>
              Onboard
            </span>
            <ArrowRight className="w-3 h-3 text-gray-600" />
            <span className="flex items-center gap-1.5 text-gray-500 font-mono">
              <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px]">2</span>
              Details
            </span>
            <ArrowRight className="w-3 h-3 text-gray-600" />
            <span className="flex items-center gap-1.5 text-gray-500 font-mono">
              <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px]">3</span>
              AI Calibration
            </span>
            <ArrowRight className="w-3 h-3 text-gray-600" />
            <span className="flex items-center gap-1.5 text-gray-500 font-mono">
              <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px]">4</span>
              Export
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Auth Form Panel (Desktop: 5 cols, Mobile: Stacked bottom) */}
      <div className="md:col-span-5 bg-[#0a0a0c] p-6 md:p-12 flex items-center justify-center relative">
        <div className="w-full max-w-sm space-y-8 relative z-10">
          
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-heading font-extrabold text-white tracking-tight">
              {isForgotPassword 
                ? 'Recover Access' 
                : (isSignUp ? 'Create Your Account' : 'Ready to start?')}
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              {isForgotPassword 
                ? 'We will send you a password recovery link to your inbox.' 
                : (isSignUp 
                  ? 'Join AtlasCV today to transform your placement prospects.' 
                  : 'Sign in to access your dashboard and resume builder.')}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs leading-relaxed flex items-start gap-2.5">
              <span className="text-red-500 font-bold mt-0.5">⚠️</span>
              <div>
                <p className="font-semibold">Authentication Alert</p>
                <p className="text-[11px] opacity-90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-green-500/10 border border-green-500/25 rounded-xl text-green-400 text-xs leading-relaxed flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Action Successful</p>
                <p className="text-[11px] opacity-90 mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full bg-[#111115] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all"
                  aria-label="Email address"
                />
              </div>
            </div>
            
            {/* Password Field (Only when not in Forgot Password Mode) */}
            {!isForgotPassword && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="auth-password" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(null); setSuccessMsg(null); }}
                      className="text-[10px] text-green-500 hover:text-green-400 font-semibold font-mono transition-colors focus:outline-none focus:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#111115] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all"
                    aria-label="Password"
                  />
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/10 text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-green-500/50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  {isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Create My Placement Kit' : 'Continue to Resume Builder')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Third Party OAuth Division */}
          {!isForgotPassword && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[10px] text-gray-500 uppercase font-mono tracking-widest">or integrate via</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-[#111115] hover:bg-[#16161c] border border-white/10 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-3 text-xs shadow-sm hover:border-white/20 cursor-pointer focus:ring-2 focus:ring-white/20"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </>
          )}

          {/* Toggle Sign Up / Sign In */}
          <p className="text-center text-xs text-gray-500">
            {isForgotPassword ? (
              <button
                onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMsg(null); }}
                className="text-green-500 hover:text-green-400 font-semibold font-mono transition-colors focus:outline-none focus:underline"
              >
                ← Back to Sign In
              </button>
            ) : (
              <>
                {isSignUp ? 'Already registered on AtlasCV? ' : 'First time generating a kit? '}
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMsg(null); }}
                  className="text-green-500 hover:text-green-400 font-semibold font-mono transition-colors focus:outline-none focus:underline"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up Now'}
                </button>
              </>
            )}
          </p>

          {/* Security and Transparency Note */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-gray-600 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
            <span>Secure SSL encryption • Database Backed Flow</span>
          </div>

        </div>
      </div>

    </div>
  );
}
