import React from 'react';
import {
  ItineraryData,
  ActivityItem,
  ActivityPeriod,
  DestinationImagesData,
} from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Info,
  ShieldAlert,
  Camera,
  Bookmark,
  Check,
} from 'lucide-react';

interface ItineraryDisplayProps {
  data: ItineraryData;
  images?: DestinationImagesData | null;
  onSaveTrip?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

const PERIOD_CONFIG: Record<
  ActivityPeriod,
  { label: string; icon: React.ReactNode; color: string }
> = {
  morning: {
    label: 'Morning',
    icon: <Sunrise className="w-4 h-4 text-amber-500" />,
    color: 'bg-amber-50 border-amber-200 text-amber-900',
  },
  afternoon: {
    label: 'Afternoon',
    icon: <Sun className="w-4 h-4 text-orange-500" />,
    color: 'bg-orange-50 border-orange-200 text-orange-900',
  },
  evening: {
    label: 'Evening',
    icon: <Sunset className="w-4 h-4 text-rose-500" />,
    color: 'bg-rose-50 border-rose-200 text-rose-900',
  },
  night: {
    label: 'Night',
    icon: <Moon className="w-4 h-4 text-indigo-500" />,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  },
};

export const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({
  data,
  images,
  onSaveTrip,
  isSaving = false,
  isSaved = false,
}) => {
  const { trip, days, notes } = data;

  const formatCost = (item: ActivityItem) => {
    if (item.costStatus === 'free' || item.estimatedCost === 0) {
      return 'Free';
    }
    if (
      item.estimatedCost !== null &&
      item.estimatedCost !== undefined &&
      item.estimatedCost > 0
    ) {
      const formatted = `₹${item.estimatedCost.toLocaleString('en-IN')}`;
      return item.pricingType === 'per_person' ? `${formatted} / person` : formatted;
    }
    return 'Cost unestimated';
  };

  const heroImage = images?.primary_image;

  return (
    <div className="space-y-8">
      {/* Trip Header Banner with Unsplash Destination Image */}
      <div
        className="relative rounded-card overflow-hidden shadow-lg text-white min-h-[240px] flex flex-col justify-end transition-all"
        style={
          heroImage?.url
            ? {
                backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.5) 60%, rgba(15, 23, 42, 0.3) 100%), url(${heroImage.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {!heroImage?.url && (
          <div className="absolute inset-0 bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 -z-10" />
        )}
        <div className="p-6 sm:p-8 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium mb-3">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                {trip.durationDays} Days Itinerary
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
                {trip.destination}
              </h1>
              <p className="text-xs sm:text-sm text-slate-100 mt-1 max-w-xl drop-shadow">
                Personalized day-by-day plan tailored to your preferences, travel style, and budget.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {onSaveTrip && (
                <button
                  type="button"
                  onClick={onSaveTrip}
                  disabled={isSaving || isSaved}
                  className={`inline-flex items-center px-4 py-2.5 rounded-btn text-xs font-bold transition-all shadow-md cursor-pointer ${
                    isSaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-slate-100 text-charcoal-ink'
                  }`}
                >
                  {isSaved ? (
                    <Check className="w-4 h-4 mr-1.5 text-white" />
                  ) : (
                    <Bookmark className="w-4 h-4 mr-1.5 text-coral-pulse" />
                  )}
                  {isSaving ? 'Saving...' : isSaved ? 'Saved to Dashboard' : 'Save Itinerary'}
                </button>
              )}

              {heroImage?.photographer_name && (
                <div className="text-[11px] text-slate-300 backdrop-blur-sm bg-black/40 px-2.5 py-1.5 rounded-md border border-white/10">
                  Photo by{' '}
                  <a
                    href={`${heroImage.photographer_url}?utm_source=tripgenie_ai&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white transition-colors"
                  >
                    {heroImage.photographer_name}
                  </a>{' '}
                  on{' '}
                  <a
                    href="https://unsplash.com/?utm_source=tripgenie_ai&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white transition-colors"
                  >
                    Unsplash
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Destination Photo Gallery Highlights */}
      {images && images.images && images.images.length > 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <Camera className="w-4 h-4 text-sky-600 mr-1.5" />
              Destination Highlights — {trip.destination}
            </h3>
            <span className="text-[11px] text-slate-400">Curated via Unsplash</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.images.map((img) => (
              <a
                key={img.id}
                href={img.unsplash_url || img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200 shadow-xs hover:shadow-md transition-all block"
              >
                <img
                  src={img.thumb_url || img.url}
                  alt={img.alt_description || trip.destination}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-[10px] text-white truncate">
                    {img.photographer_name ? `Photo: ${img.photographer_name}` : trip.destination}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Days Timeline */}
      <div className="space-y-6">
        {days.map((dayPlan) => (
          <div
            key={dayPlan.day}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
          >
            {/* Day Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {dayPlan.day}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Day {dayPlan.day}
                    {dayPlan.theme && (
                      <span className="font-normal text-slate-600 ml-2">
                        — {dayPlan.theme}
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                {dayPlan.activities.length} activities planned
              </span>
            </div>

            {/* Activities List */}
            <div className="p-6 divide-y divide-slate-100">
              {dayPlan.activities.map((activity, idx) => {
                const periodCfg = PERIOD_CONFIG[activity.period] || PERIOD_CONFIG.morning;

                return (
                  <div
                    key={idx}
                    className={`${
                      idx !== 0 ? 'pt-5' : ''
                    } ${idx !== dayPlan.activities.length - 1 ? 'pb-5' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {/* Period Badge */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${periodCfg.color}`}
                          >
                            {periodCfg.icon}
                            <span className="ml-1">{periodCfg.label}</span>
                          </span>

                          {/* Category Tag */}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                            <Tag className="w-3 h-3 mr-1 text-slate-400" />
                            {activity.category}
                          </span>

                          {/* Suggested Start Time */}
                          {activity.suggestedTime && (
                            <span className="inline-flex items-center text-[11px] text-slate-500">
                              <Clock className="w-3 h-3 mr-1 text-slate-400" />
                              {activity.suggestedTime}
                            </span>
                          )}

                          {/* Duration */}
                          {activity.durationMinutes && (
                            <span className="text-[11px] text-slate-500">
                              ({activity.durationMinutes} mins)
                            </span>
                          )}
                        </div>

                        {/* Activity Title (Safe Text Rendering) */}
                        <h4 className="text-base font-semibold text-slate-900">
                          {activity.title}
                        </h4>

                        {/* Description (Safe Text Rendering) */}
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                          {activity.description}
                        </p>

                        {/* Location */}
                        {activity.location && (
                          <div className="flex items-center text-xs text-slate-500 mt-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
                            <span>{activity.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Estimated Cost Badge */}
                      <div className="md:text-right flex-shrink-0">
                        <span className="inline-block px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                          {formatCost(activity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Practical Notes & Disclaimers */}
      {notes && notes.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center mb-3">
            <Info className="w-4 h-4 text-sky-600 mr-1.5" />
            Travel Advice & Important Notes
          </h4>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
            {notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-[11px] text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            TripGenie AI provides travel planning recommendations. All prices, transport schedules, and operating hours are estimates and must be independently confirmed.
          </div>
        </div>
      )}
    </div>
  );
};

