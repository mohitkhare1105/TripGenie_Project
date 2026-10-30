import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  Coffee,
  Camera,
  Moon,
  Compass,
} from 'lucide-react';

export const ItineraryPreviewSection: React.FC = () => {
  const [activeDay, setActiveDay] = useState<number>(1);

  const previewDays = [
    {
      day: 1,
      title: 'Arrival & Montmartre Romantic Sunset',
      activities: [
        {
          time: '09:30 AM',
          slot: 'Morning',
          icon: Coffee,
          title: 'Check-in & Artisan Boulangerie Breakfast',
          location: 'Le Marais, Paris',
          cost: '₹1,400',
          desc: 'Settle into boutique hotel. Enjoy warm croissants and café au lait at a historic French bakery.',
        },
        {
          time: '02:00 PM',
          slot: 'Afternoon',
          icon: Camera,
          title: 'Montmartre Cobblestones & Sacré-Cœur',
          location: 'Montmartre Hill',
          cost: '₹2,200',
          desc: 'Wander through Bohemian artist alleys, view portrait painters at Place du Tertre, and visit Sacré-Cœur basilica.',
        },
        {
          time: '07:30 PM',
          slot: 'Evening',
          icon: Moon,
          title: 'Candlelit Bistro Dinner & Seine Walk',
          location: 'Saint-Germain-des-Prés',
          cost: '₹4,500',
          desc: 'Classic duck confit or ratatouille with wine pairing, followed by an evening stroll along Pont des Arts.',
        },
      ],
    },
    {
      day: 2,
      title: 'Louvre Wonders & Tuileries Garden',
      activities: [
        {
          time: '09:00 AM',
          slot: 'Morning',
          icon: Camera,
          title: 'Priority Entry to The Louvre Museum',
          location: 'Palais du Louvre',
          cost: '₹3,500',
          desc: 'Explore the Denon wing: Mona Lisa, Winged Victory of Samothrace, and Venus de Milo without the crowd.',
        },
        {
          time: '01:30 PM',
          slot: 'Afternoon',
          icon: Coffee,
          title: 'Picnic in Tuileries Garden & Angelina Hot Chocolate',
          location: 'Jardin des Tuileries',
          cost: '₹2,000',
          desc: 'Fresh baguettes, artisanal cheeses, and the legendary African hot chocolate from Angelina Paris.',
        },
        {
          time: '06:00 PM',
          slot: 'Evening',
          icon: Moon,
          title: 'Bateaux-Mouches Sunset Cruise on the Seine',
          location: 'Pont de l’Alma',
          cost: '₹2,800',
          desc: 'Glide past Notre-Dame, the Musée d’Orsay, and watch the Eiffel Tower sparkle on the hour.',
        },
      ],
    },
    {
      day: 3,
      title: 'Palace of Versailles Grandeur',
      activities: [
        {
          time: '08:30 AM',
          slot: 'Morning',
          icon: Camera,
          title: 'RER Transit & Hall of Mirrors Tour',
          location: 'Château de Versailles',
          cost: '₹4,200',
          desc: 'Marvel at 357 golden mirrors reflecting the sun in King Louis XIV’s royal masterpiece.',
        },
        {
          time: '01:00 PM',
          slot: 'Afternoon',
          icon: Coffee,
          title: 'Versailles Grand Canal Rowboat & Gardens',
          location: 'Versailles Park',
          cost: '₹2,100',
          desc: 'Rent a wooden rowboat on the Grand Canal followed by strolls around Marie Antoinette’s Hamlet.',
        },
        {
          time: '07:00 PM',
          slot: 'Evening',
          icon: Moon,
          title: 'Dinner at Le Petit Bouillon Vachette',
          location: 'Latin Quarter',
          cost: '₹3,200',
          desc: 'Traditional Parisian bouillon dining with boeuf bourguignon and crème brûlée at budget-friendly rates.',
        },
      ],
    },
    {
      day: 4,
      title: 'Champs-Élysées & Eiffel Summit Finale',
      activities: [
        {
          time: '10:00 AM',
          slot: 'Morning',
          icon: Camera,
          title: 'Arc de Triomphe Rooftop Panorama',
          location: 'Place Charles de Gaulle',
          cost: '₹2,400',
          desc: 'Climb 284 steps for the finest 360-degree vantage point overlooking Paris’s 12 radial avenues.',
        },
        {
          time: '02:30 PM',
          slot: 'Afternoon',
          icon: Coffee,
          title: 'Fashion Stroll & Macaron Tasting at Ladurée',
          location: 'Avenue Montaigne',
          cost: '₹2,800',
          desc: 'Sample world-famous pistachio and salted caramel macarons in a lavish 19th-century salon.',
        },
        {
          time: '07:00 PM',
          slot: 'Evening',
          icon: Moon,
          title: 'Eiffel Tower Top-Floor Champagne & Farewell',
          location: 'Champ de Mars',
          cost: '₹6,500',
          desc: 'Elevator up to the 276-meter summit for breathtaking night panoramas celebrating an unforgettable trip.',
        },
      ],
    },
  ];

  const currentDayData = previewDays.find((d) => d.day === activeDay) || previewDays[0];

  return (
    <section id="ai-preview" className="py-12 sm:py-20">
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-pill bg-sky-50 border border-sky-100 text-xs font-semibold text-electric-blue mb-4">
          <Sparkles className="w-3.5 h-3.5 text-bright-cyan" />
          <span>Interactive Output Demo</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-ink tracking-tight">
          Peek Inside a Real AI Itinerary
        </h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          See the rich detail, pacing, and realistic budget discipline TripGenie generates for a 4-day Paris getaway.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Day-by-Day Activity Schedule */}
        <div className="lg:col-span-8 bg-white rounded-card border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          {/* Header & Day Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                  Sample Preview
                </span>
                <span className="text-xs text-slate-400">Paris, France</span>
              </div>
              <h3 className="text-xl font-extrabold text-charcoal-ink mt-1">
                {currentDayData.title}
              </h3>
            </div>

            {/* Day Tabs */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl">
              {previewDays.map((d) => (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setActiveDay(d.day)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeDay === d.day
                      ? 'bg-white text-electric-blue shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Day {d.day}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Cards for Active Day */}
          <div className="mt-6 space-y-4">
            {currentDayData.activities.map((act, i) => {
              const Icon = act.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-fog-white border border-slate-100 hover:border-slate-200 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-electric-blue shadow-sm flex-shrink-0 mt-0.5 sm:mt-0">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-electric-blue uppercase tracking-wider">
                          {act.time}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {act.slot}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-charcoal-ink">
                        {act.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                        {act.desc}
                      </p>
                      <div className="flex items-center text-[11px] text-slate-400 pt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-ocean-teal" />
                        <span>{act.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center flex-shrink-0">
                    <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-extrabold text-xs text-charcoal-ink shadow-sm">
                      {act.cost}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deterministic Budget Breakdown Card */}
        <div className="lg:col-span-4 bg-charcoal-ink text-white rounded-card border border-[#2B323A] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#2B323A]">
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-bright-cyan" />
              <h3 className="text-base font-extrabold text-white">
                Trip Financial Summary
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-ocean-teal/20 text-ocean-teal border border-ocean-teal/30">
              Deterministic
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ash-gray">Target Budget</span>
              <span className="font-bold text-white">₹70,000</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ash-gray">Estimated Total</span>
              <span className="font-extrabold text-bright-cyan text-sm">₹68,500</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ocean-teal font-semibold">Budget Buffer</span>
              <span className="font-bold text-ocean-teal">+₹1,500 (Under budget)</span>
            </div>
          </div>

          {/* Category Bars */}
          <div className="space-y-3 pt-3 border-t border-[#2B323A]">
            <span className="text-[11px] uppercase font-bold text-ash-gray block">
              Category Allocation
            </span>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ash-gray">Accommodation (Boutique)</span>
                <span className="font-semibold text-white">₹28,000 (41%)</span>
              </div>
              <div className="w-full bg-[#242A31] rounded-full h-2">
                <div className="bg-electric-blue h-2 rounded-full w-[41%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ash-gray">Food & Dining</span>
                <span className="font-semibold text-white">₹18,500 (27%)</span>
              </div>
              <div className="w-full bg-[#242A31] rounded-full h-2">
                <div className="bg-bright-cyan h-2 rounded-full w-[27%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ash-gray">Activities & Entry Fees</span>
                <span className="font-semibold text-white">₹14,000 (20%)</span>
              </div>
              <div className="w-full bg-[#242A31] rounded-full h-2">
                <div className="bg-ocean-teal h-2 rounded-full w-[20%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ash-gray">Local Transit & Metro</span>
                <span className="font-semibold text-white">₹8,000 (12%)</span>
              </div>
              <div className="w-full bg-[#242A31] rounded-full h-2">
                <div className="bg-sunset-yellow h-2 rounded-full w-[12%]" />
              </div>
            </div>
          </div>

          {/* Quick Optimizer Banner */}
          <div className="p-4 rounded-2xl bg-[#20262D] border border-[#2F3842] flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-coral-pulse flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-white block">
                Optimizer Suggestion
              </span>
              <p className="text-ash-gray text-[11px] leading-relaxed">
                Switching to the Paris Museum Pass on Days 2 & 4 saves an extra ₹4,800 with skip-the-line privileges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
