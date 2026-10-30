import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { TravelForm } from './components/TravelForm';
import { PopularDestinations, DestinationPreset } from './components/PopularDestinations';
import { HowItWorks } from './components/HowItWorks';
import { FeaturesSection } from './components/FeaturesSection';
import { ItineraryPreviewSection } from './components/ItineraryPreviewSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { Footer } from './components/Footer';
import { BudgetSummary } from './components/BudgetSummary';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { BudgetOptimizerModal } from './components/BudgetOptimizerModal';
import { LoadingState } from './components/LoadingState';
import { ErrorBanner } from './components/ErrorBanner';
import { AuthModal } from './components/AuthModal';
import { DashboardModal } from './components/DashboardModal';
import {
  ItineraryFormInput,
  ItineraryData,
  OptimizeBudgetResponseData,
  DestinationImagesData,
} from './types';
import {
  generateItinerary,
  optimizeBudget,
  fetchDestinationImages,
  saveUserTrip,
  ApiError,
} from './services/api';
import { supabase } from './services/supabase';
import { SavedTripRecord } from './types';
import { Compass, RotateCcw, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // Itinerary & Results States
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [destinationImages, setDestinationImages] =
    useState<DestinationImagesData | null>(null);
  const [lastSubmittedInput, setLastSubmittedInput] =
    useState<ItineraryFormInput | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<ItineraryFormInput> | null>(null);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Array<{ field: string; message: string }> | undefined
  >(undefined);

  // Budget Optimizer States
  const [isOptimizerOpen, setIsOptimizerOpen] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizeBudgetResponseData | null>(null);

  // Saved Trip State
  const [isSavingTrip, setIsSavingTrip] = useState<boolean>(false);
  const [isTripSaved, setIsTripSaved] = useState<boolean>(false);

  // Auth & Dashboard States
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check auth on load
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email);
          return;
        }
      });
    }

    const storedEmail =
      localStorage.getItem('user_email') ||
      localStorage.getItem('tripgenie_user_email');
    const token =
      localStorage.getItem('supabase_token') ||
      localStorage.getItem('supabase_auth_token');
    if (token && storedEmail) {
      setUserEmail(storedEmail);
    }
  }, []);

  const handleAuthSuccess = (email: string) => {
    setUserEmail(email);
    setIsAuthOpen(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('supabase_auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('tripgenie_user_email');
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setUserEmail(null);
  };

  const scrollToPlanner = () => {
    const plannerEl = document.getElementById('planner');
    if (plannerEl) {
      plannerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectPopularDestination = (preset: DestinationPreset) => {
    setPrefillData({
      destination: preset.destination,
      durationDays: preset.durationDays,
      budget: preset.budget,
      travellers: preset.travellers,
      travelStyle: preset.travelStyle,
      interests: preset.highlights,
    });
    scrollToPlanner();
  };

  const handleGenerateItinerary = async (formData: ItineraryFormInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors(undefined);
    setLastSubmittedInput(formData);

    try {
      const [data, imagesData] = await Promise.all([
        generateItinerary(formData),
        fetchDestinationImages(formData.destination, 4),
      ]);
      setItineraryData(data);
      setDestinationImages(imagesData);

      // Smooth scroll to generated results
      setTimeout(() => {
        const resultsEl = document.getElementById('results-section');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401 || err.message.toLowerCase().includes('token')) {
          localStorage.removeItem('supabase_token');
          localStorage.removeItem('supabase_auth_token');
          setErrorMessage(
            'Your session token is unverified or expired. You can continue planning as a guest, or log in after confirming your email.'
          );
        } else {
          setErrorMessage(err.message);
        }
        setFieldErrors(err.errors);
      } else {
        setErrorMessage(
          'An unexpected error occurred while generating your itinerary.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerOptimization = async () => {
    if (!itineraryData || !lastSubmittedInput) return;
    setIsOptimizing(true);
    setErrorMessage(null);

    try {
      const result = await optimizeBudget({
        itinerary: {
          trip: itineraryData.trip,
          days: itineraryData.days,
          notes: itineraryData.notes,
        },
        userBudget: lastSubmittedInput.budget,
        travellers: lastSubmittedInput.travellers,
        travelStyle: lastSubmittedInput.travelStyle,
        interests: lastSubmittedInput.interests,
      });

      setOptimizationResult(result);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Unable to optimize budget at this time.';
      setErrorMessage(msg);
      setIsOptimizerOpen(false);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimization = (optimizedData: ItineraryData) => {
    setItineraryData(optimizedData);
    setOptimizationResult(null);
    setIsTripSaved(false);
  };

  const handleSaveTrip = async () => {
    if (!itineraryData || !lastSubmittedInput) return;
    if (!userEmail) {
      setAuthMode('signup');
      setIsAuthOpen(true);
      return;
    }

    setIsSavingTrip(true);
    try {
      await saveUserTrip({
        destination: itineraryData.trip.destination,
        duration_days: itineraryData.trip.durationDays,
        budget: Number(itineraryData.budget.userBudget),
        currency: itineraryData.trip.currency || 'INR',
        travellers: Number(lastSubmittedInput.travellers),
        travel_style: lastSubmittedInput.travelStyle,
        starting_city: lastSubmittedInput.startingCity,
        travel_preferences: {
          interests: lastSubmittedInput.interests,
          accommodation: lastSubmittedInput.accommodationPreference,
          transport: lastSubmittedInput.transportPreference,
          dietary: lastSubmittedInput.dietaryPreferences,
        },
        itinerary_data: {
          trip: itineraryData.trip,
          days: itineraryData.days,
          budget: itineraryData.budget,
          notes: itineraryData.notes,
        },
        status: 'planned',
      });
      setIsTripSaved(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save itinerary to your account.');
    } finally {
      setIsSavingTrip(false);
    }
  };

  const handleReset = () => {
    setItineraryData(null);
    setDestinationImages(null);
    setErrorMessage(null);
    setFieldErrors(undefined);
    setOptimizationResult(null);
    setIsTripSaved(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-800 font-sans selection:bg-bright-cyan/20 selection:text-deep-navy">
      {/* 1. Header / Navbar */}
      <Navbar
        onReset={handleReset}
        onOpenAuth={(mode = 'login') => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        isLoggedIn={Boolean(userEmail)}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-8">
            <ErrorBanner
              message={errorMessage}
              fieldErrors={fieldErrors}
              onRetry={
                lastSubmittedInput
                  ? () => handleGenerateItinerary(lastSubmittedInput)
                  : undefined
              }
              onDismiss={() => setErrorMessage(null)}
            />
          </div>
        )}

        {/* 2. Hero Section (64px Radius Dark Card) */}
        <HeroSection onStartPlanning={scrollToPlanner} />

        {/* 3. Travel Planner Form */}
        <div className="mb-16 sm:mb-24">
          <TravelForm
            onSubmit={handleGenerateItinerary}
            isLoading={isLoading}
            prefillData={prefillData}
          />
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mb-16">
            <LoadingState
              destination={lastSubmittedInput?.destination}
              durationDays={lastSubmittedInput?.durationDays}
            />
          </div>
        )}

        {/* 4. Active Itinerary Results Section */}
        {!isLoading && itineraryData && (
          <section id="results-section" className="animate-fade-in mb-20 space-y-8 scroll-mt-28">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-pill bg-ocean-teal/15 text-deep-navy text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-ocean-teal" />
                  <span>AI Plan Generated Successfully</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-ink tracking-tight flex items-center">
                  <Compass className="w-7 h-7 text-electric-blue mr-2.5" />
                  Your Custom Trip Plan
                </h2>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 rounded-btn bg-slate-200/80 hover:bg-slate-300 text-charcoal-ink text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset & Plan Another Trip
              </button>
            </div>

            {/* Budget Transparency & Breakdown */}
            <BudgetSummary
              budget={itineraryData.budget}
              travellers={lastSubmittedInput?.travellers || 1}
              onOpenOptimizer={() => {
                setOptimizationResult(null);
                setIsOptimizerOpen(true);
              }}
              isOptimizing={isOptimizing}
            />

            {/* Day-by-Day Itinerary Details & Photos */}
            <ItineraryDisplay
              data={itineraryData}
              images={destinationImages}
              onSaveTrip={handleSaveTrip}
              isSaving={isSavingTrip}
              isSaved={isTripSaved}
            />
          </section>
        )}

        {/* 5. Popular Destinations Grid */}
        <PopularDestinations onSelectDestination={handleSelectPopularDestination} />

        {/* 6. How TripGenie Works (3 Steps) */}
        <HowItWorks onStartPlanning={scrollToPlanner} />

        {/* 7. Core Capabilities / Features (8 Cards alternating dark & light) */}
        <FeaturesSection />

        {/* 8. AI Itinerary Interactive Showcase (Paris 4-Day Demo) */}
        <ItineraryPreviewSection />

        {/* 9. Social Proof & Testimonials */}
        <TestimonialsSection />

        {/* 10. Final Conversion CTA Section */}
        <FinalCtaSection onStartPlanning={scrollToPlanner} />
      </main>

      {/* 11. Smart Budget Optimizer Modal */}
      {itineraryData && (
        <BudgetOptimizerModal
          isOpen={isOptimizerOpen}
          onClose={() => {
            setIsOptimizerOpen(false);
            setOptimizationResult(null);
          }}
          onApplyOptimization={handleApplyOptimization}
          isOptimizing={isOptimizing}
          optimizationResult={optimizationResult}
          currentData={itineraryData}
          onTriggerOptimization={handleTriggerOptimization}
        />
      )}

      {/* 12. Authentication Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleAuthSuccess}
      />

      {/* 13. User Dashboard Modal (Saved Trips & Preferences) */}
      <DashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        onLogout={handleSignOut}
        onPlanNewTrip={() => {
          setIsDashboardOpen(false);
          scrollToPlanner();
        }}
        onSelectTrip={(savedTrip: SavedTripRecord) => {
          if (savedTrip.itinerary_data && typeof savedTrip.itinerary_data === 'object' && 'trip' in savedTrip.itinerary_data) {
            setItineraryData(savedTrip.itinerary_data as ItineraryData);
            setIsTripSaved(true);
            setTimeout(() => {
              document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }
        }}
      />

      {/* 14. Global Premium Footer */}
      <Footer onReset={handleReset} />
    </div>
  );
};

export default App;
