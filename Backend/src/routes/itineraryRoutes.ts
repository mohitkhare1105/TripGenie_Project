import { Router } from 'express';
import { generateItinerary } from '../controllers/itineraryController';

const router = Router();

// POST /api/itineraries/generate
router.post('/generate', generateItinerary);

export default router;

