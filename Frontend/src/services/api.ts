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
import { getValidAccessToken } from './supabase';

function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:8000';
  }
  return 'https://tripgenie-project.onrender.com';
}

const API_BASE_URL = resolveApiBaseUrl();

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
 * Builds HTTP request headers with Content-Type and verified Supabase Bearer token.
 * Retrieves token directly from the Supabase client session without manual localStorage scanning.
 */
async function buildHeaders(overrideToken?: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = overrideToken || (await getValidAccessToken());
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
 * Generates an itinerary with deterministic budget calculation via FastAPI backend.
 * Public endpoint: works for guests without authentication, or links to user profile if signed in.
 */
export async function generateItinerary(
  input: ItineraryFormInput,
  authToken?: string
): Promise<ItineraryData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const headers = await buildHeaders(authToken);
    let res = await fetch(`${API_BASE_URL}/api/itineraries/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    // If an invalid or unconfirmed session token was rejected with 401 on this public endpoint,
    // seamlessly retry as a guest so the user is never blocked from generating an itinerary.
    if (res.status === 401 && headers['Authorization']) {
      console.warn('Session token rejected on public endpoint. Retrying as guest...');
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
 * Proposes lower-cost itinerary alternatives via FastAPI Smart Budget Optimizer.
 * Public endpoint: works for guests without authentication.
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
    const headers = await buildHeaders(authToken);
    let res = await fetch(`${API_BASE_URL}/api/itineraries/optimize-budget`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    if (res.status === 401 && headers['Authorization']) {
      console.warn('Session token rejected on public budget optimizer. Retrying as guest...');
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
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
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
    return { query: destination, images: [] };
  }
}

/**
 * Saves a generated trip itinerary to Supabase via FastAPI backend.
 * Protected endpoint: requires a valid Supabase authenticated session.
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
  const token = authToken || (await getValidAccessToken());
  if (!token) {
    throw new ApiError('Authentication required. Please sign in to save your trip.', 401);
  }

  const res = await fetch(`${API_BASE_URL}/api/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json: ApiResponse<SavedTripRecord> = await res.json().catch(() => ({
    success: false,
    message: 'Invalid response from server',
    data: null,
  }));

  if (!res.ok || !json.success || !json.data) {
    if (res.status === 401) {
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
    throw new ApiError(json.message || 'Failed to save trip', res.status);
  }

  return json.data;
}

/**
 * Fetches all saved trips for the authenticated user from Supabase.
 * Protected endpoint: requires a valid Supabase authenticated session.
 */
export async function fetchUserTrips(
  authToken?: string,
  limit: number = 50,
  offset: number = 0
): Promise<TripListResult> {
  const token = authToken || (await getValidAccessToken());
  if (!token) {
    throw new ApiError('Authentication required. Please sign in to view your trips.', 401);
  }

  const res = await fetch(`${API_BASE_URL}/api/trips?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
    throw new ApiError('Failed to fetch saved trips', res.status);
  }

  const json: ApiResponse<TripListResult> = await res.json();
  if (json.success && json.data) {
    return json.data;
  }
  return { items: [], total: 0 };
}

/**
 * Deletes a saved trip by ID.
 * Protected endpoint: requires a valid Supabase authenticated session.
 */
export async function deleteUserTrip(tripId: string, authToken?: string): Promise<void> {
  const token = authToken || (await getValidAccessToken());
  if (!token) {
    throw new ApiError('Authentication required. Please sign in to delete trips.', 401);
  }

  const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
    throw new ApiError('Failed to delete trip', res.status);
  }
}

/**
 * Retrieves the current user's profile from Supabase via FastAPI backend.
 * Protected endpoint: requires a valid Supabase authenticated session.
 */
export async function fetchUserProfile(authToken?: string): Promise<UserProfileData | null> {
  const token = authToken || (await getValidAccessToken());
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;
    const json: ApiResponse<UserProfileData> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}
