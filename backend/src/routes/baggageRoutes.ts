import { Router } from 'express';
import {
  getBaggageByTagHandler,
  getAllBaggageHandler,
  getStatisticsHandler
} from '../controllers/baggageController.ts';
import {
  getMovementsHandler,
  addMovementHandler
} from '../controllers/movementController.ts';
import { requireStaff } from '../middleware/authMiddleware.ts';

const router = Router();

// Staff statistics - mounted before /:tagNumber
router.get('/statistics', getStatisticsHandler);

// Staff list of baggage
router.get('/', getAllBaggageHandler);

// Public track movements
router.get('/:tagNumber/movements', getMovementsHandler);

// Staff update baggage status (transaction)
router.post('/:tagNumber/movements', addMovementHandler);

// Public track baggage info
router.get('/:tagNumber', getBaggageByTagHandler);

export default router;
