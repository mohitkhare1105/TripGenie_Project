import React from 'react';
import { Star, Sparkles, CheckCircle2, Quote } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Aarav Sharma',
      location: 'Bengaluru, India',
      role: 'Solo Cultural Traveller',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      trip: 'Jaipur & Udaipur (5 Days)',
      quote:
        'TripGenie eliminated the 3 days of spreadsheet planning I usually endure. The daily pacing in Jaipur was flawless, and the local food recommendations were pure gold.',
    },
    {
      name: 'Sarah & Mark Jenkins',
      location: 'London, UK',
      role: 'Couples / Romantic Vacation',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      trip: 'Kerala Backwaters (6 Days)',
      quote:
        'The Smart Budget Optimizer actually saved us nearly £180 on houseboat packages and local transfers. Having deterministic cost calculations gave us total peace of mind.',
    },
    {
      name: 'Rohan Mehta',
      location: 'Mumbai, India',
      role: 'Adventure Backpacker',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      trip: 'Manali & Spiti (7 Days)',
      quote:
        'The ability to select "Adventure" mode and filter for vegetarian dietary options was a lifesaver. Fast, gorgeous UI, and zero fluff. This is the future of travel.',
    },
  ];

  return (
    <section className="py-12 sm:py-20">
      {/* Trust Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-pill bg-sky-50 border border-sky-100 text-xs font-semibold text-electric-blue mb-4">
          <Sparkles className="w-3.5 h-3.5 text-bright-cyan" />
          <span>Loved by Global Travellers</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-ink tracking-tight">
          Trusted by Over 50,000+ Explorers
        </h2>

        {/* Aggregate rating badge */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center space-x-1 text-sunset-yellow">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-sunset-yellow" />
            ))}
          </div>
          <span className="font-extrabold text-charcoal-ink text-sm">
            4.9 / 5.0
          </span>
          <span className="text-slate-400 text-xs">• Verified Traveller Rating</span>
        </div>
      </div>

      {/* 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="bg-white rounded-card border border-slate-200/90 p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1 text-sunset-yellow">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-sunset-yellow" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-slate-200 group-hover:text-electric-blue/40 transition-colors" />
              </div>

              <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                "{t.quote}"
              </p>
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center space-x-3.5">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-bright-cyan/30 flex-shrink-0"
              />
              <div className="text-xs">
                <div className="font-bold text-charcoal-ink flex items-center">
                  <span>{t.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-ocean-teal ml-1.5" />
                </div>
                <div className="text-slate-500 text-[11px]">{t.role}</div>
                <div className="text-electric-blue font-semibold text-[11px] mt-0.5">
                  {t.trip}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

