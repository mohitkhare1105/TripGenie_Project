import React from 'react';
import {
  ItineraryData,
  OptimizeBudgetResponseData,
} from '../types';
import {
  Sparkles,
  X,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface BudgetOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOptimization: (optimizedData: ItineraryData) => void;
  isOptimizing: boolean;
  optimizationResult: OptimizeBudgetResponseData | null;
  currentData: ItineraryData;
  onTriggerOptimization: () => void;
}

export const BudgetOptimizerModal: React.FC<BudgetOptimizerModalProps> = ({
  isOpen,
  onClose,
  onApplyOptimization,
  isOptimizing,
  optimizationResult,
  currentData,
  onTriggerOptimization,
}) => {
  if (!isOpen) return null;

  const formatINR = (val: number) => `₹${Math.round(val).toLocaleString('en-IN')}`;

  const handleApply = () => {
    if (!optimizationResult) return;
    const updated: ItineraryData = {
      trip: optimizationResult.optimizedItinerary.trip,
      days: optimizationResult.optimizedItinerary.days,
      budget: optimizationResult.optimizedBudget,
      notes: optimizationResult.optimizedItinerary.notes,
    };
    onApplyOptimization(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-6 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Smart Budget Optimizer
              </h3>
              <p className="text-xs text-slate-500">
                AI-recommended alternatives to lower costs while keeping key interests.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Status / Trigger View */}
          {!optimizationResult && !isOptimizing && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Ready to optimize your trip expenses?
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto mb-6">
                TripGenie AI will review your current plan ({formatINR(currentData.budget.estimatedTotal)}) and propose high-value alternatives for transport, lodging, and activities toward your target of {formatINR(currentData.budget.userBudget)}.
              </p>
              <button
                type="button"
                onClick={onTriggerOptimization}
                className="inline-flex items-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Budget Optimization
              </button>
            </div>
          )}

          {/* Loading View */}
          {isOptimizing && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <h4 className="text-sm font-bold text-slate-900">
                Generating cost-effective alternatives...
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Recalculating revised totals in backend code.
              </p>
            </div>
          )}

          {/* Optimization Results View */}
          {optimizationResult && !isOptimizing && (
            <div className="space-y-6">
              {/* Comparison Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Original Cost</span>
                  <p className="text-base font-extrabold text-slate-900">
                    {formatINR(optimizationResult.originalBudget.estimatedTotal)}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Optimized Cost</span>
                  <p className="text-base font-extrabold text-indigo-600">
                    {formatINR(optimizationResult.optimizedBudget.estimatedTotal)}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center">
                    <TrendingDown className="w-3.5 h-3.5 mr-1" /> Estimated Savings
                  </span>
                  <p className="text-base font-extrabold text-emerald-700">
                    {formatINR(optimizationResult.savings)}
                  </p>
                </div>
              </div>

              {/* Status Note */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start ${
                  optimizationResult.achievedTarget
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {optimizationResult.achievedTarget ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold">
                    {optimizationResult.achievedTarget
                      ? 'Target budget achieved! The proposed itinerary fits within your budget.'
                      : `Expenses were reduced by ${formatINR(
                          optimizationResult.savings
                        )}, but still exceed the budget by ${formatINR(
                          Math.abs(optimizationResult.optimizedBudget.difference)
                        )}.`}
                  </span>
                </div>
              </div>

              {/* Trade-Offs & Adjustments */}
              {optimizationResult.tradeOffs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Key Adjustments & Trade-offs
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                    {optimizationResult.tradeOffs.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            {optimizationResult ? 'Keep Original Plan' : 'Close'}
          </button>

          {optimizationResult && !isOptimizing && (
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all"
            >
              Apply Optimized Itinerary
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

