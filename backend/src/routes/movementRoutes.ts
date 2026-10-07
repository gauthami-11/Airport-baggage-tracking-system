import { Router } from 'express';
import { getMovementsHandler, addMovementHandler } from '../controllers/movementController.ts';

const router = Router();

router.get('/:tagNumber', getMovementsHandler);
router.post('/:tagNumber', addMovementHandler);

export default router;
