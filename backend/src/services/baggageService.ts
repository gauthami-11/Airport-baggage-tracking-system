import { query, loadStore } from '../config/database.ts';
import { Baggage, BaggageStatus, DashboardStatistics } from '../types/index.ts';

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
  if (!rows || rows.length === 0) {
    return null;
  }
  return rows[0];
}

export async function getAllBaggage(filters: { status?: string; search?: string } = {}): Promise<Baggage[]> {
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

  if (filters.status && filters.status !== 'ALL') {
    list = list.filter(b => b.status.toUpperCase() === filters.status!.toUpperCase());
  }

  if (filters.search) {
    const q = filters.search.trim().toUpperCase();
    list = list.filter(b => 
      b.tag_number.toUpperCase().includes(q) ||
      (b.flight_number && b.flight_number.toUpperCase().includes(q)) ||
      (b.current_location && b.current_location.toUpperCase().includes(q)) ||
      (b.passenger_name && b.passenger_name.toUpperCase().includes(q))
    );
  }

  return list;
}

export async function getDashboardStatistics(): Promise<DashboardStatistics> {
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
  if (rows && rows.length > 0) {
    const r = rows[0];
    return {
      total: Number(r.total || 0),
      inTransit: Number(r.inTransit || 0),
      delayed: Number(r.delayed || 0),
      missing: Number(r.missing || 0),
      claimed: Number(r.claimed || 0)
    };
  }

  // Fallback direct count
  const all = await getAllBaggage();
  return {
    total: all.length,
    inTransit: all.filter(b => b.status === 'IN TRANSIT').length,
    delayed: all.filter(b => b.status === 'DELAYED').length,
    missing: all.filter(b => b.status === 'MISSING').length,
    claimed: all.filter(b => b.status === 'CLAIMED').length
  };
}

export async function getPassengerDashboard(passengerId: number) {
  const store = loadStore();
  const passenger = store.users.find(u => u.id === passengerId);

  // Find passenger baggage
  const passengerBaggage = (await getAllBaggage()).filter(b => b.passenger_id === passengerId);

  // Find unique flight IDs
  const flightIds = Array.from(new Set(passengerBaggage.map(b => b.flight_id)));
  const flights = store.flights.filter(f => flightIds.includes(f.id));

  return {
    passenger: {
      id: passenger?.id || passengerId,
      name: passenger?.name || 'Passenger',
      email: passenger?.email || ''
    },
    flightsCount: flights.length || (passengerBaggage.length > 0 ? 1 : 0),
    baggageCount: passengerBaggage.length,
    flights,
    recentBaggage: passengerBaggage
  };
}
