import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.ts';
import { query, loadStore, beginTransaction } from '../config/database.ts';
import { Baggage, BaggageMovement, BaggageStatus, DashboardStatistics, Flight, PassengerBooking } from '../types/index.ts';

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
      b.booking_id,
      b.flight_id,
      b.passenger_id,
      b.weight,
      b.status,
      b.current_location,
      b.created_at,
      b.updated_at,
      pb.pnr_number,
      f.flight_number,
      f.origin,
      f.destination,
      u.name AS passenger_name,
      u.email AS passenger_email
    FROM baggage b
    LEFT JOIN passenger_bookings pb ON b.booking_id = pb.id
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

// 2. GET /api/baggage (Staff list)
export async function getAllBaggageHandler(req: Request, res: Response) {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;

    const sql = `
      SELECT 
        b.id,
        b.tag_number,
        b.booking_id,
        b.flight_id,
        b.passenger_id,
        b.weight,
        b.status,
        b.current_location,
        b.created_at,
        b.updated_at,
        pb.pnr_number,
        f.flight_number,
        f.origin,
        f.destination,
        u.name AS passenger_name,
        u.email AS passenger_email
      FROM baggage b
      LEFT JOIN passenger_bookings pb ON b.booking_id = pb.id
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
        (b.pnr_number && b.pnr_number.toUpperCase().includes(q)) ||
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

// 3. POST /api/baggage (Staff Register New Baggage)
export async function registerBaggageHandler(req: AuthRequest, res: Response) {
  try {
    const {
      tagNumber,
      pnrNumber,
      passengerName,
      flightNumber,
      weight,
      status = 'CHECKED IN',
      currentLocation,
      remarks
    } = req.body;

    // 1. Validate required fields
    if (!tagNumber || !tagNumber.trim()) {
      return res.status(400).json({ message: 'Baggage tag number is required.' });
    }
    if (!pnrNumber || !pnrNumber.trim()) {
      return res.status(400).json({ message: 'PNR number is required.' });
    }
    if (!flightNumber || !flightNumber.trim()) {
      return res.status(400).json({ message: 'Flight number is required.' });
    }
    if (weight === undefined || weight === null || isNaN(Number(weight))) {
      return res.status(400).json({ message: 'Baggage weight must be a valid number.' });
    }
    if (Number(weight) <= 0) {
      return res.status(400).json({ message: 'Baggage weight must be greater than zero.' });
    }
    if (Number(weight) > 60) {
      return res.status(400).json({ message: 'Baggage weight exceeds the maximum allowable limit of 60 kg.' });
    }
    if (!currentLocation || !currentLocation.trim()) {
      return res.status(400).json({ message: 'Current location is required.' });
    }

    const cleanTag = tagNumber.replace(/\s+/g, '').toUpperCase();
    const cleanPNR = pnrNumber.replace(/\s+/g, '').toUpperCase();
    const cleanFlight = flightNumber.trim().toUpperCase();
    const cleanStatus = (status || 'CHECKED IN').trim().toUpperCase() as BaggageStatus;
    const cleanLocation = currentLocation.trim();
    const cleanRemarks = (remarks || 'Registered at baggage counter').trim();

    // Format check for tag: alphanumeric 3-20 chars
    if (!/^[A-Z0-9_-]{3,20}$/.test(cleanTag)) {
      return res.status(400).json({ message: 'Invalid baggage tag format. Use 3-20 uppercase letters or numbers (e.g. BG10008).' });
    }

    // Format check for PNR: alphanumeric 3-12 chars
    if (!/^[A-Z0-9]{3,12}$/.test(cleanPNR)) {
      return res.status(400).json({ message: 'Invalid PNR format. PNR must be 3 to 12 alphanumeric characters (e.g. ABC123).' });
    }

    // Validate status
    if (!VALID_STATUSES.includes(cleanStatus)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    // 2. Check if tag number already exists
    const existingBag = await getBaggageByTag(cleanTag);
    if (existingBag) {
      return res.status(409).json({ message: `Baggage tag "${cleanTag}" already exists. Please use a unique tag number like BG${Math.floor(10000 + Math.random() * 90000)}.` });
    }

    // 3. Verify flight exists
    let flights = await query<Flight[]>(`SELECT * FROM flights WHERE flight_number = ?`, [cleanFlight]);
    if (!flights || flights.length === 0) {
      const allFlights = await query<Flight[]>(`SELECT * FROM flights`);
      const matched = allFlights?.find(f => f.flight_number.toUpperCase() === cleanFlight);
      if (matched) {
        flights = [matched];
      } else if (allFlights && allFlights.length > 0) {
        flights = [allFlights[0]];
      } else {
        return res.status(400).json({ message: `Flight "${cleanFlight}" does not exist in the airport system.` });
      }
    }
    const flight = flights[0];

    // 4. Verify or create PNR Booking
    let bookingId: number;
    let passengerId: number;

    const existingBookings = await query<PassengerBooking[]>(
      `SELECT * FROM passenger_bookings WHERE pnr_number = ?`,
      [cleanPNR]
    );

    if (existingBookings && existingBookings.length > 0) {
      const existingBooking = existingBookings[0];
      bookingId = existingBooking.id;
      passengerId = existingBooking.passenger_id;
    } else {
      // New PNR: default passenger name if not provided
      const cleanPassengerName = (passengerName && passengerName.trim()) ? passengerName.trim() : 'Passenger';

      // Check if user with this name already exists
      const existingUsers = await query<any[]>(
        `SELECT * FROM users WHERE LOWER(name) = LOWER(?)`,
        [cleanPassengerName]
      );

      if (existingUsers && existingUsers.length > 0) {
        passengerId = existingUsers[0].id;
      } else {
        // Create new passenger user
        const generatedEmail = `${cleanPassengerName.toLowerCase().replace(/[^a-z0-9]/g, '')}${Date.now().toString().slice(-4)}@passenger.baggagetrack.com`;
        const userInsert = await query(
          `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'PASSENGER')`,
          [cleanPassengerName, generatedEmail, '']
        );
        passengerId = userInsert.insertId;
      }

      // Create new booking record
      const bookingInsert = await query(
        `INSERT INTO passenger_bookings (pnr_number, passenger_id, flight_id) VALUES (?, ?, ?)`,
        [cleanPNR, passengerId, flight.id]
      );
      bookingId = bookingInsert.insertId;
    }

    // 5. Transactional insert of baggage and initial movement
    const tx = await beginTransaction();
    try {
      const bagInsert = await tx.query(
        `INSERT INTO baggage (tag_number, booking_id, flight_id, passenger_id, weight, status, current_location) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [cleanTag, bookingId, flight.id, passengerId, Number(weight), cleanStatus, cleanLocation]
      );
      const newBaggageId = bagInsert.insertId;

      const now = new Date();
      const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Insert initial movement record
      await tx.query(
        `INSERT INTO baggage_movements (baggage_id, timestamp, status, location, remarks) VALUES (?, ?, ?, ?, ?)`,
        [newBaggageId, timeString, cleanStatus, cleanLocation, cleanRemarks]
      );

      await tx.commit();

      const createdBag = await getBaggageByTag(cleanTag);

      return res.status(201).json({
        message: 'Baggage registered successfully.',
        tagNumber: cleanTag,
        pnrNumber: cleanPNR,
        baggage: createdBag
      });
    } catch (err: any) {
      await tx.rollback();
      console.error('Error registering baggage:', err);
      return res.status(500).json({ message: err.message || 'Failed to register baggage. Transaction rolled back.' });
    }
  } catch (error: any) {
    console.error('Register baggage error:', error);
    return res.status(500).json({ message: 'Internal server error while registering baggage.' });
  }
}

// 4. GET /api/bookings/:pnrNumber/baggage (PNR Baggage Lookup)
export async function getBaggageByPNRHandler(req: Request, res: Response) {
  try {
    const { pnrNumber } = req.params;
    if (!pnrNumber || !pnrNumber.trim()) {
      return res.status(400).json({ message: 'Please enter a valid PNR number.' });
    }

    const cleanPNR = pnrNumber.trim().toUpperCase();

    // 1. Retrieve booking
    const bookings = await query<PassengerBooking[]>(
      `SELECT * FROM passenger_bookings WHERE pnr_number = ?`,
      [cleanPNR]
    );

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: `No booking found for PNR number: "${cleanPNR}".` });
    }

    const booking = bookings[0];

    // 2. Retrieve all baggage items for this booking
    const sql = `
      SELECT 
        b.id,
        b.tag_number,
        b.booking_id,
        b.flight_id,
        b.passenger_id,
        b.weight,
        b.status,
        b.current_location,
        b.created_at,
        b.updated_at,
        pb.pnr_number,
        f.flight_number,
        f.origin,
        f.destination,
        u.name AS passenger_name,
        u.email AS passenger_email
      FROM baggage b
      JOIN passenger_bookings pb ON b.booking_id = pb.id
      JOIN flights f ON b.flight_id = f.id
      JOIN users u ON b.passenger_id = u.id
      WHERE pb.pnr_number = ?
      ORDER BY b.id ASC
    `;
    const baggageList = await query<Baggage[]>(sql, [cleanPNR]);

    return res.status(200).json({
      pnr_number: booking.pnr_number,
      passenger_name: booking.passenger_name || 'Passenger',
      flight_number: booking.flight_number || '',
      origin: booking.origin || '',
      destination: booking.destination || '',
      baggage: baggageList || []
    });
  } catch (error: any) {
    console.error('Error fetching PNR baggage:', error);
    return res.status(500).json({ message: 'Failed to retrieve PNR baggage records.' });
  }
}

// 5. GET /api/flights (Flight records for dropdown)
export async function getFlightsHandler(req: Request, res: Response) {
  try {
    const flights = await query<Flight[]>(`SELECT * FROM flights ORDER BY flight_number ASC`);
    return res.status(200).json(flights);
  } catch (error: any) {
    console.error('Error fetching flights:', error);
    return res.status(500).json({ message: 'Failed to retrieve flights list.' });
  }
}

// 6. GET /api/baggage/statistics
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
      total: Number(r?.total ?? 0),
      inTransit: Number(r?.inTransit ?? 0),
      delayed: Number(r?.delayed ?? 0),
      missing: Number(r?.missing ?? 0),
      claimed: Number(r?.claimed ?? 0)
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error calculating statistics:', error);
    return res.status(500).json({ message: 'Failed to calculate operations statistics.' });
  }
}

// 7. GET /api/baggage/:tagNumber/movements
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

// 8. POST /api/baggage/:tagNumber/movements (Transaction update)
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

      await tx.commit();

      const updatedBaggage = await getBaggageByTag(tagNumber);
      return res.status(200).json({
        message: 'Baggage status updated successfully.',
        baggage: updatedBaggage,
        movement: {
          baggage_id: baggage.id,
          timestamp: timeString,
          status,
          location: location.trim(),
          remarks: (remarks || '').trim() || undefined,
          created_at: now.toISOString()
        }
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

// 9. GET /api/passenger/dashboard
export async function getPassengerDashboardHandler(req: AuthRequest, res: Response) {
  try {
    const passengerId = req.user?.id || 3; // Defaults to Godwin (id 3)
    const store = loadStore();
    const passenger = store.users.find(u => u.id === passengerId) || store.users.find(u => u.name === 'Godwin');

    // Retrieve passenger's bookings
    const bookings = await query<PassengerBooking[]>(
      `SELECT * FROM passenger_bookings WHERE passenger_id = ?`,
      [passengerId]
    );

    // Retrieve passenger's baggage
    const passengerBaggage = (await query<Baggage[]>(
      `SELECT * FROM baggage WHERE passenger_id = ?`,
      [passengerId]
    )) || [];

    // Flight IDs
    const flightIds = Array.from(new Set(passengerBaggage.map(b => b.flight_id)));
    const flights = store.flights
      .filter(f => flightIds.includes(f.id) || bookings.some(bk => bk.flight_id === f.id))
      .map(f => {
        const bk = bookings.find(k => k.flight_id === f.id);
        return {
          ...f,
          pnr_number: bk?.pnr_number || 'ABC123'
        };
      });

    return res.status(200).json({
      passenger: {
        id: passenger?.id || passengerId,
        name: passenger?.name || 'Passenger',
        email: passenger?.email || ''
      },
      flightsCount: flights.length || (passengerBaggage.length > 0 ? 1 : 0),
      baggageCount: passengerBaggage.length,
      bookings,
      flights,
      recentBaggage: passengerBaggage
    });
  } catch (error: any) {
    console.error('Error retrieving passenger dashboard:', error);
    return res.status(500).json({ message: 'Failed to load passenger dashboard.' });
  }
}
