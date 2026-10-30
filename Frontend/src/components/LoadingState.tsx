import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, MapPin, Calendar, Wallet } from 'lucide-react';

interface LoadingStateProps {
  destination?: string;
  durationDays?: number;
  isOptimizing?: boolean;
}

const GENERATING_TIPS = [
  'Consulting Gemini AI to find authentic spots and local dining...',
  'Organizing activities into morning, afternoon, and evening...',
  'Calculating travel pacing and reasonable rest buffers...',
  'Validating budget numbers and category breakdowns in application code...',
  'Finalizing day-by-day recommendations and safety notes...',
];

const OPTIMIZING_TIPS = [
  'Analyzing current itinerary expenses against your target budget...',
  'Searching for high-value cultural gems and public transit alternatives...',
  'Balancing cost savings without sacrificing your primary interests...',
  'Recalculating revised category estimates in backend code...',
];

export const LoadingState: React.FC<LoadingStateProps> = ({
  destination,
  durationDays,
  isOptimizing = false,
}) => {
  const tips = isOptimizing ? OPTIMIZING_TIPS : GENERATING_TIPS;
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center shadow-sm max-w-xl mx-auto my-8">
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shadow">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">
        {isOptimizing
          ? 'Optimizing Itinerary Budget...'
          : destination
          ? `Crafting Your ${durationDays || 3}-Day Trip to ${destination}...`
          : 'Planning Your Dream Itinerary...'}
      </h3>

      <p className="text-sm text-slate-600 min-h-[40px] flex items-center justify-center transition-opacity duration-300">
        {tips[tipIndex]}
      </p>

      <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center space-x-6 text-xs text-slate-400">
        <span className="flex items-center">
          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> Curated Spots
        </span>
        <span className="flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Day Timeline
        </span>
        <span className="flex items-center">
          <Wallet className="w-3.5 h-3.5 mr-1 text-slate-400" /> Verified Math
        </span>
      </div>
    </div>
  );
};

