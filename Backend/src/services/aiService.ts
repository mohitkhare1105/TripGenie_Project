import { GoogleGenAI } from '@google/genai';
import { ItineraryRequest } from '../schemas/itineraryRequest';
import {
  ItineraryResponse,
  itineraryResponseSchema,
} from '../schemas/itineraryResponse';
import { buildItineraryPrompt } from '../utils/promptBuilder';

export class AiServiceError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'AiServiceError';
    this.statusCode = statusCode;
  }
}

export type ContentGenerator = (params: {
  model: string;
  contents: string;
  config?: {
    systemInstruction?: string;
    responseMimeType?: string;
  };
}) => Promise<{ text?: string | null }>;

/**
 * Service for communicating with Gemini AI to generate structured itineraries.
 */
export class AiService {
  private client: GoogleGenAI | null = null;
  private customGenerator?: ContentGenerator;
  private model: string;
  private timeoutMs: number;

  constructor(options?: {
    client?: GoogleGenAI;
    customGenerator?: ContentGenerator;
    model?: string;
    timeoutMs?: number;
  }) {
    if (options?.customGenerator) {
      this.customGenerator = options.customGenerator;
    } else if (options?.client) {
      this.client = options.client;
    }
    this.model = options?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.timeoutMs = options?.timeoutMs || 30000;
  }

  /**
   * Sets or clears a custom generator for mocking during tests.
   */
  public setCustomGenerator(generator?: ContentGenerator): void {
    this.customGenerator = generator;
  }

  /**
   * Initializes the GoogleGenAI client if not already initialized.
   * Throws 503 if GEMINI_API_KEY is not configured.
   */
  private getClient(): GoogleGenAI {
    if (this.client) {
      return this.client;
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new AiServiceError(
        'Gemini API key is not configured on the server',
        503
      );
    }

    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  /**
   * Calls the Gemini API with bounded timeout.
   */
  private async callProvider(
    contents: string,
    systemInstruction?: string
  ): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        const error = new Error('Gemini API request timed out');
        error.name = 'TimeoutError';
        reject(error);
      }, this.timeoutMs);
      if (typeof timer.unref === 'function') timer.unref();
    });

    try {
      let callPromise: Promise<{ text?: string | null }>;

      if (this.customGenerator) {
        callPromise = this.customGenerator({
          model: this.model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
      } else {
        const client = this.getClient();
        callPromise = client.models.generateContent({
          model: this.model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
      }

      const response = await Promise.race([callPromise, timeoutPromise]);
      const text = response.text?.trim();

      if (!text) {
        throw new AiServiceError('Received empty response from AI model', 502);
      }

      return text;
    } catch (err: unknown) {
      if (err instanceof AiServiceError) {
        throw err;
      }
      this.mapProviderError(err);
      throw new AiServiceError(
        'An unexpected error occurred while communicating with the AI service',
        500
      );
    }
  }

  /**
   * Maps provider errors to appropriate HTTP status codes and safe messages.
   */
  private mapProviderError(err: unknown): never {
    const errorObj = err as Record<string, unknown> | undefined;
    const message = typeof errorObj?.['message'] === 'string' ? errorObj['message'] : '';
    const status = typeof errorObj?.['status'] === 'number' ? errorObj['status'] : undefined;

    // Timeout
    if (errorObj?.['name'] === 'TimeoutError' || message.includes('timed out')) {
      throw new AiServiceError(
        'AI service request timed out. Please try again.',
        504
      );
    }

    // Rate Limit / Quota
    if (
      status === 429 ||
      message.includes('429') ||
      message.includes('ResourceExhausted') ||
      message.toLowerCase().includes('quota') ||
      message.toLowerCase().includes('rate limit')
    ) {
      throw new AiServiceError(
        'Travel itinerary service is temporarily busy. Please try again shortly.',
        429
      );
    }

    // Network / Unavailable
    if (
      status === 503 ||
      message.includes('503') ||
      message.includes('UNAVAILABLE') ||
      message.includes('ENOTFOUND') ||
      message.includes('ECONNREFUSED')
    ) {
      throw new AiServiceError(
        'AI service is temporarily unavailable. Please try again later.',
        503
      );
    }

    // Invalid model
    if (status === 404 || message.includes('models/') || message.includes('not found')) {
      throw new AiServiceError(
        'Configured AI model is unavailable or unsupported.',
        503
      );
    }

    // Default upstream error
    throw new AiServiceError(
      'Unable to generate the itinerary at this time',
      502
    );
  }

  /**
   * Parses JSON string, stripping any accidental markdown wrappers if present.
   */
  private parseJsonText(rawText: string): unknown {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      throw new AiServiceError(
        'Malformed JSON returned by AI provider',
        502
      );
    }
  }

  /**
   * Main entry point: Generates, parses, and validates an itinerary from user preferences.
   * Performs at most ONE bounded repair attempt if initial response is invalid.
   */
  public async generateItinerary(
    request: ItineraryRequest
  ): Promise<ItineraryResponse> {
    const prompt = buildItineraryPrompt(request);
    let rawText = await this.callProvider(prompt.userPrompt, prompt.systemInstruction);

    let parsedJson: unknown;
    let validationResult;

    try {
      parsedJson = this.parseJsonText(rawText);
      validationResult = itineraryResponseSchema.safeParse(parsedJson);
    } catch (parseErr) {
      // JSON parse error triggers the bounded repair attempt
      validationResult = { success: false as const, error: parseErr };
    }

    // Check if initial output meets schema and duration requirements
    if (
      validationResult.success &&
      validationResult.data.trip.durationDays === request.durationDays &&
      validationResult.data.days.length === request.durationDays
    ) {
      return validationResult.data;
    }

    // Bounded Repair Attempt (at most ONE attempt)
    const issueSummary = !validationResult.success
      ? (validationResult as { error: unknown }).error instanceof Error
        ? ((validationResult as { error: unknown }).error as Error).message
        : JSON.stringify(validationResult)
      : `Number of days (${(parsedJson as { days?: unknown[] })?.days?.length}) does not match requested duration (${request.durationDays})`;

    const repairPrompt = `Your previous JSON response was invalid or did not match the required schema:
Issues: ${issueSummary}

Please regenerate the complete, strictly valid JSON for a ${request.durationDays}-day trip to ${request.destination} with EXACTLY ${request.durationDays} day objects in the "days" array. Do not include markdown or explanations.`;

    rawText = await this.callProvider(repairPrompt, prompt.systemInstruction);
    parsedJson = this.parseJsonText(rawText);
    const secondValidation = itineraryResponseSchema.safeParse(parsedJson);

    if (
      !secondValidation.success ||
      secondValidation.data.trip.durationDays !== request.durationDays ||
      secondValidation.data.days.length !== request.durationDays
    ) {
      throw new AiServiceError(
        'Upstream AI provider failed to return a valid itinerary structure after repair attempt',
        502
      );
    }

    return secondValidation.data;
  }
}

export const aiService = new AiService();
