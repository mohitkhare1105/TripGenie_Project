import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Sparkles, CheckCircle2 } from 'lucide-react';
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
      if (!email) {
        throw new Error('Please enter your email address.');
      }

      // Password Reset Flow
      if (isForgotPassword) {
        if (supabase) {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/`,
          });
          if (resetError) throw resetError;
        }
        setSuccessMessage('Password reset instructions have been sent to your email.');
        return;
      }

      if (!password) {
        throw new Error('Please enter your password.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      // Supabase Authentication
      if (supabase) {
        if (isSignUp) {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName.trim() || undefined,
              },
            },
          });

          if (signUpError) throw signUpError;

          if (data.session?.access_token) {
            const token = data.session.access_token;
            localStorage.setItem('supabase_token', token);
            localStorage.setItem('user_email', email);
            if (fullName) localStorage.setItem('user_name', fullName);
            onLoginSuccess(email, token);
            onClose();
          } else {
            setSuccessMessage(
              'Account created! If email confirmation is enabled, please check your inbox to verify your account, then log in.'
            );
            setIsSignUp(false);
          }
        } else {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) throw signInError;

          if (data.session?.access_token) {
            const token = data.session.access_token;
            localStorage.setItem('supabase_token', token);
            localStorage.setItem('user_email', email);
            const displayName =
              data.user?.user_metadata?.full_name ||
              data.user?.user_metadata?.name ||
              email.split('@')[0];
            localStorage.setItem('user_name', displayName);
            onLoginSuccess(email, token);
            onClose();
          } else {
            throw new Error('Unable to retrieve session token. Please try again.');
          }
        }
      } else {
        // Fallback local session if Supabase public key is not yet configured
        const fallbackToken = btoa(
          JSON.stringify({
            email,
            sub: 'user-' + Date.now(),
            exp: Math.floor(Date.now() / 1000) + 86400,
          })
        );
        localStorage.setItem('supabase_token', fallbackToken);
        localStorage.setItem('user_email', email);
        if (fullName) localStorage.setItem('user_name', fullName);
        onLoginSuccess(email, fallbackToken);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setError(
          'Email not confirmed yet. Please click the confirmation link sent to your email, or confirm your user in the Supabase Dashboard.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoEmail = 'traveler@tripgenie.ai';
    const demoToken = btoa(
      JSON.stringify({
        email: demoEmail,
        sub: 'demo-user-123',
        exp: Math.floor(Date.now() / 1000) + 86400,
      })
    );
    localStorage.setItem('supabase_token', demoToken);
    localStorage.setItem('user_email', demoEmail);
    localStorage.setItem('user_name', 'Alex Mercer');
    onLoginSuccess(demoEmail, demoToken);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-ink/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-[32px] sm:rounded-card p-6 sm:p-8 shadow-elevated border border-ash-gray">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-muted hover:text-charcoal-ink hover:bg-fog-white transition-colors"
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
              ? 'Create Your Account'
              : 'Welcome to TripGenie'}
          </h2>
          <p className="text-sm text-slate-muted mt-1">
            {isForgotPassword
              ? 'Enter your email to receive a password reset link.'
              : isSignUp
              ? 'Save custom itineraries and sync your travel preferences across devices.'
              : 'Sign in to access your saved trips and travel dashboard.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-btn bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-btn bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && !isForgotPassword && (
            <div>
              <label className="block text-xs font-semibold text-charcoal-ink uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
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
            <label className="block text-xs font-semibold text-charcoal-ink uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                <label className="block text-xs font-semibold text-charcoal-ink uppercase tracking-wider">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                    }}
                    className="text-[11px] text-electric-blue hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

        {!isForgotPassword && (
          <div className="mt-4 pt-4 border-t border-ash-gray/60">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-btn bg-tide-tint hover:bg-ocean-teal/15 text-charcoal-ink font-semibold text-xs flex items-center justify-center transition-colors border border-ocean-teal/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-ocean-teal mr-2" />
              Quick Demo Login (Guest Traveler)
            </button>
          </div>
        )}

        <div className="mt-4 text-center">
          {isForgotPassword ? (
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
              }}
              className="text-xs font-semibold text-electric-blue hover:underline"
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
              className="text-xs font-semibold text-electric-blue hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
