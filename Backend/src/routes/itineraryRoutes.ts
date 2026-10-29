import { Router } from 'express';
import {
  generateItinerary,
  optimizeBudget,
} from '../controllers/itineraryController';
import { validateBody } from '../middleware/validateRequest';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { preventConcurrentDuplicates } from '../middleware/duplicateRequestPrevention';
import { itineraryRequestSchema } from '../schemas/itineraryRequest';
import { optimizeBudgetRequestSchema } from '../schemas/budgetSchema';

const router = Router();

// POST /api/itineraries/generate
router.post(
  '/generate',
  apiRateLimiter,
  preventConcurrentDuplicates,
  validateBody(itineraryRequestSchema),
  generateItinerary
);

// POST /api/itineraries/optimize-budget
router.post(
  '/optimize-budget',
  apiRateLimiter,
  preventConcurrentDuplicates,
  validateBody(optimizeBudgetRequestSchema),
  optimizeBudget
);

export default router;
