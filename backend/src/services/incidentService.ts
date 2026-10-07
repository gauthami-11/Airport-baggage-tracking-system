import { query, loadStore, saveStore } from '../config/database.ts';
import { Incident, IncidentType, IncidentStatus } from '../types/index.ts';
import { getBaggageByTag } from './baggageService.ts';

const VALID_INCIDENT_TYPES: IncidentType[] = [
  'DAMAGED BAGGAGE',
  'DELAYED',
  'MISSING',
  'WRONG DESTINATION',
  'SECURITY ISSUE',
  'OTHER'
];

export async function getIncidents(statusFilter?: string): Promise<Incident[]> {
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

  if (statusFilter && statusFilter !== 'ALL') {
    incidents = incidents.filter(i => i.status.toUpperCase() === statusFilter.toUpperCase());
  }

  return incidents;
}

export async function createIncident(
  baggageTag: string,
  reportedByUserId: number,
  type: IncidentType,
  description: string
): Promise<Incident> {
  if (!baggageTag || baggageTag.trim() === '') {
    throw new Error('Baggage tag is required.');
  }

  if (!description || description.trim() === '') {
    throw new Error('Description is required.');
  }

  const normalizedType = type.toUpperCase() as IncidentType;
  if (!VALID_INCIDENT_TYPES.includes(normalizedType)) {
    throw new Error(`Invalid incident type. Must be one of: ${VALID_INCIDENT_TYPES.join(', ')}`);
  }

  // 1. Validate baggage exists
  const baggage = await getBaggageByTag(baggageTag);
  if (!baggage) {
    throw new Error(`No baggage found for tag number: ${baggageTag}`);
  }

  const store = loadStore();
  const reporter = store.users.find(u => u.id === reportedByUserId);

  const now = new Date().toISOString();
  const newId = (store.incidents.length > 0 ? Math.max(...store.incidents.map(i => i.id || 0)) : 0) + 1;

  const newIncident: Incident = {
    id: newId,
    baggage_id: baggage.id,
    reported_by: reportedByUserId,
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
    [baggage.id, reportedByUserId, normalizedType, description.trim()]
  );

  store.incidents.unshift(newIncident);
  saveStore();

  return newIncident;
}
