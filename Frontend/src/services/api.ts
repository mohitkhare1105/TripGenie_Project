import {
  ItineraryFormInput,
  ApiResponse,
  ItineraryData,
  OptimizeBudgetResponseData,
  DestinationImagesData,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:8000';

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
 * Retrieves the Supabase authentication access token if available in browser storage.
 * Inspects explicit keys as well as the standard Supabase Auth SDK session cache (sb-<ref>-auth-token).
 */
export function getAuthToken(): string | null {
  try {
    // Check direct storage keys
    const directToken =
      localStorage.getItem('supabase_token') ||
      localStorage.getItem('sb-access-token') ||
      sessionStorage.getItem('supabase_token') ||
      sessionStorage.getItem('sb-access-token');

    if (directToken) return directToken;

    // Scan localStorage for Supabase JS SDK session keys (e.g. sb-xyz-auth-token)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        if (item?.access_token) return item.access_token;
      }
    }
  } catch {
    // Gracefully handle storage access restrictions or JSON parse errors
  }
  return null;
}

/**
 * Builds HTTP request headers with Content-Type and optional Supabase Bearer token.
 */
function buildHeaders(overrideToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = overrideToken || getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
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
  } catch {
    throw new ApiError('Unable to connect to the TripGenie AI server.', 503);
  }
}

/**
 * Generates an itinerary with deterministic budget calculation via FastAPI backend
 */
export async function generateItinerary(
  input: ItineraryFormInput,
  authToken?: string
): Promise<ItineraryData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/itineraries/generate`, {
      method: 'POST',
      headers: buildHeaders(authToken),
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
 * Proposes lower-cost itinerary alternatives via FastAPI Smart Budget Optimizer
 */
export async function optimizeBudget(
  params: {
    itinerary: {
      trip: { destination: string; durationDays: number; currency: string };
      days: unknown[];
      notes: string[];
    };
    userBudget: number;
    travellers: number;
    travelStyle?: string;
    interests?: string[];
  },
  authToken?: string
): Promise<OptimizeBudgetResponseData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/itineraries/optimize-budget`, {
      method: 'POST',
      headers: buildHeaders(authToken),
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

/**
 * Fetches destination images through the FastAPI backend Unsplash service.
 * The Unsplash API key remains safely server-side.
 */
export async function fetchDestinationImages(
  destination: string,
  count: number = 4
): Promise<DestinationImagesData> {
  try {
    const encodedDest = encodeURIComponent(destination.trim());
    const res = await fetch(
      `${API_BASE_URL}/api/images/destination?query=${encodedDest}&count=${count}`,
      {
        method: 'GET',
        headers: buildHeaders(),
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json: ApiResponse<DestinationImagesData> = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return { query: destination, images: [] };
  } catch {
    // Non-fatal: if images fail, return empty list without disrupting itinerary view
    return { query: destination, images: [] };
  }
}
