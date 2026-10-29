import { Request, Response, NextFunction } from 'express';

/**
 * Controller placeholder for generating itineraries.
 * Full AI generation will be integrated in Part 3.
 */
export const generateItinerary = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Itinerary generation endpoint is configured',
    data: null,
  });
};

