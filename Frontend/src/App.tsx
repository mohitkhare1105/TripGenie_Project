import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { TravelForm } from './components/TravelForm';
import { BudgetSummary } from './components/BudgetSummary';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { BudgetOptimizerModal } from './components/BudgetOptimizerModal';
import { LoadingState } from './components/LoadingState';
import { ErrorBanner } from './components/ErrorBanner';
import {
  ItineraryFormInput,
  ItineraryData,
  OptimizeBudgetResponseData,
} from './types';
import { generateItinerary, optimizeBudget, ApiError } from './services/api';
import { Compass, RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [lastSubmittedInput, setLastSubmittedInput] =
    useState<ItineraryFormInput | null>(null);

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

  const handleGenerateItinerary = async (formData: ItineraryFormInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors(undefined);
    setLastSubmittedInput(formData);

    try {
      const data = await generateItinerary(formData);
      setItineraryData(data);
      // Scroll smoothly down to results
      window.scrollTo({ top: 380, behavior: 'smooth' });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
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
  };

  const handleReset = () => {
    setItineraryData(null);
    setErrorMessage(null);
    setFieldErrors(undefined);
    setOptimizationResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar onReset={handleReset} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Error notification banner */}
        {errorMessage && (
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
        )}

        {/* Travel Form */}
        <div className="mb-8">
          <TravelForm
            onSubmit={handleGenerateItinerary}
            isLoading={isLoading}
          />
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <LoadingState
            destination={lastSubmittedInput?.destination}
            durationDays={lastSubmittedInput?.durationDays}
          />
        )}

        {/* Results Area */}
        {!isLoading && itineraryData && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center">
                <Compass className="w-5 h-5 text-sky-600 mr-2" />
                Your Trip Itinerary
              </h2>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Plan Another Trip
              </button>
            </div>

            {/* Budget Summary & Transparency */}
            <BudgetSummary
              budget={itineraryData.budget}
              travellers={lastSubmittedInput?.travellers || 1}
              onOpenOptimizer={() => {
                setOptimizationResult(null);
                setIsOptimizerOpen(true);
              }}
              isOptimizing={isOptimizing}
            />

            {/* Day-by-Day Itinerary Display */}
            <ItineraryDisplay data={itineraryData} />
          </div>
        )}
      </main>

      {/* Smart Budget Optimizer Modal */}
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} TripGenie AI — Personalized AI Travel Planner.</p>
          <p className="mt-1 text-slate-400">
            Powered by Gemini AI. Travel safely and confirm bookings independently.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;

