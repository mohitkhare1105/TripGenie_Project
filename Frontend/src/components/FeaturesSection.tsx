import React from 'react';
import {
  Sparkles,
  Calculator,
  Percent,
  Camera,
  Compass,
  Utensils,
  Cloud,
  Clock,
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: 'Blazing Fast AI Generation',
      description:
        'Powered by Groq LPU inference, generating complete multi-day itineraries with full daily breakdowns in under 5 seconds.',
      icon: Sparkles,
      isDark: true,
      tag: 'Groq LLM',
    },
    {
      title: 'Deterministic Budget Engine',
      description:
        'Zero hallucinated math. Every lodging, meal, activity, and transport cost is verified through our deterministic backend calculation engine.',
      icon: Calculator,
      isDark: false,
      tag: 'Zero Hallucinations',
    },
    {
      title: 'Smart 1-Click Budget Optimizer',
      description:
        'Over budget? Our intelligent optimizer pinpoints high-expense activities and suggests high-value alternatives without sacrificing fun.',
      icon: Percent,
      isDark: false,
      tag: 'Cost Savings',
    },
    {
      title: 'High-Res Destination Visuals',
      description:
        'Immerse yourself before departing with automated, real-time Unsplash photography for every city, landmark, and cultural site.',
      icon: Camera,
      isDark: true,
      tag: 'Unsplash API',
    },
    {
      title: 'Personalized Travel Personas',
      description:
        'Tailor your pacing, sights, and comforts across Adventure, Cultural, Backpacker, Luxury, and Relaxed vacation modes.',
      icon: Compass,
      isDark: true,
      tag: '5 Styles',
    },
    {
      title: 'Dietary & Accessibility Ready',
      description:
        'Support for vegetarian, halal, vegan, and gluten-free dining alongside wheelchair-accessible routes and step-free travel advice.',
      icon: Utensils,
      isDark: false,
      tag: 'Inclusive',
    },
    {
      title: 'Supabase Cloud Sync',
      description:
        'Securely store, organize, and retrieve all your generated trips in real-time with row-level security and JWT session authentication.',
      icon: Cloud,
      isDark: false,
      tag: 'Cloud Trips',
    },
    {
      title: 'Realistic Chronological Pacing',
      description:
        'Morning, afternoon, and evening slots designed with logical geographical routing, sensible meal times, and relaxation gaps.',
      icon: Clock,
      isDark: true,
      tag: 'Logical Flow',
    },
  ];

  return (
    <section id="features" className="py-12 sm:py-20">
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-pill bg-sky-50 border border-sky-100 text-xs font-semibold text-electric-blue mb-4">
          <Sparkles className="w-3.5 h-3.5 text-bright-cyan" />
          <span>Engineered for Travellers</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-ink tracking-tight">
          Everything You Need for Effortless Travel
        </h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          TripGenie combines cutting-edge AI reasoning with deterministic financial math to build the most dependable travel assistant on the web.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className={`rounded-card p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                feature.isDark
                  ? 'bg-charcoal-ink text-white border border-[#272D35] shadow-lg'
                  : 'bg-white text-charcoal-ink border border-slate-200/90 shadow-sm hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      feature.isDark
                        ? 'bg-[#20262C] text-bright-cyan border border-[#2D3640]'
                        : 'bg-sky-50 text-electric-blue border border-sky-100'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      feature.isDark
                        ? 'bg-[#242B33] text-ash-gray'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {feature.tag}
                  </span>
                </div>

                <h3
                  className={`text-lg font-bold tracking-tight mb-2 ${
                    feature.isDark ? 'text-white' : 'text-charcoal-ink'
                  }`}
                >
                  {feature.title}
                </h3>

                <p
                  className={`text-xs leading-relaxed ${
                    feature.isDark ? 'text-ash-gray' : 'text-slate-600'
                  }`}
                >
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/20 text-[11px] font-semibold flex items-center justify-between">
                <span className={feature.isDark ? 'text-ash-gray' : 'text-slate-400'}>
                  Feature 0{idx + 1}
                </span>
                <span
                  className={
                    feature.isDark ? 'text-bright-cyan' : 'text-electric-blue'
                  }
                >
                  Built-in
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

