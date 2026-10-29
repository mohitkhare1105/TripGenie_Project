import { Router } from 'express';
import {
  generateItinerary,
  optimizeBudget,
} from '../controllers/itineraryController';
import { validateBody } from '../middleware/validateRequest';
import { itineraryRequestSchema } from '../schemas/itineraryRequest';
import { optimizeBudgetRequestSchema } from '../schemas/budgetSchema';

const router = Router();

// POST /api/itineraries/generate - Generates itinerary and calculates budget breakdown
router.post('/generate', validateBody(itineraryRequestSchema), generateItinerary);

// POST /api/itineraries/optimize-budget - Proposes lower-cost itinerary alternatives
router.post(
  '/optimize-budget',
  validateBody(optimizeBudgetRequestSchema),
  optimizeBudget
);

export default router;
