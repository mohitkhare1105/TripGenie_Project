import React from 'react';
import {
  BudgetBreakdown,
  CategoryTotals,
} from '../types';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Car,
  Home,
  Utensils,
  Ticket,
  ShoppingBag,
  Layers,
} from 'lucide-react';

interface BudgetSummaryProps {
  budget: BudgetBreakdown;
  travellers: number;
  onOpenOptimizer?: () => void;
  isOptimizing?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  transport: <Car className="w-4 h-4 text-blue-500" />,
  accommodation: <Home className="w-4 h-4 text-purple-500" />,
  food: <Utensils className="w-4 h-4 text-amber-500" />,
  activities: <Ticket className="w-4 h-4 text-emerald-500" />,
  shopping: <ShoppingBag className="w-4 h-4 text-pink-500" />,
  miscellaneous: <Layers className="w-4 h-4 text-slate-500" />,
};

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  budget,
  travellers,
  onOpenOptimizer,
  isOptimizing = false,
}) => {
  const isOverBudget = budget.status === 'over_budget';
  const isUnderBudget = budget.status === 'under_budget';

  const formatINR = (val: number) => `₹${Math.round(val).toLocaleString('en-IN')}`;

  const categoryEntries = Object.entries(budget.categoryTotals) as [
    keyof CategoryTotals,
    number
  ][];

  return (
    <div className="bg-white rounded-card border border-slate-200/90 shadow-md p-6 sm:p-10 mb-8">
      {/* Header and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <Wallet className="w-5 h-5 text-indigo-600 mr-2" />
              Budget Breakdown & Transparency
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isOverBudget
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : isUnderBudget
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {isOverBudget ? (
                <>
                  <TrendingUp className="w-3 h-3 mr-1" /> Over Budget
                </>
              ) : isUnderBudget ? (
                <>
                  <TrendingDown className="w-3 h-3 mr-1" /> Under Budget
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" /> Within Budget
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculated in server-side application code from validated estimates.
          </p>
        </div>

        {/* Optimizer CTA */}
        {onOpenOptimizer && (
          <button
            type="button"
            onClick={onOpenOptimizer}
            disabled={isOptimizing}
            className="inline-flex items-center px-5 py-2.5 rounded-btn text-xs font-bold bg-coral-pulse hover:bg-[#E02445] text-white shadow-md shadow-coral-pulse/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {isOverBudget ? 'Optimize to Fit Budget' : 'Smart Budget Optimizer'}
          </button>
        )}
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
          <span className="text-xs text-slate-500 font-medium">Estimated Total</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {formatINR(budget.estimatedTotal)}
          </p>
          <span className="text-[10px] text-slate-400">Total for all {travellers} travellers</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
          <span className="text-xs text-slate-500 font-medium">Your Target Budget</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {formatINR(budget.userBudget)}
          </p>
          <span className="text-[10px] text-slate-400">Specified group limit</span>
        </div>

        <div
          className={`rounded-xl p-4 border ${
            isOverBudget
              ? 'bg-rose-50 border-rose-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <span
            className={`text-xs font-medium ${
              isOverBudget ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {isOverBudget ? 'Exceeds Budget By' : 'Remaining Budget'}
          </span>
          <p
            className={`text-xl font-extrabold mt-1 ${
              isOverBudget ? 'text-rose-900' : 'text-emerald-900'
            }`}
          >
            {formatINR(Math.abs(budget.difference))}
          </p>
          <span
            className={`text-[10px] ${
              isOverBudget ? 'text-rose-500' : 'text-emerald-500'
            }`}
          >
            {isOverBudget ? 'Needs optimization' : 'Under target limit'}
          </span>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
          <span className="text-xs text-slate-500 font-medium">Per Person Estimate</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {formatINR(budget.estimatedPerPerson)}
          </p>
          <span className="text-[10px] text-slate-400">Approx. per traveller</span>
        </div>
      </div>

      {/* Warning Alert if Over Budget or Incomplete */}
      {budget.warning && (
        <div
          className={`rounded-xl p-4 mb-6 border text-xs flex items-start ${
            isOverBudget
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <AlertTriangle
            className={`w-4 h-4 mr-2.5 mt-0.5 flex-shrink-0 ${
              isOverBudget ? 'text-amber-600' : 'text-slate-500'
            }`}
          />
          <div>
            <span className="font-semibold">{budget.warning}</span>
          </div>
        </div>
      )}

      {/* Category Level Breakdown */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Category Expenses
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categoryEntries.map(([catKey, total]) => {
            const percentage =
              budget.estimatedTotal > 0
                ? Math.round((total / budget.estimatedTotal) * 100)
                : 0;

            return (
              <div
                key={catKey}
                className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-lg bg-slate-50">
                    {CATEGORY_ICONS[catKey]}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {percentage}%
                  </span>
                </div>
                <div className="capitalize text-xs font-medium text-slate-600">
                  {catKey}
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {total > 0 ? formatINR(total) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-[11px] text-slate-400">
        <HelpCircle className="w-3.5 h-3.5 mr-1" />
        Shared group accommodation is not multiplied per person. All prices are planning estimates.
      </div>
    </div>
  );
};

