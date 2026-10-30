import React from 'react';
import { Sparkles, Sliders, Cpu, Compass, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onStartPlanning?: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartPlanning }) => {
  const steps = [
    {
      step: '01',
      title: 'Share Your Travel Vision',
      description:
        'Tell TripGenie where you want to go, your travel dates, budget constraints, party size, and favorite travel vibe — whether adventure, luxury, cultural, or chill.',
      icon: Sliders,
      badge: 'Input & Preferences',
      gradient: 'from-electric-blue to-bright-cyan',
    },
    {
      step: '02',
      title: 'AI Synthesizes Your Plan',
      description:
        'Our Groq-accelerated AI engine schedules day-by-day activities, aligns realistic transit times, and deterministically computes your budget across accommodation, meals, and tickets.',
      icon: Cpu,
      badge: 'Groq Engine + Math',
      gradient: 'from-bright-cyan to-ocean-teal',
    },
    {
      step: '03',
      title: 'Optimize, Save & Explore',
      description:
        'Inspect your rich visual itinerary with Unsplash photography. Tap the 1-Click Budget Optimizer to discover hidden savings, then save your finalized trip to your dashboard.',
      icon: Compass,
      badge: 'Actionable Results',
      gradient: 'from-ocean-teal to-sunset-yellow',
    },
  ];

  return (
    <section id="how-it-works" className="py-12 sm:py-20">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-pill bg-sky-50 border border-sky-100 text-xs font-semibold text-electric-blue mb-4">
          <Sparkles className="w-3.5 h-3.5 text-bright-cyan" />
          <span>Simple 3-Step Process</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-ink tracking-tight">
          How TripGenie AI Works
        </h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Say goodbye to dozens of open browser tabs, spreadsheet chaos, and guessing travel expenses. Here is how your dream itinerary comes together in seconds.
        </p>
      </div>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="relative bg-white rounded-card border border-slate-200/80 p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Step Number on Top Right */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-4xl font-black text-slate-200 group-hover:text-electric-blue/40 transition-colors">
                  {item.step}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {item.badge}
                </span>
              </div>

              {/* Icon */}
              <div className="mb-6">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-white shadow-lg shadow-electric-blue/15 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-7 h-7" />
                </div>
              </div>

              {/* Title & Desc */}
              <div className="flex-1 space-y-3">
                <h3 className="text-xl font-extrabold text-charcoal-ink tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Progress bar line */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Step {index + 1} of 3</span>
                <span className="font-semibold text-electric-blue group-hover:translate-x-1 transition-transform inline-flex items-center">
                  Learn more <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional CTA prompt */}
      {onStartPlanning && (
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={onStartPlanning}
            className="inline-flex items-center px-6 py-3 rounded-btn bg-charcoal-ink hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <span>Try It Yourself Now</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
    </section>
  );
};

