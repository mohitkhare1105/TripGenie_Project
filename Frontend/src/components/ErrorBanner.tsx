import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  fieldErrors?: Array<{ field: string; message: string }>;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  fieldErrors,
  onRetry,
  onDismiss,
}) => {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6 shadow-sm">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800">
            {message}
          </h3>

          {fieldErrors && fieldErrors.length > 0 && (
            <ul className="mt-2 text-xs text-red-700 list-disc list-inside space-y-1">
              {fieldErrors.map((err, idx) => (
                <li key={idx}>
                  <strong className="capitalize">{err.field}:</strong> {err.message}
                </li>
              ))}
            </ul>
          )}

          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Retry Request
              </button>
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 ml-3"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

