import React, { useEffect, useState } from 'react';
import { X, MapPin, Calendar, Wallet, Compass, LogOut, Plus, Award, Clock, Trash2 } from 'lucide-react';
import { fetchUserTrips, deleteUserTrip } from '../services/api';
import { SavedTripRecord } from '../types';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onPlanNewTrip: () => void;
  onSelectTrip?: (trip: SavedTripRecord) => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  onPlanNewTrip,
  onSelectTrip,
}) => {
  const [trips, setTrips] = useState<SavedTripRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const userEmail = localStorage.getItem('user_email') || 'traveler@tripgenie.ai';
  const userName = localStorage.getItem('user_name') || 'Modern Traveler';

  useEffect(() => {
    if (isOpen) {
      loadTrips();
    }
  }, [isOpen]);

  const loadTrips = async () => {
    setIsLoading(true);
    try {
      const result = await fetchUserTrips();
      if (result && result.items) {
        setTrips(result.items);
      }
    } catch {
      // If backend database is offline or unmigrated, maintain existing trips
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
    } catch (err) {
      alert('Failed to delete trip. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalDays = trips.reduce((sum, t) => sum + (t.duration_days || 0), 0);

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
            <div className="w-12 h-12 rounded-full gradient-brand text-white font-bold text-lg flex items-center justify-center shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-charcoal-ink">{userName}</h2>
              <p className="text-xs text-slate-muted">{userEmail}</p>
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

        {/* Quick Travel Stats */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="p-4 rounded-2xl bg-fog-white border border-ash-gray text-center">
            <Compass className="w-5 h-5 text-electric-blue mx-auto mb-1.5" />
            <div className="text-lg font-bold text-charcoal-ink">{trips.length}</div>
            <div className="text-[11px] text-slate-muted">Saved Trips</div>
          </div>
          <div className="p-4 rounded-2xl bg-tide-tint border border-ocean-teal/20 text-center">
            <Award className="w-5 h-5 text-ocean-teal mx-auto mb-1.5" />
            <div className="text-lg font-bold text-charcoal-ink">
              {trips.length >= 5 ? 'Globetrotter' : trips.length >= 2 ? 'Explorer' : 'Novice'}
            </div>
            <div className="text-[11px] text-slate-muted">Traveler Tier</div>
          </div>
          <div className="p-4 rounded-2xl bg-fog-white border border-ash-gray text-center">
            <Clock className="w-5 h-5 text-sunset-yellow mx-auto mb-1.5" />
            <div className="text-lg font-bold text-charcoal-ink">{totalDays} Days</div>
            <div className="text-[11px] text-slate-muted">Total Days Planned</div>
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

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-muted">Loading your itineraries...</div>
          ) : trips.length === 0 ? (
            <div className="py-8 text-center bg-fog-white rounded-2xl border border-dashed border-ash-gray">
              <Compass className="w-8 h-8 text-slate-muted mx-auto mb-2 opacity-50" />
              <p className="text-xs text-slate-muted">You haven't saved any itineraries yet.</p>
              <button
                onClick={() => {
                  onClose();
                  onPlanNewTrip();
                }}
                className="mt-3 text-xs font-semibold text-electric-blue hover:underline cursor-pointer"
              >
                Plan and save your first trip now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 rounded-2xl bg-white border border-ash-gray hover:border-ocean-teal/50 hover:shadow-subtle transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-charcoal-ink flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-coral-pulse mr-1.5" />
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
                      className="p-1.5 rounded-btn text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
