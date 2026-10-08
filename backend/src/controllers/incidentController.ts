import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.ts';
import { query, loadStore, saveStore } from '../config/database.ts';
import { Incident, IncidentType } from '../types/index.ts';
import { getBaggageByTag } from './baggageController.ts';

const VALID_INCIDENT_TYPES: IncidentType[] = [
  'DAMAGED BAGGAGE',
  'DELAYED',
  'MISSING',
  'WRONG DESTINATION',
  'SECURITY ISSUE',
  'OTHER'
];

// GET /api/incidents
export async function getIncidentsHandler(req: Request, res: Response) {
  try {
    const status = req.query.status as string;
    const sql = `
      SELECT 
        i.id,
        i.baggage_id,
        i.reported_by,
        i.type,
        i.description,
        i.status,
        i.created_at,
        i.updated_at,
        b.tag_number,
        u.name AS reporter_name,
        u.email AS reporter_email
      FROM incidents i
      JOIN baggage b ON i.baggage_id = b.id
      JOIN users u ON i.reported_by = u.id
      ORDER BY i.created_at DESC
    `;
    let incidents = await query<Incident[]>(sql);

    if (status && status !== 'ALL') {
      incidents = incidents.filter(i => i.status.toUpperCase() === status.toUpperCase());
    }

    return res.status(200).json(incidents);
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    return res.status(500).json({ message: 'Failed to retrieve incidents list.' });
  }
}

// POST /api/incidents
export async function createIncidentHandler(req: AuthRequest, res: Response) {
  try {
    const { baggageTag, type, description } = req.body;

    if (!baggageTag || !baggageTag.trim()) {
      return res.status(400).json({ message: 'Baggage tag is required.' });
    }
    if (!type) {
      return res.status(400).json({ message: 'Incident type is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required.' });
    }

    const normalizedType = type.toUpperCase() as IncidentType;
    if (!VALID_INCIDENT_TYPES.includes(normalizedType)) {
      return res.status(400).json({ message: `Invalid incident type. Must be one of: ${VALID_INCIDENT_TYPES.join(', ')}` });
    }

    // 1. Validate baggage exists
    const baggage = await getBaggageByTag(baggageTag);
    if (!baggage) {
      return res.status(404).json({ message: `No baggage found for tag number: ${baggageTag}` });
    }

    const reporterId = req.user?.id || 1;
    const store = loadStore();
    const reporter = store.users.find(u => u.id === reporterId);

    const now = new Date().toISOString();
    const newId = (store.incidents.length > 0 ? Math.max(...store.incidents.map(i => i.id || 0)) : 0) + 1;

    const newIncident: Incident = {
      id: newId,
      baggage_id: baggage.id,
      reported_by: reporterId,
      type: normalizedType,
      description: description.trim(),
      status: 'OPEN',
      created_at: now,
      updated_at: now,
      tag_number: baggage.tag_number,
      reporter_name: reporter?.name || 'Airport Staff',
      reporter_email: reporter?.email || 'staff@baggagetrack.com'
    };

    await query(
      `INSERT INTO incidents (baggage_id, reported_by, type, description, status) VALUES (?, ?, ?, ?, 'OPEN')`,
      [baggage.id, reporterId, normalizedType, description.trim()]
    );

    store.incidents.unshift(newIncident);
    saveStore();

    return res.status(201).json({
      message: 'Incident reported successfully.',
      incident: newIncident
    });
  } catch (error: any) {
    console.error('Error reporting incident:', error);
    return res.status(500).json({ message: error.message || 'Failed to report incident.' });
  }
}
