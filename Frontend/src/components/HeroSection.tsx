import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, HeartHandshake, Compass, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onStartPlanning: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartPlanning }) => {
  return (
    <section className="relative w-full mb-16 sm:mb-24">
      {/* Outer Dark Container with 64px radius */}
      <div className="relative overflow-hidden bg-charcoal-ink rounded-hero border border-[#242A30] shadow-2xl p-8 sm:p-12 lg:p-16 text-white">
        
        {/* Subtle background glow accents */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-electric-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-ocean-teal/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-pill bg-[#20252A] border border-[#2F363E] text-xs font-semibold tracking-wide text-bright-cyan shadow-sm">
              <Sparkles className="w-4 h-4 text-bright-cyan animate-pulse" />
              <span>Next-Gen Travel Intelligence</span>
              <span className="w-1.5 h-1.5 rounded-full bg-bright-cyan" />
              <span className="text-ash-gray">Groq Powered</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Every Journey,{' '}
              <br className="hidden sm:inline" />
              <span className="gradient-brand-text">
                Planned by AI.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-ash-gray font-normal leading-relaxed max-w-xl">
              Turn your dream vacation into a fully personalized, day-by-day travel plan in seconds. 
              Featuring deterministic budget control, curated local stays, and one-click smart optimization.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onStartPlanning}
                className="inline-flex items-center justify-center px-8 py-4 rounded-btn bg-coral-pulse hover:bg-[#E02445] text-white font-bold text-base shadow-xl shadow-coral-pulse/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer"
              >
                <span>Start Planning Free</span>
                <ArrowRight className="w-5 h-5 ml-2.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-6 py-4 rounded-btn bg-[#20252A] hover:bg-[#282F36] text-white font-semibold text-sm border border-[#2F363E] transition-colors"
              >
                <Compass className="w-4 h-4 mr-2 text-ocean-teal" />
                How TripGenie Works
              </a>
            </div>

            {/* 3 Trust Badges */}
            <div className="pt-6 border-t border-[#252C33] grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-xs text-ash-gray">
                <ShieldCheck className="w-4 h-4 text-ocean-teal flex-shrink-0" />
                <span>Deterministic Math</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-ash-gray">
                <Zap className="w-4 h-4 text-bright-cyan flex-shrink-0" />
                <span>Under 5s Generation</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-ash-gray">
                <HeartHandshake className="w-4 h-4 text-coral-pulse flex-shrink-0" />
                <span>100% Free to Use</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Composition with Floating Cards */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Preview Card */}
              <div className="rounded-3xl bg-[#1D2227] border border-[#2D353E] p-6 shadow-2xl relative z-10 space-y-4">
                {/* Trip Header Banner */}
                <div className="relative h-44 rounded-2xl overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80"
                    alt="Paris, France"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16191C]/90 via-[#16191C]/30 to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <span className="px-2.5 py-1 rounded-full bg-ocean-teal/90 text-charcoal-ink font-bold text-[11px] uppercase tracking-wider">
                        Culture & Romance
                      </span>
                      <h3 className="text-white font-extrabold text-lg mt-1">Paris, France</h3>
                    </div>
                    <span className="text-xs font-semibold text-bright-cyan bg-[#16191C]/80 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      4 Days • 2 Travellers
                    </span>
                  </div>
                </div>

                {/* Day snippet */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-ash-gray font-medium pb-1 border-b border-[#282F37]">
                    <span>Sample AI Schedule</span>
                    <span className="text-ocean-teal font-semibold">Day 1 of 4</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#232930] border border-[#2E3740] flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-electric-blue/20 text-bright-cyan flex items-center justify-center font-bold text-xs flex-shrink-0">
                      09:00
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-semibold text-white">Morning Louvre Museum Tour</p>
                      <p className="text-ash-gray text-[11px] mt-0.5">Mona Lisa & Renaissance masterpieces</p>
                    </div>
                    <span className="text-[11px] font-bold text-ocean-teal">₹3,200</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#232930] border border-[#2E3740] flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-ocean-teal/20 text-ocean-teal flex items-center justify-center font-bold text-xs flex-shrink-0">
                      13:30
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-semibold text-white">Artisan French Bistro Lunch</p>
                      <p className="text-ash-gray text-[11px] mt-0.5">Café de Flore in Saint-Germain-des-Prés</p>
                    </div>
                    <span className="text-[11px] font-bold text-ocean-teal">₹2,400</span>
                  </div>
                </div>

                {/* Budget Quick Pill */}
                <div className="pt-2 flex items-center justify-between text-xs bg-[#242A31] p-3 rounded-xl border border-[#2F3741]">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-ocean-teal" />
                    <span className="text-ash-gray">Total Estimated Cost:</span>
                  </div>
                  <span className="font-bold text-white text-sm">₹68,500</span>
                </div>
              </div>

              {/* Floating Badge 1: Top Right */}
              <div className="hidden sm:flex absolute -top-5 -right-5 z-20 items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-[#222830] border border-[#343D47] shadow-xl backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-coral-pulse/20 text-coral-pulse flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-ash-gray uppercase font-semibold">Smart Optimizer</div>
                  <div className="text-xs font-bold text-white">Saved ₹8,400</div>
                </div>
              </div>

              {/* Floating Badge 2: Bottom Left */}
              <div className="hidden sm:flex absolute -bottom-5 -left-5 z-20 items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-[#222830] border border-[#343D47] shadow-xl backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-bright-cyan/20 text-bright-cyan flex items-center justify-center">
                  <Compass className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <div className="text-[10px] text-ash-gray uppercase font-semibold">Active Itinerary</div>
                  <div className="text-xs font-bold text-white">Personalized & Real-time</div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

