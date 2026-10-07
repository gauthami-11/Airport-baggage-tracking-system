import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.ts';
import { getIncidents, createIncident } from '../services/incidentService.ts';
import { IncidentType } from '../types/index.ts';

export async function getIncidentsHandler(req: Request, res: Response) {
  try {
    const status = req.query.status as string;
    const incidents = await getIncidents(status);
    return res.status(200).json(incidents);
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    return res.status(500).json({ message: 'Failed to retrieve incidents list.' });
  }
}

export async function createIncidentHandler(req: AuthRequest, res: Response) {
  try {
    const { baggageTag, type, description } = req.body;

    if (!baggageTag) {
      return res.status(400).json({ message: 'Baggage tag is required.' });
    }

    if (!type) {
      return res.status(400).json({ message: 'Incident type is required.' });
    }

    if (!description) {
      return res.status(400).json({ message: 'Description is required.' });
    }

    const reporterId = req.user?.id || 1; // Default to Staff id 1 if testing without token

    const incident = await createIncident(
      baggageTag,
      reporterId,
      type as IncidentType,
      description
    );

    return res.status(201).json({
      message: 'Incident reported successfully.',
      incident
    });
  } catch (error: any) {
    console.error('Error reporting incident:', error);
    const statusCode = error.message.includes('No baggage found') ? 404 : 400;
    return res.status(statusCode).json({ message: error.message || 'Failed to report incident.' });
  }
}
