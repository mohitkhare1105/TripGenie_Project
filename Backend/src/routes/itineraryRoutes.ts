import { Router } from 'express';
import { generateItinerary } from '../controllers/itineraryController';
import { validateBody } from '../middleware/validateRequest';
import { itineraryRequestSchema } from '../schemas/itineraryRequest';

const router = Router();

// POST /api/itineraries/generate - Validates request body before invoking controller
router.post('/generate', validateBody(itineraryRequestSchema), generateItinerary);

export default router;
