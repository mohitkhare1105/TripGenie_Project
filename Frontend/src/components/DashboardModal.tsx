import React, { useEffect, useState } from 'react';
import { X, MapPin, Calendar, Wallet, Compass, LogOut, Plus, Award, Clock } from 'lucide-react';
import { getAuthToken } from '../services/api';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onPlanNewTrip: () => void;
}

interface SavedTripItem {
  id: string;
  destination: string;
  duration_days: number;
  total_budget?: number;
  created_at: string;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  onPlanNewTrip,
}) => {
  const [trips, setTrips] = useState<SavedTripItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const userEmail = localStorage.getItem('user_email') || 'traveler@tripgenie.ai';
  const userName = localStorage.getItem('user_name') || 'Modern Traveler';

  useEffect(() => {
    if (isOpen) {
      fetchUserTrips();
    }
  }, [isOpen]);

  const fetchUserTrips = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/trips`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTrips(json.data.trips || []);
          return;
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }

    // Default sample trips for presentation
    setTrips([
      {
        id: 'trip-1',
        destination: 'Goa, India',
        duration_days: 3,
        total_budget: 18500,
        created_at: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
      },
      {
        id: 'trip-2',
        destination: 'Jaipur, Rajasthan',
        duration_days: 4,
        total_budget: 24000,
        created_at: new Date(Date.now() - 86400000 * 5).toLocaleDateString(),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-ink/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] sm:rounded-card p-6 sm:p-8 shadow-elevated border border-ash-gray max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-muted hover:text-charcoal-ink hover:bg-fog-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ash-gray">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-full gradient-brand text-white font-bold text-lg flex items-center justify-center shadow-sm">
              {userName.charAt(0)}
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
              className="px-4 py-2 rounded-btn bg-coral-pulse hover:bg-coral-pulse/90 text-white font-semibold text-xs flex items-center shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Trip
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-btn text-slate-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
            <div className="text-[11px] text-slate-muted">Planned Trips</div>
          </div>
          <div className="p-4 rounded-2xl bg-tide-tint border border-ocean-teal/20 text-center">
            <Award className="w-5 h-5 text-ocean-teal mx-auto mb-1.5" />
            <div className="text-lg font-bold text-charcoal-ink">Explorer</div>
            <div className="text-[11px] text-slate-muted">Traveler Tier</div>
          </div>
          <div className="p-4 rounded-2xl bg-fog-white border border-ash-gray text-center">
            <Clock className="w-5 h-5 text-sunset-yellow mx-auto mb-1.5" />
            <div className="text-lg font-bold text-charcoal-ink">7 Days</div>
            <div className="text-[11px] text-slate-muted">Total Time</div>
          </div>
        </div>

        {/* Saved Trips List */}
        <div>
          <h3 className="text-sm font-bold text-charcoal-ink uppercase tracking-wider mb-3 flex items-center">
            <Compass className="w-4 h-4 text-electric-blue mr-2" />
            Your Saved Itineraries
          </h3>

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
                className="mt-3 text-xs font-semibold text-electric-blue hover:underline"
              >
                Plan your first trip now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 rounded-2xl bg-white border border-ash-gray hover:border-ocean-teal/50 hover:shadow-subtle transition-all flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-charcoal-ink flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-coral-pulse mr-1.5" />
                      {trip.destination}
                    </h4>
                    <div className="flex items-center space-x-3 text-xs text-slate-muted mt-1">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {trip.duration_days} Days
                      </span>
                      {trip.total_budget && (
                        <span className="flex items-center">
                          <Wallet className="w-3 h-3 mr-1" />
                          ₹{trip.total_budget.toLocaleString()}
                        </span>
                      )}
                      <span>Saved: {trip.created_at}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onPlanNewTrip();
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-btn bg-fog-white hover:bg-tide-tint text-charcoal-ink transition-colors"
                  >
                    View Plan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

