import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: () => void;
  onBackToDashboard: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess,
  onBackToDashboard,
  defaultMode = 'login',
}) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatAuthError = (err: any): string => {
    const msg = err?.message || '';
    if (msg.includes('auth/invalid-credential') || msg.includes('invalid-credential')) {
      return 'Invalid credentials. If you previously signed in with Google, please use "Continue with Google".';
    }
    if (msg.includes('auth/email-already-in-use') || msg.includes('email-already-in-use')) {
      return 'An account with this email already exists. Try signing in with Google or your password.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (msg.includes('auth/user-not-found')) {
      return 'No account found with this email. Please register first.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in popup was closed before completion.';
    }
    return msg || 'Authentication failed. Please check your credentials.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onAuthSuccess();
      } else if (mode === 'register') {
        await registerWithEmail(email, password, name);
        onAuthSuccess();
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccessMessage('A secure reset link has been dispatched to your email.');
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      onAuthSuccess();
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fbfbfb] flex flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      {/* Top Bar Navigation */}
      <div className="max-w-6xl w-full mx-auto mb-6">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer group font-medium"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Dashboard (Preview Mode)</span>
        </button>
      </div>

      {/* Main Container: 50/50 Split */}
      <div className="max-w-6xl w-full mx-auto bg-white rounded-2xl shadow-xl shadow-neutral-200/50 border border-neutral-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        
        {/* Left Side: Clean Minimal Auth Form */}
        <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
                <span>Get It Done v4.0</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                {mode === 'login' && 'Welcome back'}
                {mode === 'register' && 'Create your workspace'}
                {mode === 'reset' && 'Reset your password'}
              </h1>
              <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
                {mode === 'login' && 'Enter your credentials or use Google to access your dashboard.'}
                {mode === 'register' && 'Start tracking your daily commitments with zero distraction.'}
                {mode === 'reset' && 'Enter your account email to receive recovery instructions.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            {mode !== 'reset' && (
              <div className="flex rounded-xl bg-neutral-100 p-1 mb-6">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'register'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Register
                </button>
              </div>
            )}

            {/* Error & Success Alerts */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            {mode !== 'reset' && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-50 text-neutral-800 font-medium py-3 px-4 rounded-xl border border-neutral-300 shadow-xs transition-all hover:border-neutral-400 text-sm disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex py-5 items-center">
                  <div className="flex-grow border-t border-neutral-200"></div>
                  <span className="flex-shrink mx-4 text-neutral-400 text-xs font-medium">or continue with email</span>
                  <div className="flex-grow border-t border-neutral-200"></div>
                </div>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Full Name / Callsign</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Mercer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-300 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-50/50 border border-neutral-300 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-medium text-neutral-700">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setMode('reset'); setError(null); }}
                        className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-300 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all text-sm disabled:opacity-50 mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'Sign in to workspace'}
                      {mode === 'register' && 'Create account'}
                      {mode === 'reset' && 'Send password reset link'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch Mode Footer */}
            {mode === 'reset' && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  ← Return to sign in
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Clean Minimal Inspiration Panel */}
        <div className="bg-[#f5f5f4] border-t lg:border-t-0 lg:border-l border-neutral-200/80 p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Background Element */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-neutral-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-stone-200/40 rounded-full blur-3xl pointer-events-none" />

          {/* Top Label */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-neutral-500 text-xs uppercase tracking-widest font-mono">
              <span className="w-2 h-2 rounded-full bg-neutral-900"></span>
              <span>Daily Mindset // Execution</span>
            </div>
          </div>

          {/* Quote Content */}
          <div className="relative z-10 my-auto py-10">
            <blockquote className="space-y-6">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-normal text-neutral-900 tracking-tight leading-snug">
                "We must all suffer one of two things: the pain of discipline or the pain of regret."
              </p>
              <footer className="flex items-center gap-2">
                <span className="text-lg font-medium text-neutral-800">~ Jim Rohn</span>
              </footer>
            </blockquote>

            <div className="mt-12 pt-8 border-t border-neutral-300/60 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1">Commitment</p>
                <p className="text-sm font-medium text-neutral-800">Required daily progress with zero excuses.</p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1">Accountability</p>
                <p className="text-sm font-medium text-neutral-800">Automated strike system to keep you on track.</p>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 text-xs text-neutral-400 font-mono">
            GET IT DONE · High Density Control
          </div>
        </div>

      </div>
    </div>
  );
};
