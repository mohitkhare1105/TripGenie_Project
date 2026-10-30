import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface FinalCtaSectionProps {
  onStartPlanning: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onStartPlanning,
}) => {
  return (
    <section className="py-12 sm:py-20">
      <div className="relative overflow-hidden bg-charcoal-ink rounded-hero border border-[#262D35] p-8 sm:p-14 lg:p-20 text-white shadow-2xl text-center">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-bright-cyan/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-coral-pulse/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-pill bg-[#20252A] border border-[#2F363E] text-xs font-semibold text-bright-cyan shadow-sm">
            <Sparkles className="w-4 h-4 text-bright-cyan animate-pulse" />
            <span>Ready for Departure?</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Your Dream Trip Is Just <br className="hidden sm:inline" />
            <span className="gradient-brand-text">One Click Away.</span>
          </h2>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-ash-gray font-normal leading-relaxed max-w-xl mx-auto">
            Stop wasting hours sifting through conflicting travel blogs and outdated estimates. Let TripGenie AI build your bespoke travel schedule right now.
          </p>

          {/* CTA Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={onStartPlanning}
              className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 rounded-btn bg-coral-pulse hover:bg-[#E02445] text-white font-bold text-base shadow-xl shadow-coral-pulse/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer"
            >
              <span>Plan My Trip Now</span>
              <ArrowRight className="w-5 h-5 ml-2.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Guarantees */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-ash-gray">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-ocean-teal" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-ocean-teal" />
              <span>Fast 5-Second Generation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-ocean-teal" />
              <span>Free to Use Forever</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

