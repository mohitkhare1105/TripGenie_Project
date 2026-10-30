import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Sparkles } from 'lucide-react';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      // Generate a mock or real session token for the user
      // If user provided credentials, store in localStorage
      const mockToken = btoa(JSON.stringify({ email, sub: 'user-' + Date.now(), exp: Math.floor(Date.now() / 1000) + 86400 }));
      localStorage.setItem('supabase_token', mockToken);
      localStorage.setItem('user_email', email);
      if (fullName) {
        localStorage.setItem('user_name', fullName);
      }

      onLoginSuccess(email, mockToken);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoEmail = 'traveler@tripgenie.ai';
    const demoToken = btoa(JSON.stringify({ email: demoEmail, sub: 'demo-user-123', exp: Math.floor(Date.now() / 1000) + 86400 }));
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
            {isSignUp ? 'Create Your Account' : 'Welcome to TripGenie'}
          </h2>
          <p className="text-sm text-slate-muted mt-1">
            {isSignUp
              ? 'Save custom itineraries and sync your travel preferences.'
              : 'Sign in to access your saved trips and travel dashboard.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-btn bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
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

          <div>
            <label className="block text-xs font-semibold text-charcoal-ink uppercase tracking-wider mb-1.5">
              Password
            </label>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-btn bg-coral-pulse hover:bg-coral-pulse/90 text-white font-semibold text-sm transition-all transform active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isSignUp ? 'Sign Up with Email' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-ash-gray/60">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 px-4 rounded-btn bg-tide-tint hover:bg-ocean-teal/15 text-charcoal-ink font-semibold text-xs flex items-center justify-center transition-colors border border-ocean-teal/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-ocean-teal mr-2" />
            Quick Demo Login (Guest Traveler)
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs font-semibold text-electric-blue hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

