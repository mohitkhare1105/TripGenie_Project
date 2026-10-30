import React, { useState } from 'react';
import {
  Menu,
  X,
  LogOut,
  FolderHeart,
} from 'lucide-react';

interface NavbarProps {
  onReset?: () => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  onOpenDashboard?: () => void;
  isLoggedIn?: boolean;
  userEmail?: string | null;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onReset,
  onOpenAuth,
  onOpenDashboard,
  isLoggedIn = false,
  userEmail,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Plan Trip', href: '#planner' },
    { label: 'Destinations', href: '#destinations' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'AI Demo', href: '#ai-preview' },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Left: Brand Logo & Title */}
        <div
          onClick={onReset}
          className="flex items-center space-x-3 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onReset?.()}
        >
          <img
            src="/logo.png"
            alt="TripGenie AI"
            className="w-11 h-11 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-charcoal-ink flex items-center">
              Trip<span className="text-bright-cyan">Genie</span>
              <span className="text-ocean-teal ml-1 text-sm font-semibold">AI</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] text-slate-500 font-medium tracking-wide">
              Your AI Travel Planner
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-semibold text-slate-600 hover:text-electric-blue transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Auth / Dashboard CTA Actions */}
        <div className="hidden md:flex items-center space-x-3">
          {isLoggedIn ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onOpenDashboard}
                className="inline-flex items-center px-4 py-2 rounded-btn bg-slate-100 hover:bg-slate-200 text-charcoal-ink text-xs font-semibold transition-colors"
              >
                <FolderHeart className="w-3.5 h-3.5 mr-1.5 text-electric-blue" />
                <span>My Trips</span>
              </button>

              <div className="flex items-center pl-2 pr-1 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
                <span className="max-w-[120px] truncate font-medium text-slate-700 px-1">
                  {userEmail || 'Explorer'}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  title="Sign Out"
                  className="w-7 h-7 rounded-full bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors ml-1 shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => onOpenAuth?.('login')}
                className="px-4 py-2 rounded-btn text-xs font-semibold text-slate-700 hover:text-electric-blue hover:bg-slate-100 transition-colors"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth?.('signup')}
                className="px-5 py-2 rounded-btn bg-coral-pulse hover:bg-[#E02445] text-white text-xs font-bold shadow-md shadow-coral-pulse/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-fade-in">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleLinkClick}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-electric-blue transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleLinkClick();
                    onOpenDashboard?.();
                  }}
                  className="w-full inline-flex items-center justify-center py-2.5 rounded-btn bg-slate-100 text-charcoal-ink text-sm font-semibold"
                >
                  <FolderHeart className="w-4 h-4 mr-2 text-electric-blue" />
                  My Trips Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLinkClick();
                    onSignOut?.();
                  }}
                  className="w-full inline-flex items-center justify-center py-2 rounded-btn text-xs text-red-600 hover:bg-red-50 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Sign Out ({userEmail})
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleLinkClick();
                    onOpenAuth?.('login');
                  }}
                  className="w-full py-2.5 rounded-btn bg-slate-100 hover:bg-slate-200 text-charcoal-ink text-xs font-semibold text-center"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLinkClick();
                    onOpenAuth?.('signup');
                  }}
                  className="w-full py-2.5 rounded-btn bg-coral-pulse text-white text-xs font-bold text-center shadow-md shadow-coral-pulse/20"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
