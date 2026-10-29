import { Request, Response, NextFunction } from 'express';
import { ItineraryRequest } from '../schemas/itineraryRequest';
import { OptimizeBudgetRequest } from '../schemas/budgetSchema';
import { aiService, AiServiceError } from '../services/aiService';
import { budgetService } from '../services/budgetService';
import { budgetOptimizerService } from '../services/budgetOptimizerService';

/**
 * Generates an itinerary using Gemini and calculates its budget using backend code.
 */
export const generateItinerary = async (
  req: Request<Record<string, never>, Record<string, never>, ItineraryRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const itinerary = await aiService.generateItinerary(req.body);

    // Calculate budget deterministically on server
    const budget = budgetService.calculateBudget(
      itinerary,
      req.body.budget,
      req.body.travellers
    );

    res.status(200).json({
      success: true,
      message: 'Itinerary generated successfully',
      data: {
        trip: itinerary.trip,
        days: itinerary.days,
        budget,
        notes: itinerary.notes,
      },
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

/**
 * Proposes a lower-cost itinerary alternative and recalculates all revised expenses.
 */
export const optimizeBudget = async (
  req: Request<Record<string, never>, Record<string, never>, OptimizeBudgetRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await budgetOptimizerService.optimizeBudget(req.body);

    res.status(200).json({
      success: true,
      message: 'Budget optimization completed',
      data: result,
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
