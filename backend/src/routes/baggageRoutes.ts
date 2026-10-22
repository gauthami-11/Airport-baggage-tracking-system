import { Router } from 'express';
import {
  getBaggageByTagHandler,
  getAllBaggageHandler,
  getStatisticsHandler,
  getMovementsHandler,
  addMovementHandler,
  registerBaggageHandler
} from '../controllers/baggageController.ts';
import { requireStaff } from '../middleware/authMiddleware.ts';

const router = Router();

// Staff statistics
router.get('/statistics', getStatisticsHandler);

// Staff list of baggage
router.get('/', getAllBaggageHandler);

// Staff register new baggage
router.post('/', requireStaff, registerBaggageHandler);

// Public track movements
router.get('/:tagNumber/movements', getMovementsHandler);

// Staff update baggage status (transaction)
router.post('/:tagNumber/movements', addMovementHandler);

// Public track baggage info
router.get('/:tagNumber', getBaggageByTagHandler);

export default router;
