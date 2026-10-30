import React from 'react';
import { Compass, Sparkles } from 'lucide-react';

interface NavbarProps {
  onReset?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div
          onClick={onReset}
          className="flex items-center space-x-2.5 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onReset?.()}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-sky-900 to-indigo-900 bg-clip-text text-transparent">
              TripGenie AI
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              Personalized Travel
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1" />
            <span className="hidden sm:inline">Powered by Gemini AI</span>
          </div>
        </div>
      </div>
    </header>
  );
};

