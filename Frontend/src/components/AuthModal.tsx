import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string, token: string) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
    setIsForgotPassword(false);
    setError(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error(
          'Supabase authentication service is not configured. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        );
      }

      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        throw new Error('Please enter your email address.');
      }

      // 1. Password Reset Flow
      if (isForgotPassword) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${window.location.origin}/`,
        });
        if (resetError) throw resetError;
        setSuccessMessage('Password reset instructions have been sent to your email.');
        return;
      }

      // 2. Validate Password
      if (!password) {
        throw new Error('Please enter your password.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      // 3. Real Supabase Sign-Up Flow
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim() || undefined,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session?.access_token) {
          onLoginSuccess(trimmedEmail, data.session.access_token);
          onClose();
        } else if (data.user) {
          // If Supabase has email confirmation enabled
          setSuccessMessage(
            `Account created! A confirmation link has been sent to ${trimmedEmail}. Please check your inbox and verify your email before signing in.`
          );
          setIsSignUp(false);
        } else {
          throw new Error('Registration could not be completed. Please try again.');
        }
      } else {
        // 4. Real Supabase Sign-In Flow
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) throw signInError;

        if (data.session?.access_token) {
          onLoginSuccess(trimmedEmail, data.session.access_token);
          onClose();
        } else {
          throw new Error('Unable to retrieve an active session token. Please try again.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setError(
          'Email not confirmed yet. Please click the confirmation link sent to your inbox, or confirm your user in the Supabase Dashboard.'
        );
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid email or password. Please verify your credentials and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-ink/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-[32px] sm:rounded-card p-6 sm:p-8 shadow-elevated border border-ash-gray">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-muted hover:text-charcoal-ink hover:bg-fog-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <img src="/logo.png" alt="TripGenie AI" className="h-12 w-auto mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-charcoal-ink">
            {isForgotPassword
              ? 'Reset Your Password'
              : isSignUp
              ? 'Create TripGenie Account'
              : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-muted mt-1">
            {isForgotPassword
              ? 'Enter your email to receive recovery instructions'
              : isSignUp
              ? 'Save custom itineraries, track travel budgets, and access smart suggestions'
              : 'Sign in to access your saved itineraries and personalized trips'}
          </p>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-teal-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && !isForgotPassword && (
            <div>
              <label className="block text-xs font-semibold text-charcoal-ink mb-1.5">
                Full Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-muted" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-btn bg-fog-white border border-ash-gray focus:outline-none focus:border-electric-blue focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-ink mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-btn bg-fog-white border border-ash-gray focus:outline-none focus:border-electric-blue focus:bg-white transition-colors"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-charcoal-ink">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-electric-blue hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-btn bg-fog-white border border-ash-gray focus:outline-none focus:border-electric-blue focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-btn bg-coral-pulse hover:bg-[#E02445] text-white font-semibold text-sm transition-all transform active:scale-[0.98] shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isLoading
              ? 'Processing...'
              : isForgotPassword
              ? 'Send Reset Link'
              : isSignUp
              ? 'Sign Up with Email'
              : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          {isForgotPassword ? (
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
              }}
              className="text-xs font-semibold text-electric-blue hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-slate-muted hover:text-charcoal-ink cursor-pointer"
            >
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <span className="font-semibold text-electric-blue hover:underline">
                    Sign In
                  </span>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <span className="font-semibold text-electric-blue hover:underline">
                    Sign Up Free
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
