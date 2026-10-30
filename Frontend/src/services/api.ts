import {
  ItineraryFormInput,
  ApiResponse,
  ItineraryData,
  OptimizeBudgetResponseData,
  DestinationImagesData,
  SavedTripRecord,
  TripListResult,
  UserProfileData,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'https://tripgenie-project.onrender.com';

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

function isValidJwt(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.trim().split('.');
  return parts.length === 3 && parts[0].startsWith('eyJ');
}

/**
 * Retrieves the Supabase authentication access token if available in browser storage.
 * Prioritizes the official Supabase Auth SDK session cache (sb-<ref>-auth-token),
 * and validates that the token has a valid 3-part JWT structure.
 */
export function getAuthToken(): string | null {
  try {
    // 1. Scan localStorage for Supabase JS SDK session keys (e.g. sb-xyz-auth-token)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        const token = item?.access_token;
        if (token && isValidJwt(token)) return token;
      }
    }

    // 2. Check direct storage keys
    const directToken =
      localStorage.getItem('supabase_token') ||
      localStorage.getItem('sb-access-token') ||
      sessionStorage.getItem('supabase_token') ||
      sessionStorage.getItem('sb-access-token');

    if (directToken && isValidJwt(directToken)) return directToken;
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
    let res = await fetch(`${API_BASE_URL}/api/itineraries/generate`, {
      method: 'POST',
      headers: buildHeaders(authToken),
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    // If an invalid or unconfirmed token was rejected with 401 on this public endpoint,
    // seamlessly retry as a guest so the user is never blocked.
    if (res.status === 401) {
      console.warn('Bearer token was rejected by backend. Retrying as guest...');
      localStorage.removeItem('supabase_token');
      localStorage.removeItem('supabase_auth_token');
      res = await fetch(`${API_BASE_URL}/api/itineraries/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
    }

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
    let res = await fetch(`${API_BASE_URL}/api/itineraries/optimize-budget`, {
      method: 'POST',
      headers: buildHeaders(authToken),
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    // If an invalid or unconfirmed token was rejected with 401 on this public endpoint,
    // seamlessly retry as a guest so the user is never blocked.
    if (res.status === 401) {
      console.warn('Bearer token was rejected by backend. Retrying as guest...');
      localStorage.removeItem('supabase_token');
      localStorage.removeItem('supabase_auth_token');
      res = await fetch(`${API_BASE_URL}/api/itineraries/optimize-budget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
    }

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

/**
 * Saves a generated trip itinerary to Supabase via FastAPI backend
 */
export async function saveUserTrip(
  payload: {
    destination: string;
    duration_days: number;
    budget: number;
    currency?: string;
    travellers: number;
    travel_style: string;
    starting_city?: string;
    travel_preferences?: Record<string, unknown>;
    itinerary_data: Record<string, unknown>;
    status?: string;
  },
  authToken?: string
): Promise<SavedTripRecord> {
  const token = authToken || getAuthToken();
  if (!token) {
    throw new ApiError('Authentication required. Please sign in to save your trip.', 401);
  }

  const res = await fetch(`${API_BASE_URL}/api/trips`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });

  const json: ApiResponse<SavedTripRecord> = await res.json().catch(() => ({
    success: false,
    message: 'Invalid response from server',
    data: null,
  }));

  if (!res.ok || !json.success || !json.data) {
    throw new ApiError(json.message || 'Failed to save trip', res.status);
  }

  return json.data;
}

/**
 * Fetches all saved trips for the authenticated user from Supabase
 */
export async function fetchUserTrips(
  authToken?: string,
  limit: number = 50,
  offset: number = 0
): Promise<TripListResult> {
  const token = authToken || getAuthToken();
  if (!token) {
    return { items: [], total: 0 };
  }

  const res = await fetch(`${API_BASE_URL}/api/trips?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (!res.ok) {
    throw new ApiError('Failed to fetch saved trips', res.status);
  }

  const json: ApiResponse<TripListResult> = await res.json();
  if (json.success && json.data) {
    return json.data;
  }
  return { items: [], total: 0 };
}

/**
 * Deletes a saved trip by ID
 */
export async function deleteUserTrip(tripId: string, authToken?: string): Promise<void> {
  const token = authToken || getAuthToken();
  if (!token) {
    throw new ApiError('Authentication required to delete trip', 401);
  }

  const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  });

  if (!res.ok) {
    throw new ApiError('Failed to delete trip', res.status);
  }
}

/**
 * Retrieves the current user's profile from Supabase via FastAPI backend
 */
export async function fetchUserProfile(authToken?: string): Promise<UserProfileData | null> {
  const token = authToken || getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'GET',
      headers: buildHeaders(token),
    });

    if (!res.ok) return null;
    const json: ApiResponse<UserProfileData> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}
