import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Wallet,
  Compass,
  LogOut,
  Plus,
  Clock,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { fetchUserTrips, deleteUserTrip, ApiError } from '../services/api';
import { SavedTripRecord } from '../types';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onPlanNewTrip: () => void;
  onSelectTrip?: (trip: SavedTripRecord) => void;
  userEmail?: string | null;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  onPlanNewTrip,
  onSelectTrip,
  userEmail,
}) => {
  const [trips, setTrips] = useState<SavedTripRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTrips();
    }
  }, [isOpen]);

  const loadTrips = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchUserTrips();
      if (result && Array.isArray(result.items)) {
        setTrips(result.items);
      } else {
        setTrips([]);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Unable to load saved trips. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!window.confirm('Are you sure you want to delete this saved itinerary?')) return;
    setDeletingId(tripId);
    try {
      await deleteUserTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete trip.';
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const totalDays = trips.reduce((sum, t) => sum + (t.duration_days || 0), 0);
  const totalBudget = trips.reduce((sum, t) => sum + (Number(t.budget) || 0), 0);
  const displayEmail = userEmail || 'Explorer';
  const initial = displayEmail.charAt(0).toUpperCase();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-ink/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] sm:rounded-card p-6 sm:p-8 shadow-elevated border border-ash-gray max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-muted hover:text-charcoal-ink hover:bg-fog-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ash-gray">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-full bg-electric-blue text-white font-bold text-lg flex items-center justify-center shadow-sm">
              {initial}
            </div>
            <div>
              <h2 className="text-xl font-bold text-charcoal-ink">{displayEmail}</h2>
              <p className="text-xs text-slate-muted">TripGenie Traveler Account</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onPlanNewTrip();
              }}
              className="px-4 py-2 rounded-btn bg-coral-pulse hover:bg-[#E02445] text-white font-semibold text-xs flex items-center shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Trip
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-btn text-slate-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real User Travel Stats */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="p-4 rounded-2xl bg-fog-white border border-ash-gray text-center">
            <Compass className="w-5 h-5 text-electric-blue mx-auto mb-1.5" />
            <div className="text-lg font-bold text-charcoal-ink">{trips.length}</div>
            <div className="text-[11px] text-slate-muted">Saved Trips</div>
          </div>
          <div className="p-4 rounded-2xl bg-fog-white border border-ash-gray text-center">
            <Clock className="w-5 h-5 text-ocean-teal mx-auto mb-1.5" />
            <div className="text-lg font-bold text-charcoal-ink">{totalDays}</div>
            <div className="text-[11px] text-slate-muted">Total Days</div>
          </div>
          <div className="p-4 rounded-2xl bg-fog-white border border-ash-gray text-center">
            <Wallet className="w-5 h-5 text-sunset-yellow mx-auto mb-1.5" />
            <div className="text-lg font-bold text-charcoal-ink">
              {totalBudget > 0 ? `₹${totalBudget.toLocaleString()}` : '—'}
            </div>
            <div className="text-[11px] text-slate-muted">Total Budget</div>
          </div>
        </div>

        {/* Saved Trips List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-charcoal-ink uppercase tracking-wider flex items-center">
              <Compass className="w-4 h-4 text-electric-blue mr-2" />
              Your Saved Itineraries
            </h3>
            <span className="text-xs text-slate-400 font-medium">Supabase Cloud Sync</span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 text-center text-xs text-slate-muted flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 text-electric-blue animate-spin mb-2" />
              <span>Loading your saved itineraries from Supabase...</span>
            </div>
          )}

          {/* Error State */}
          {!isLoading && errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-6 h-6 text-rose-600 mb-2" />
              <p className="font-semibold mb-2">{errorMessage}</p>
              <button
                onClick={loadTrips}
                className="px-3 py-1.5 rounded-btn bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !errorMessage && trips.length === 0 && (
            <div className="py-10 text-center bg-fog-white rounded-2xl border border-dashed border-ash-gray">
              <Compass className="w-8 h-8 text-slate-muted mx-auto mb-2 opacity-50" />
              <p className="text-xs text-slate-muted font-medium">You haven't saved any itineraries yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Generate a custom trip with AI and click "Save Itinerary" to store it here.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onPlanNewTrip();
                }}
                className="mt-3 text-xs font-semibold text-electric-blue hover:underline cursor-pointer"
              >
                Plan and save your first trip now →
              </button>
            </div>
          )}

          {/* Populated State */}
          {!isLoading && !errorMessage && trips.length > 0 && (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 rounded-2xl bg-white border border-ash-gray hover:border-ocean-teal/50 hover:shadow-subtle transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-charcoal-ink flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-coral-pulse mr-1.5 flex-shrink-0" />
                      {trip.destination}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-muted">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {trip.duration_days} Days
                      </span>
                      {trip.budget && (
                        <span className="flex items-center">
                          <Wallet className="w-3 h-3 mr-1" />
                          ₹{Number(trip.budget).toLocaleString()}
                        </span>
                      )}
                      <span className="text-slate-400">
                        {new Date(trip.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {onSelectTrip && (
                      <button
                        onClick={() => {
                          onSelectTrip(trip);
                          onClose();
                        }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-btn bg-fog-white hover:bg-tide-tint text-charcoal-ink transition-colors cursor-pointer"
                      >
                        View Plan
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(trip.id)}
                      disabled={deletingId === trip.id}
                      className="p-1.5 rounded-btn text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete saved itinerary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
