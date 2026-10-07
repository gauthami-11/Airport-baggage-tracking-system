import { Router } from 'express';
import { getIncidentsHandler, createIncidentHandler } from '../controllers/incidentController.ts';

const router = Router();

router.get('/', getIncidentsHandler);
router.post('/', createIncidentHandler);

export default router;
