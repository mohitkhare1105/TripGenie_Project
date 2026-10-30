import React from 'react';
import { Heart, Github, Twitter, Linkedin } from 'lucide-react';

interface FooterProps {
  onReset?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onReset }) => {
  return (
    <footer className="bg-charcoal-ink text-white border-t border-[#262D35] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#262D35]">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onClick={onReset}
              className="flex items-center space-x-3 cursor-pointer group inline-flex"
            >
              <img
                src="/logo.png"
                alt="TripGenie AI"
                className="w-10 h-10 rounded-full object-cover border border-[#2D3640] group-hover:scale-105 transition-transform"
              />
              <div>
                <span className="text-xl font-black tracking-tight text-white">
                  Trip<span className="text-bright-cyan">Genie</span>{' '}
                  <span className="text-ocean-teal text-base font-normal">AI</span>
                </span>
                <span className="block text-[11px] text-ash-gray font-medium">
                  Your AI Travel Planner
                </span>
              </div>
            </div>

            <p className="text-xs text-ash-gray leading-relaxed max-w-sm">
              TripGenie AI transforms modern vacation planning with instant Groq LLM reasoning, deterministic budget calculations, and real-time destination photography.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <a
                href="https://github.com/mohitkhare1105/TripGenie_Project"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[#20262D] border border-[#2F3740] flex items-center justify-center text-ash-gray hover:text-white hover:border-bright-cyan transition-colors"
                aria-label="GitHub Repository"
              >
                <Github className="w-4 h-4" />
              </a>
              <div className="w-9 h-9 rounded-xl bg-[#20262D] border border-[#2F3740] flex items-center justify-center text-ash-gray hover:text-white hover:border-bright-cyan transition-colors cursor-pointer">
                <Twitter className="w-4 h-4" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#20262D] border border-[#2F3740] flex items-center justify-center text-ash-gray hover:text-white hover:border-bright-cyan transition-colors cursor-pointer">
                <Linkedin className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Column 1: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-ash-gray">
              <li>
                <a href="#planner" className="hover:text-bright-cyan transition-colors">
                  Travel Planner
                </a>
              </li>
              <li>
                <a href="#destinations" className="hover:text-bright-cyan transition-colors">
                  Trending Destinations
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-bright-cyan transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-bright-cyan transition-colors">
                  Core Features
                </a>
              </li>
              <li>
                <a href="#ai-preview" className="hover:text-bright-cyan transition-colors">
                  Interactive Demo
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Tech Stack */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs text-ash-gray">
              <li>
                <span className="flex items-center text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-blue mr-2" />
                  FastAPI Backend
                </span>
              </li>
              <li>
                <span className="flex items-center text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-bright-cyan mr-2" />
                  Groq LPU Engine
                </span>
              </li>
              <li>
                <span className="flex items-center text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-ocean-teal mr-2" />
                  Supabase Auth & DB
                </span>
              </li>
              <li>
                <span className="flex items-center text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sunset-yellow mr-2" />
                  Unsplash Image API
                </span>
              </li>
              <li>
                <span className="flex items-center text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-pulse mr-2" />
                  Vite + React + Tailwind
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Trust & Security
            </h4>
            <ul className="space-y-2 text-xs text-ash-gray">
              <li>Deterministic Costing</li>
              <li>Row-Level Security (RLS)</li>
              <li>Encrypted JWT Sessions</li>
              <li>Privacy-First AI Prompting</li>
              <li>Independent Booking Notice</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ash-gray">
          <div>
            © {new Date().getFullYear()} TripGenie AI — Your AI Travel Planner. All rights reserved.
          </div>
          <div className="flex items-center space-x-1 text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-coral-pulse fill-coral-pulse mx-1" />
            <span>for explorers everywhere.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
