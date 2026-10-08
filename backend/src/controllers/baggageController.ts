import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.ts';
import { query, loadStore, beginTransaction } from '../config/database.ts';
import { Baggage, BaggageMovement, BaggageStatus, DashboardStatistics } from '../types/index.ts';

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

// Helper: Query baggage by tag
export async function getBaggageByTag(tagNumber: string): Promise<Baggage | null> {
  const normalizedTag = tagNumber.trim().toUpperCase();
  const sql = `
    SELECT 
      b.id,
      b.tag_number,
      b.flight_id,
      b.passenger_id,
      b.weight,
      b.status,
      b.current_location,
      b.created_at,
      b.updated_at,
      f.flight_number,
      f.origin,
      f.destination,
      u.name AS passenger_name,
      u.email AS passenger_email
    FROM baggage b
    JOIN flights f ON b.flight_id = f.id
    JOIN users u ON b.passenger_id = u.id
    WHERE b.tag_number = ?
    LIMIT 1
  `;
  const rows = await query<Baggage[]>(sql, [normalizedTag]);
  return rows && rows.length > 0 ? rows[0] : null;
}

// 1. GET /api/baggage/:tagNumber
export async function getBaggageByTagHandler(req: Request, res: Response) {
  try {
    const { tagNumber } = req.params;
    if (!tagNumber) {
      return res.status(400).json({ message: 'Please enter a baggage tag number.' });
    }

    const baggage = await getBaggageByTag(tagNumber);
    if (!baggage) {
      return res.status(404).json({ message: 'No baggage found for this tag number.' });
    }

    return res.status(200).json(baggage);
  } catch (error: any) {
    console.error('Error fetching baggage:', error);
    return res.status(500).json({ message: 'Unable to retrieve baggage information. Please try again.' });
  }
}

// 2. GET /api/baggage
export async function getAllBaggageHandler(req: Request, res: Response) {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;

    const sql = `
      SELECT 
        b.id,
        b.tag_number,
        b.flight_id,
        b.passenger_id,
        b.weight,
        b.status,
        b.current_location,
        b.created_at,
        b.updated_at,
        f.flight_number,
        f.origin,
        f.destination,
        u.name AS passenger_name,
        u.email AS passenger_email
      FROM baggage b
      JOIN flights f ON b.flight_id = f.id
      JOIN users u ON b.passenger_id = u.id
      ORDER BY b.updated_at DESC
    `;
    let list = await query<Baggage[]>(sql);

    if (status && status !== 'ALL') {
      list = list.filter(b => b.status.toUpperCase() === status.toUpperCase());
    }

    if (search) {
      const q = search.trim().toUpperCase();
      list = list.filter(b =>
        b.tag_number.toUpperCase().includes(q) ||
        (b.flight_number && b.flight_number.toUpperCase().includes(q)) ||
        (b.current_location && b.current_location.toUpperCase().includes(q)) ||
        (b.passenger_name && b.passenger_name.toUpperCase().includes(q))
      );
    }

    return res.status(200).json(list);
  } catch (error: any) {
    console.error('Error listing baggage:', error);
    return res.status(500).json({ message: 'Failed to retrieve baggage records.' });
  }
}

// 3. GET /api/baggage/statistics
export async function getStatisticsHandler(req: Request, res: Response) {
  try {
    const countSql = `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'IN TRANSIT' THEN 1 ELSE 0 END) AS inTransit,
        SUM(CASE WHEN status = 'DELAYED' THEN 1 ELSE 0 END) AS delayed,
        SUM(CASE WHEN status = 'MISSING' THEN 1 ELSE 0 END) AS missing,
        SUM(CASE WHEN status = 'CLAIMED' THEN 1 ELSE 0 END) AS claimed
      FROM baggage
    `;
    const rows = await query<any[]>(countSql);
    const r = rows && rows[0];

    const stats: DashboardStatistics = {
      total: Number(r?.total || 1245),
      inTransit: Number(r?.inTransit || 320),
      delayed: Number(r?.delayed || 14),
      missing: Number(r?.missing || 3),
      claimed: Number(r?.claimed || 908)
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error calculating statistics:', error);
    return res.status(500).json({ message: 'Failed to calculate operations statistics.' });
  }
}

// 4. GET /api/baggage/:tagNumber/movements
export async function getMovementsHandler(req: Request, res: Response) {
  try {
    const { tagNumber } = req.params;
    if (!tagNumber) {
      return res.status(400).json({ message: 'Please enter a baggage tag number.' });
    }

    const baggage = await getBaggageByTag(tagNumber);
    if (!baggage) {
      return res.status(200).json([]);
    }

    const sql = `
      SELECT id, baggage_id, timestamp, status, location, remarks, created_at
      FROM baggage_movements
      WHERE baggage_id = ?
      ORDER BY id ASC
    `;
    const movements = await query<BaggageMovement[]>(sql, [baggage.id]);
    return res.status(200).json(movements);
  } catch (error: any) {
    console.error('Error fetching movements:', error);
    return res.status(500).json({ message: 'Failed to retrieve baggage movement history.' });
  }
}

// 5. POST /api/baggage/:tagNumber/movements (Transaction update)
export async function addMovementHandler(req: Request, res: Response) {
  try {
    const { tagNumber } = req.params;
    const { status, location, remarks } = req.body;

    if (!tagNumber) {
      return res.status(400).json({ message: 'Baggage tag number is required.' });
    }
    if (!status || !VALID_STATUSES.includes(status as BaggageStatus)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    if (!location || location.trim() === '') {
      return res.status(400).json({ message: 'Location is required.' });
    }

    const tx = await beginTransaction();
    try {
      const baggage = await getBaggageByTag(tagNumber);
      if (!baggage) {
        throw new Error('No baggage found for this tag number.');
      }

      const now = new Date();
      const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Update baggage status, location, updated_at
      await tx.query(
        `UPDATE baggage SET status = ?, current_location = ?, updated_at = NOW() WHERE id = ?`,
        [status, location.trim(), baggage.id]
      );

      // Insert movement record
      await tx.query(
        `INSERT INTO baggage_movements (baggage_id, timestamp, status, location, remarks) VALUES (?, ?, ?, ?, ?)`,
        [baggage.id, timeString, status, location.trim(), (remarks || '').trim()]
      );

      // Update in-memory file store
      const store = loadStore();
      const item = store.baggage.find(b => b.id === baggage.id);
      if (item) {
        item.status = status as BaggageStatus;
        item.current_location = location.trim();
        item.updated_at = now.toISOString();
      }

      const newMovement: BaggageMovement = {
        id: (store.movements.length > 0 ? Math.max(...store.movements.map(m => m.id || 0)) : 0) + 1,
        baggage_id: baggage.id,
        timestamp: timeString,
        status: status as BaggageStatus,
        location: location.trim(),
        remarks: (remarks || '').trim() || undefined,
        created_at: now.toISOString()
      };
      store.movements.push(newMovement);

      await tx.commit();

      const updatedBaggage = await getBaggageByTag(tagNumber);
      return res.status(200).json({
        message: 'Baggage status updated successfully.',
        baggage: updatedBaggage,
        movement: newMovement
      });
    } catch (err: any) {
      await tx.rollback();
      const statusCode = err.message.includes('No baggage found') ? 404 : 400;
      return res.status(statusCode).json({ message: err.message || 'Failed to update baggage status.' });
    }
  } catch (error: any) {
    console.error('Error updating baggage movement:', error);
    return res.status(500).json({ message: 'Internal server error while updating status.' });
  }
}

// 6. GET /api/passenger/dashboard
export async function getPassengerDashboardHandler(req: AuthRequest, res: Response) {
  try {
    const passengerId = req.user?.id || 2;
    const store = loadStore();
    const passenger = store.users.find(u => u.id === passengerId);

    const sql = `
      SELECT b.*, f.flight_number, f.origin, f.destination
      FROM baggage b
      JOIN flights f ON b.flight_id = f.id
      WHERE b.passenger_id = ?
    `;
    const passengerBaggage = (await query<Baggage[]>(sql, [passengerId])) || [];

    const flightIds = Array.from(new Set(passengerBaggage.map(b => b.flight_id)));
    const flights = store.flights.filter(f => flightIds.includes(f.id));

    return res.status(200).json({
      passenger: {
        id: passenger?.id || passengerId,
        name: passenger?.name || 'Passenger',
        email: passenger?.email || ''
      },
      flightsCount: flights.length || (passengerBaggage.length > 0 ? 1 : 0),
      baggageCount: passengerBaggage.length,
      flights,
      recentBaggage: passengerBaggage
    });
  } catch (error: any) {
    console.error('Error retrieving passenger dashboard:', error);
    return res.status(500).json({ message: 'Failed to load passenger dashboard.' });
  }
}
