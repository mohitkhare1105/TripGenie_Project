import React, { useState, useEffect } from 'react';
import {
  ItineraryFormInput,
  TravelStyle,
  AccommodationPreference,
  TransportPreference,
} from '../types';
import {
  MapPin,
  Calendar,
  Wallet,
  Users,
  Compass,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface TravelFormProps {
  onSubmit: (data: ItineraryFormInput) => void;
  isLoading: boolean;
  prefillData?: Partial<ItineraryFormInput> | null;
}

const COMMON_INTERESTS = [
  'nature',
  'trekking',
  'local food',
  'history',
  'beaches',
  'shopping',
  'photography',
  'culture',
  'nightlife',
  'relaxation',
];

export const TravelForm: React.FC<TravelFormProps> = ({
  onSubmit,
  isLoading,
  prefillData,
}) => {
  const [destination, setDestination] = useState('Manali');
  const [durationDays, setDurationDays] = useState<number>(3);
  const [budget, setBudget] = useState<number>(15000);
  const [travellers, setTravellers] = useState<number>(2);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('adventure');

  // Optional fields state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [startingCity, setStartingCity] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'nature',
    'trekking',
    'local food',
  ]);
  const [customInterest, setCustomInterest] = useState('');
  const [accommodationPreference, setAccommodationPreference] =
    useState<AccommodationPreference>('budget');
  const [transportPreference, setTransportPreference] =
    useState<TransportPreference>('public transport');
  const [dietaryPreferences, setDietaryPreferences] = useState('vegetarian');
  const [accessibilityRequirements, setAccessibilityRequirements] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync prefillData when clicked from PopularDestinations
  useEffect(() => {
    if (prefillData) {
      if (prefillData.destination) setDestination(prefillData.destination);
      if (prefillData.durationDays) setDurationDays(prefillData.durationDays);
      if (prefillData.budget) setBudget(prefillData.budget);
      if (prefillData.travellers) setTravellers(prefillData.travellers);
      if (prefillData.travelStyle) setTravelStyle(prefillData.travelStyle);
      if (prefillData.interests && prefillData.interests.length > 0) {
        setSelectedInterests(prefillData.interests);
      }
    }
  }, [prefillData]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length >= 10) return;
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const addCustomInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customInterest.trim()) {
      e.preventDefault();
      const trimmed = customInterest.trim().toLowerCase();
      if (!selectedInterests.includes(trimmed) && selectedInterests.length < 10) {
        setSelectedInterests([...selectedInterests, trimmed]);
      }
      setCustomInterest('');
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!destination.trim()) {
      newErrors.destination = 'Destination is required';
    } else if (destination.length > 100) {
      newErrors.destination = 'Destination cannot exceed 100 characters';
    }

    if (!durationDays || durationDays < 1 || durationDays > 30) {
      newErrors.durationDays = 'Trip duration must be between 1 and 30 days';
    }

    if (!budget || budget <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    } else if (budget > 10000000) {
      newErrors.budget = 'Budget cannot exceed ₹10,000,000';
    }

    if (!travellers || travellers < 1 || travellers > 50) {
      newErrors.travellers = 'Travellers must be between 1 and 50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: ItineraryFormInput = {
      destination: destination.trim(),
      durationDays: Number(durationDays),
      budget: Number(budget),
      travellers: Number(travellers),
      travelStyle,
    };

    if (startingCity.trim()) payload.startingCity = startingCity.trim();
    if (selectedInterests.length > 0) payload.interests = selectedInterests;
    if (accommodationPreference)
      payload.accommodationPreference = accommodationPreference;
    if (transportPreference) payload.transportPreference = transportPreference;
    if (dietaryPreferences.trim())
      payload.dietaryPreferences = [dietaryPreferences.trim()];
    if (accessibilityRequirements.trim())
      payload.accessibilityRequirements = accessibilityRequirements.trim();
    if (additionalNotes.trim()) payload.additionalNotes = additionalNotes.trim();

    onSubmit(payload);
  };

  return (
    <div id="planner" className="scroll-mt-28">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-card border border-slate-200/90 shadow-md p-6 sm:p-10 lg:p-12 relative overflow-hidden"
        noValidate
      >
        {/* Subtle accent border at top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-electric-blue via-bright-cyan to-ocean-teal" />

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-pill bg-sky-50 text-electric-blue text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-bright-cyan" />
            <span>AI Itinerary Generator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-ink tracking-tight">
            Where do you want to explore?
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Customize your parameters below. Our Groq AI engine will construct a personalized, day-by-day travel plan with verified budget math.
          </p>
        </div>

        {/* Primary Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Destination */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Destination <span className="text-coral-pulse">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Manali, Goa, Jaipur, Paris"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none transition-all ${
                  errors.destination
                    ? 'border-red-300 focus:ring-2 focus:ring-red-200 bg-red-50/30'
                    : 'border-slate-200 focus:border-electric-blue focus:ring-2 focus:ring-sky-100'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.destination && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.destination}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Duration (Days) <span className="text-coral-pulse">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                min={1}
                max={30}
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 0)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none transition-all ${
                  errors.durationDays
                    ? 'border-red-300 focus:ring-2 focus:ring-red-200 bg-red-50/30'
                    : 'border-slate-200 focus:border-electric-blue focus:ring-2 focus:ring-sky-100'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.durationDays && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.durationDays}</p>
            )}
          </div>

          {/* Total Group Budget */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Total Budget (INR ₹) <span className="text-coral-pulse">*</span>
            </label>
            <div className="relative">
              <Wallet className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                min={100}
                step={500}
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none transition-all ${
                  errors.budget
                    ? 'border-red-300 focus:ring-2 focus:ring-red-200 bg-red-50/30'
                    : 'border-slate-200 focus:border-electric-blue focus:ring-2 focus:ring-sky-100'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.budget && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.budget}</p>
            )}
          </div>

          {/* Number of Travellers */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Travellers <span className="text-coral-pulse">*</span>
            </label>
            <div className="relative">
              <Users className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                min={1}
                max={50}
                value={travellers}
                onChange={(e) => setTravellers(parseInt(e.target.value, 10) || 0)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none transition-all ${
                  errors.travellers
                    ? 'border-red-300 focus:ring-2 focus:ring-red-200 bg-red-50/30'
                    : 'border-slate-200 focus:border-electric-blue focus:ring-2 focus:ring-sky-100'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.travellers && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.travellers}</p>
            )}
          </div>

          {/* Travel Style */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Travel Style <span className="text-coral-pulse">*</span>
            </label>
            <div className="relative">
              <Compass className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value as TravelStyle)}
                className="w-full pl-11 pr-8 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-sky-100 bg-white capitalize"
                disabled={isLoading}
              >
                <option value="adventure">Adventure</option>
                <option value="relaxation">Relaxation</option>
                <option value="family">Family</option>
                <option value="solo">Solo</option>
                <option value="culture">Culture</option>
                <option value="food">Food</option>
              </select>
            </div>
          </div>

          {/* Starting City */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Starting City <span className="text-slate-400 font-normal normal-case">(Optional)</span>
            </label>
            <input
              type="text"
              value={startingCity}
              onChange={(e) => setStartingCity(e.target.value)}
              placeholder="e.g. Delhi, Mumbai, Bengaluru"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-sky-100"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Interests Chips */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Your Interests <span className="text-slate-400 font-normal">({selectedInterests.length}/10 selected)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  disabled={isLoading}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-electric-blue text-white shadow-sm shadow-electric-blue/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <input
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyDown={addCustomInterest}
              placeholder="Type custom interest and press Enter (e.g. scuba, pottery)..."
              className="w-full sm:w-96 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-sky-100"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Advanced Preferences Accordion */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-xs font-bold text-electric-blue hover:text-bright-cyan transition-colors cursor-pointer"
          >
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 mr-1.5" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1.5" />
            )}
            {showAdvanced ? 'Hide Optional Preferences' : 'Add Accommodation, Transport, Dietary & Accessibility Needs'}
          </button>

          {showAdvanced && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-5 rounded-2xl bg-fog-white border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Accommodation Preference
                </label>
                <select
                  value={accommodationPreference}
                  onChange={(e) =>
                    setAccommodationPreference(
                      e.target.value as AccommodationPreference
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white capitalize focus:outline-none focus:border-electric-blue"
                  disabled={isLoading}
                >
                  <option value="budget">Budget (Hostels / Homestays)</option>
                  <option value="standard">Standard (3-Star Hotels)</option>
                  <option value="comfort">Comfort (Resorts / Premium)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Transport Preference
                </label>
                <select
                  value={transportPreference}
                  onChange={(e) =>
                    setTransportPreference(e.target.value as TransportPreference)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white capitalize focus:outline-none focus:border-electric-blue"
                  disabled={isLoading}
                >
                  <option value="public transport">Public Transport / Metro</option>
                  <option value="walking">Walking / Eco-friendly</option>
                  <option value="taxi">Taxi / Cabs</option>
                  <option value="rental vehicle">Self-drive Rental Vehicle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dietary Preference
                </label>
                <input
                  type="text"
                  value={dietaryPreferences}
                  onChange={(e) => setDietaryPreferences(e.target.value)}
                  placeholder="e.g. Vegetarian, Halal, Vegan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-electric-blue"
                  disabled={isLoading}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Accessibility Requirements
                </label>
                <input
                  type="text"
                  value={accessibilityRequirements}
                  onChange={(e) => setAccessibilityRequirements(e.target.value)}
                  placeholder="e.g. Wheelchair access, elevator"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-electric-blue"
                  disabled={isLoading}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Additional Notes & Constraints
                </label>
                <input
                  type="text"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Early morning starts preferred, avoid crowded spots"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-electric-blue"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center">
            <HelpCircle className="w-4 h-4 mr-1.5 text-slate-400" />
            <span>Deterministic financial math runs entirely server-side.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-9 py-3.5 rounded-btn bg-coral-pulse hover:bg-[#E02445] text-white font-bold text-sm shadow-lg shadow-coral-pulse/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Crafting Your Itinerary...
              </span>
            ) : (
              <span className="flex items-center">
                <span>Generate AI Itinerary</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
