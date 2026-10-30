import React from 'react';
import { MapPin, Calendar, Wallet, Star, ArrowRight, Sparkles } from 'lucide-react';
import { TravelStyle } from '../types';

export interface DestinationPreset {
  id: string;
  destination: string;
  stateOrCountry: string;
  category: string;
  imageUrl: string;
  durationDays: number;
  budget: number;
  travellers: number;
  travelStyle: TravelStyle;
  bestSeason: string;
  rating: number;
  highlights: string[];
}

const POPULAR_DESTINATIONS: DestinationPreset[] = [
  {
    id: 'jaipur',
    destination: 'Jaipur',
    stateOrCountry: 'Rajasthan, India',
    category: 'Heritage & Palaces',
    imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    durationDays: 3,
    budget: 15000,
    travellers: 2,
    travelStyle: 'culture',
    bestSeason: 'Oct - Mar',
    rating: 4.9,
    highlights: ['Hawa Mahal', 'Amber Fort', 'Chokhi Dhani', 'Bazaar Walks'],
  },
  {
    id: 'goa',
    destination: 'Goa',
    stateOrCountry: 'India',
    category: 'Beaches & Sunsets',
    imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    durationDays: 4,
    budget: 22000,
    travellers: 2,
    travelStyle: 'relaxation',
    bestSeason: 'Nov - Feb',
    rating: 4.8,
    highlights: ['Anjuna Beach', 'Old Goa Churches', 'Sunset Cruise', 'Seafood'],
  },
  {
    id: 'manali',
    destination: 'Manali',
    stateOrCountry: 'Himachal Pradesh, India',
    category: 'Snow & Adventure',
    imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    durationDays: 4,
    budget: 18000,
    travellers: 2,
    travelStyle: 'adventure',
    bestSeason: 'Year Round',
    rating: 4.9,
    highlights: ['Solang Valley', 'Rohtang Pass', 'Old Manali Cafes', 'Jogini Waterfall'],
  },
  {
    id: 'kerala',
    destination: 'Munnar & Alleppey',
    stateOrCountry: 'Kerala, India',
    category: 'Nature & Backwaters',
    imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    durationDays: 5,
    budget: 28000,
    travellers: 2,
    travelStyle: 'relaxation',
    bestSeason: 'Sep - Mar',
    rating: 4.9,
    highlights: ['Tea Plantations', 'Houseboat Stay', 'Spice Gardens', 'Kathakali'],
  },
  {
    id: 'kyoto',
    destination: 'Kyoto',
    stateOrCountry: 'Japan',
    category: 'Ancient Temples & Zen',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    durationDays: 5,
    budget: 85000,
    travellers: 2,
    travelStyle: 'culture',
    bestSeason: 'Mar - May, Oct - Nov',
    rating: 5.0,
    highlights: ['Fushimi Inari', 'Arashiyama Bamboo', 'Kinkaku-ji', 'Gion District'],
  },
  {
    id: 'paris',
    destination: 'Paris',
    stateOrCountry: 'France',
    category: 'Art, Romance & Cuisine',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    durationDays: 4,
    budget: 95000,
    travellers: 2,
    travelStyle: 'culture',
    bestSeason: 'Apr - Oct',
    rating: 4.9,
    highlights: ['Eiffel Tower', 'Louvre Museum', 'Montmartre', 'Seine River Cruise'],
  },
];

interface PopularDestinationsProps {
  onSelectDestination: (preset: DestinationPreset) => void;
}

export const PopularDestinations: React.FC<PopularDestinationsProps> = ({
  onSelectDestination,
}) => {
  return (
    <section id="destinations" className="py-12 sm:py-16">
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-pill bg-sky-50 border border-sky-100 text-xs font-semibold text-electric-blue mb-4">
          <Sparkles className="w-3.5 h-3.5 text-bright-cyan" />
          <span>Curated Travel Inspiration</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-ink tracking-tight">
          Trending Destinations
        </h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Jumpstart your adventure with our highest-rated travel hotspots. Select any destination to prefill your AI planning parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {POPULAR_DESTINATIONS.map((item) => (
          <div
            key={item.id}
            className="group bg-white rounded-card border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            {/* Top Image Banner */}
            <div className="relative h-56 overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.destination}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-ink/80 via-transparent to-black/20" />

              {/* Category Pill */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-charcoal-ink text-xs font-bold shadow-sm">
                  {item.category}
                </span>
              </div>

              {/* Rating */}
              <div className="absolute top-4 right-4 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-charcoal-ink/80 backdrop-blur-md text-sunset-yellow text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-sunset-yellow" />
                <span className="text-white">{item.rating}</span>
              </div>

              {/* Destination Title on Image */}
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-extrabold text-white">
                  {item.destination}
                </h3>
                <div className="flex items-center text-xs text-ash-gray mt-0.5">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-ocean-teal" />
                  <span>{item.stateOrCountry}</span>
                </div>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              {/* Key Specs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-fog-white border border-slate-100 flex items-center space-x-2.5">
                  <Calendar className="w-4 h-4 text-electric-blue flex-shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Duration</span>
                    <span className="font-bold text-slate-800">{item.durationDays} Days</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-fog-white border border-slate-100 flex items-center space-x-2.5">
                  <Wallet className="w-4 h-4 text-ocean-teal flex-shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Est. Budget</span>
                    <span className="font-bold text-slate-800">₹{item.budget.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Highlights tags */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Top Highlights
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.highlights.map((h, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onSelectDestination(item)}
                  className="w-full inline-flex items-center justify-center py-3 rounded-btn bg-slate-900 hover:bg-electric-blue text-white font-semibold text-xs transition-colors group/btn cursor-pointer"
                >
                  <span>Plan {item.destination} Trip</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
