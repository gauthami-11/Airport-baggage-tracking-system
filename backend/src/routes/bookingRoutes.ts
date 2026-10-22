import { Router } from 'express';
import { getBaggageByPNRHandler } from '../controllers/baggageController.ts';

const router = Router();

// GET /api/bookings/:pnrNumber/baggage
router.get('/:pnrNumber/baggage', getBaggageByPNRHandler);

export default router;
