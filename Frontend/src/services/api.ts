import {
  ItineraryFormInput,
  ApiResponse,
  ItineraryData,
  OptimizeBudgetResponseData,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:5000';

export class ApiError extends Error {
  public statusCode: number;
  public errors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode: number = 500,
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Health check ping
 */
export async function checkBackendHealth(): Promise<{ status: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data || { status: 'healthy' };
  } catch (err: unknown) {
    throw new ApiError('Unable to connect to the TripGenie AI server.', 503);
  }
}

/**
 * Generates an itinerary with budget calculation
 */
export async function generateItinerary(
  input: ItineraryFormInput
): Promise<ItineraryData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/itineraries/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    const json: ApiResponse<ItineraryData> = await res.json().catch(() => ({
      success: false,
      message: 'Invalid response from server',
      data: null,
    }));

    if (!res.ok || !json.success || !json.data) {
      throw new ApiError(
        json.message || 'Failed to generate itinerary',
        res.status,
        json.errors
      );
    }

    return json.data;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError(
        'Request timed out. The AI model is taking longer than expected. Please try again.',
        504
      );
    }
    throw new ApiError(
      'Network error. Please ensure the backend server is running and accessible.',
      503
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Proposes lower-cost itinerary alternatives
 */
export async function optimizeBudget(params: {
  itinerary: {
    trip: { destination: string; durationDays: number; currency: string };
    days: unknown[];
    notes: string[];
  };
  userBudget: number;
  travellers: number;
  travelStyle?: string;
  interests?: string[];
}): Promise<OptimizeBudgetResponseData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/itineraries/optimize-budget`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    const json: ApiResponse<OptimizeBudgetResponseData> = await res
      .json()
      .catch(() => ({
        success: false,
        message: 'Invalid response from server',
        data: null,
      }));

    if (!res.ok || !json.success || !json.data) {
      throw new ApiError(
        json.message || 'Failed to optimize budget',
        res.status,
        json.errors
      );
    }

    return json.data;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError(
        'Budget optimization timed out. Please try again.',
        504
      );
    }
    throw new ApiError(
      'Network error while connecting to optimization service.',
      503
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

