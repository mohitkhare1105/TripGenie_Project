import { Request, Response, NextFunction } from 'express';
import { ItineraryRequest } from '../schemas/itineraryRequest';

/**
 * Controller placeholder for generating itineraries.
 * Receives validated and normalized ItineraryRequest data from validateBody middleware.
 * Full AI generation will be integrated in Part 3.
 */
export const generateItinerary = async (
  req: Request<Record<string, never>, Record<string, never>, ItineraryRequest>,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // Validated and normalized travel preferences are available on req.body
  res.status(200).json({
    success: true,
    message: 'Itinerary generation endpoint is configured',
    data: null,
  });
};
