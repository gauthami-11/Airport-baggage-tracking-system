import { beginTransaction, query, loadStore, saveStore } from '../config/database.ts';
import { BaggageMovement, BaggageStatus } from '../types/index.ts';
import { getBaggageByTag } from './baggageService.ts';

const VALID_STATUSES: BaggageStatus[] = [
  'CHECKED IN',
  'SECURITY',
  'SORTED',
  'LOADED',
  'IN TRANSIT',
  'ARRIVED',
  'DELAYED',
  'MISSING',
  'CLAIMED'
];

export async function getMovementsByTag(tagNumber: string): Promise<BaggageMovement[]> {
  const baggage = await getBaggageByTag(tagNumber);
  if (!baggage) {
    return [];
  }

  const sql = `
    SELECT 
      id,
      baggage_id,
      timestamp,
      status,
      location,
      remarks,
      created_at
    FROM baggage_movements
    WHERE baggage_id = ?
    ORDER BY id ASC
  `;
  const movements = await query<BaggageMovement[]>(sql, [baggage.id]);
  return movements;
}

export async function addMovementWithStatusUpdate(
  tagNumber: string,
  newStatus: BaggageStatus,
  location: string,
  remarks: string = ''
) {
  // Validate status
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid baggage status: "${newStatus}". Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (!location || location.trim() === '') {
    throw new Error('Location is required.');
  }

  const tx = await beginTransaction();

  try {
    // 1. Find baggage
    const baggage = await getBaggageByTag(tagNumber);
    if (!baggage) {
      throw new Error(`No baggage found for this tag number.`);
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    // 2. Update baggage table (status, current_location, updated_at)
    await tx.query(
      `UPDATE baggage SET status = ?, current_location = ?, updated_at = NOW() WHERE id = ?`,
      [newStatus, location.trim(), baggage.id]
    );

    // 3. Insert into baggage_movements
    await tx.query(
      `INSERT INTO baggage_movements (baggage_id, timestamp, status, location, remarks) VALUES (?, ?, ?, ?, ?)`,
      [baggage.id, timeString, newStatus, location.trim(), remarks.trim()]
    );

    // In file store mode, update records in memoryStore
    const store = loadStore();
    const item = store.baggage.find(b => b.id === baggage.id);
    if (item) {
      item.status = newStatus;
      item.current_location = location.trim();
      item.updated_at = now.toISOString();
    }

    const newMovement: BaggageMovement = {
      id: (store.movements.length > 0 ? Math.max(...store.movements.map(m => m.id || 0)) : 0) + 1,
      baggage_id: baggage.id,
      timestamp: timeString,
      status: newStatus,
      location: location.trim(),
      remarks: remarks.trim() || undefined,
      created_at: now.toISOString()
    };
    store.movements.push(newMovement);

    // 4. Commit transaction
    await tx.commit();

    const updatedBaggage = await getBaggageByTag(tagNumber);

    return {
      baggage: updatedBaggage,
      movement: newMovement
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
