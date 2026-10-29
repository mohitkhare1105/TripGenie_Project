import { Request, Response, NextFunction } from 'express';
import { ItineraryRequest } from '../schemas/itineraryRequest';
import { aiService, AiServiceError } from '../services/aiService';

/**
 * Generates a personalized itinerary using the Gemini AI service.
 * Coordinates validated request preferences, AI invocation, and formatted response.
 */
export const generateItinerary = async (
  req: Request<Record<string, never>, Record<string, never>, ItineraryRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const itinerary = await aiService.generateItinerary(req.body);

    res.status(200).json({
      success: true,
      message: 'Itinerary generated successfully',
      data: itinerary,
    });
  } catch (err: unknown) {
    if (err instanceof AiServiceError) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message,
        data: null,
      });
      return;
    }

    next(err);
  }
};
