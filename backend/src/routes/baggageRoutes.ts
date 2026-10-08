import { Router } from 'express';
import {
  getBaggageByTagHandler,
  getAllBaggageHandler,
  getStatisticsHandler,
  getMovementsHandler,
  addMovementHandler
} from '../controllers/baggageController.ts';

const router = Router();

// Staff statistics
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
