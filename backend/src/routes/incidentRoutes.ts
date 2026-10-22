import { Router } from 'express';
import { getIncidentsHandler, createIncidentHandler } from '../controllers/incidentController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';

const router = Router();

router.get('/', getIncidentsHandler);
router.post('/', authenticateToken, createIncidentHandler);

export default router;
