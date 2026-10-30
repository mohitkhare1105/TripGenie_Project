import React from 'react';
import { ItineraryData, ActivityItem, ActivityPeriod } from '../types';
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
} from 'lucide-react';

interface ItineraryDisplayProps {
  data: ItineraryData;
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

export const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ data }) => {
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

  return (
    <div className="space-y-8">
      {/* Trip Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium mb-3">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              {trip.durationDays} Days Itinerary
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {trip.destination}
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
              Personalized day-by-day plan tailored to your preferences, travel style, and budget.
            </p>
          </div>
        </div>
      </div>

      {/* Days Timeline */}
      <div className="space-y-6">
        {days.map((dayPlan) => (
          <div
            key={dayPlan.day}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
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

