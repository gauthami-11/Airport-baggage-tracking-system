import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Flight, PassengerBooking, Baggage, BaggageMovement, Incident, BaggageStatus } from '../types/index.ts';

const DB_STORE_PATH = path.resolve(process.cwd(), 'database/data_store.json');

// Interface for database operations
export interface DBTransaction {
  query: (sql: string, params?: any[]) => Promise<any>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

// In-file store interface
interface StoreData {
  users: User[];
  flights: Flight[];
  bookings: PassengerBooking[];
  baggage: Baggage[];
  movements: BaggageMovement[];
  incidents: Incident[];
}

let mysqlPool: mysql.Pool | null = null;
let useMySQL = false;
let memoryStore: StoreData | null = null;

// Initialize memory store with seed data if JSON store doesn't exist
function getInitialSeedData(): StoreData {
  const staffHash = bcrypt.hashSync('staff123', 10);
  const passengerHash = bcrypt.hashSync('passenger123', 10);

  const users: User[] = [
    {
      id: 1,
      name: 'Anu',
      email: 'anu@baggagetrack.com',
      password_hash: staffHash,
      role: 'STAFF',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Gauthami',
      email: 'gauthami@baggagetrack.com',
      password_hash: staffHash,
      role: 'STAFF',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Godwin',
      email: 'godwin@baggagetrack.com',
      password_hash: passengerHash,
      role: 'PASSENGER',
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      password_hash: passengerHash,
      role: 'PASSENGER',
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Airport Operations Staff',
      email: 'staff@baggagetrack.com',
      password_hash: staffHash,
      role: 'STAFF',
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      name: 'Passenger Demo',
      email: 'passenger@baggagetrack.com',
      password_hash: passengerHash,
      role: 'PASSENGER',
      created_at: new Date().toISOString()
    }
  ];

  const flights: Flight[] = [
    {
      id: 1,
      flight_number: 'AI302',
      origin: 'Delhi Airport',
      destination: 'Mumbai Airport',
      departure_time: '09:00',
      arrival_time: '11:10',
      status: 'DEPARTED'
    },
    {
      id: 2,
      flight_number: 'AI405',
      origin: 'Mumbai Airport',
      destination: 'Delhi Airport',
      departure_time: '10:00',
      arrival_time: '12:15',
      status: 'SCHEDULED'
    },
    {
      id: 3,
      flight_number: 'AI210',
      origin: 'Delhi Airport',
      destination: 'Bangalore Airport',
      departure_time: '08:30',
      arrival_time: '11:00',
      status: 'ARRIVED'
    }
  ];

  // Passenger Bookings (PNRs)
  const bookings: PassengerBooking[] = [
    {
      id: 1,
      pnr_number: 'ABC123',
      passenger_id: 3, // Godwin
      flight_id: 1, // AI302
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      pnr_number: 'XYZ789',
      passenger_id: 3, // Godwin
      flight_id: 3, // AI210
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      pnr_number: 'DEL405',
      passenger_id: 4, // Priya Patel
      flight_id: 2, // AI405
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      pnr_number: 'BLR210',
      passenger_id: 4, // Priya Patel
      flight_id: 3, // AI210
      created_at: new Date().toISOString()
    }
  ];

  const baggage: Baggage[] = [
    {
      id: 1,
      tag_number: 'BG10001',
      booking_id: 1,
      flight_id: 1,
      passenger_id: 3,
      weight: 18.5,
      status: 'IN TRANSIT',
      current_location: 'Delhi Airport',
      created_at: '2026-10-07T08:30:00Z',
      updated_at: '2026-10-07T09:35:00Z'
    },
    {
      id: 2,
      tag_number: 'BG10002',
      booking_id: 1,
      flight_id: 1,
      passenger_id: 3,
      weight: 21.2,
      status: 'ARRIVED',
      current_location: 'Delhi Airport',
      created_at: '2026-10-07T07:15:00Z',
      updated_at: '2026-10-07T09:20:00Z'
    },
    {
      id: 3,
      tag_number: 'BG10003',
      booking_id: 3,
      flight_id: 2,
      passenger_id: 4,
      weight: 16.8,
      status: 'DELAYED',
      current_location: 'Mumbai Airport',
      created_at: '2026-10-07T08:15:00Z',
      updated_at: '2026-10-07T09:05:00Z'
    },
    {
      id: 4,
      tag_number: 'BG10004',
      booking_id: 2,
      flight_id: 3,
      passenger_id: 3,
      weight: 19.1,
      status: 'CLAIMED',
      current_location: 'Delhi Airport',
      created_at: '2026-10-07T06:30:00Z',
      updated_at: '2026-10-07T08:55:00Z'
    },
    {
      id: 5,
      tag_number: 'BG10005',
      booking_id: 1,
      flight_id: 1,
      passenger_id: 3,
      weight: 22.0,
      status: 'LOADED',
      current_location: 'Delhi Airport',
      created_at: '2026-10-07T07:00:00Z',
      updated_at: '2026-10-07T08:30:00Z'
    },
    {
      id: 6,
      tag_number: 'BG10006',
      booking_id: 3,
      flight_id: 2,
      passenger_id: 4,
      weight: 14.5,
      status: 'CHECKED IN',
      current_location: 'Mumbai Airport',
      created_at: '2026-10-07T08:45:00Z',
      updated_at: '2026-10-07T08:45:00Z'
    },
    {
      id: 7,
      tag_number: 'BG10007',
      booking_id: 4,
      flight_id: 3,
      passenger_id: 4,
      weight: 17.3,
      status: 'MISSING',
      current_location: 'Delhi Airport',
      created_at: '2026-10-07T05:30:00Z',
      updated_at: '2026-10-07T09:10:00Z'
    }
  ];

  const movements: BaggageMovement[] = [
    {
      id: 1,
      baggage_id: 1,
      timestamp: '08:30',
      status: 'CHECKED IN',
      location: 'Delhi Airport',
      remarks: 'Checked in at Terminal 3 Counter B12 by Godwin (PNR: ABC123)',
      created_at: '2026-10-07T08:30:00Z'
    },
    {
      id: 2,
      baggage_id: 1,
      timestamp: '08:42',
      status: 'SECURITY',
      location: 'Delhi Airport',
      remarks: 'Security screening passed at Inspection Bay 4',
      created_at: '2026-10-07T08:42:00Z'
    },
    {
      id: 3,
      baggage_id: 1,
      timestamp: '08:55',
      status: 'SORTED',
      location: 'Delhi Airport',
      remarks: 'Automated sorting completed to Cart 14',
      created_at: '2026-10-07T08:55:00Z'
    },
    {
      id: 4,
      baggage_id: 1,
      timestamp: '09:20',
      status: 'LOADED',
      location: 'Delhi Airport',
      remarks: 'Loaded into Boeing 777 cargo hold door 2',
      created_at: '2026-10-07T09:20:00Z'
    },
    {
      id: 5,
      baggage_id: 1,
      timestamp: '09:35',
      status: 'IN TRANSIT',
      location: 'Delhi Airport',
      remarks: 'Flight AI302 pushback and departure en route to Mumbai',
      created_at: '2026-10-07T09:35:00Z'
    },
    {
      id: 6,
      baggage_id: 2,
      timestamp: '07:15',
      status: 'CHECKED IN',
      location: 'Delhi Airport',
      remarks: 'Checked in at Terminal 3 Counter B14 (PNR: ABC123)',
      created_at: '2026-10-07T07:15:00Z'
    },
    {
      id: 7,
      baggage_id: 2,
      timestamp: '07:35',
      status: 'SECURITY',
      location: 'Delhi Airport',
      remarks: 'Security screening cleared',
      created_at: '2026-10-07T07:35:00Z'
    },
    {
      id: 8,
      baggage_id: 2,
      timestamp: '08:10',
      status: 'SORTED',
      location: 'Delhi Airport',
      remarks: 'Sorted for flight AI302',
      created_at: '2026-10-07T08:10:00Z'
    },
    {
      id: 9,
      baggage_id: 2,
      timestamp: '08:50',
      status: 'LOADED',
      location: 'Delhi Airport',
      remarks: 'Loaded into front compartment',
      created_at: '2026-10-07T08:50:00Z'
    },
    {
      id: 10,
      baggage_id: 2,
      timestamp: '09:20',
      status: 'ARRIVED',
      location: 'Delhi Airport',
      remarks: 'Unloaded at carousel bay',
      created_at: '2026-10-07T09:20:00Z'
    },
    {
      id: 11,
      baggage_id: 3,
      timestamp: '08:15',
      status: 'CHECKED IN',
      location: 'Mumbai Airport',
      remarks: 'Checked in at Terminal 2 (PNR: DEL405)',
      created_at: '2026-10-07T08:15:00Z'
    },
    {
      id: 12,
      baggage_id: 3,
      timestamp: '08:30',
      status: 'SECURITY',
      location: 'Mumbai Airport',
      remarks: 'Security clearance granted',
      created_at: '2026-10-07T08:30:00Z'
    },
    {
      id: 13,
      baggage_id: 3,
      timestamp: '09:05',
      status: 'DELAYED',
      location: 'Mumbai Airport',
      remarks: 'Flight connection delayed due to weather',
      created_at: '2026-10-07T09:05:00Z'
    },
    {
      id: 14,
      baggage_id: 4,
      timestamp: '06:30',
      status: 'CHECKED IN',
      location: 'Delhi Airport',
      remarks: 'Checked in at Counter A04 (PNR: XYZ789)',
      created_at: '2026-10-07T06:30:00Z'
    },
    {
      id: 15,
      baggage_id: 4,
      timestamp: '07:00',
      status: 'SECURITY',
      location: 'Delhi Airport',
      remarks: 'Security clearance verified',
      created_at: '2026-10-07T07:00:00Z'
    },
    {
      id: 16,
      baggage_id: 4,
      timestamp: '07:30',
      status: 'SORTED',
      location: 'Delhi Airport',
      remarks: 'Baggage sorting complete',
      created_at: '2026-10-07T07:30:00Z'
    },
    {
      id: 17,
      baggage_id: 4,
      timestamp: '08:00',
      status: 'LOADED',
      location: 'Delhi Airport',
      remarks: 'Loaded onto flight AI210',
      created_at: '2026-10-07T08:00:00Z'
    },
    {
      id: 18,
      baggage_id: 4,
      timestamp: '08:30',
      status: 'IN TRANSIT',
      location: 'Delhi Airport',
      remarks: 'En route to Bangalore',
      created_at: '2026-10-07T08:30:00Z'
    },
    {
      id: 19,
      baggage_id: 4,
      timestamp: '08:55',
      status: 'CLAIMED',
      location: 'Delhi Airport',
      remarks: 'Baggage claimed by passenger at Carousel 2',
      created_at: '2026-10-07T08:55:00Z'
    },
    {
      id: 20,
      baggage_id: 5,
      timestamp: '07:00',
      status: 'CHECKED IN',
      location: 'Delhi Airport',
      remarks: 'Checked in at Terminal 3 Counter B12 (PNR: ABC123)',
      created_at: '2026-10-07T07:00:00Z'
    },
    {
      id: 21,
      baggage_id: 5,
      timestamp: '07:30',
      status: 'SECURITY',
      location: 'Delhi Airport',
      remarks: 'Screened and tagged',
      created_at: '2026-10-07T07:30:00Z'
    },
    {
      id: 22,
      baggage_id: 5,
      timestamp: '08:00',
      status: 'SORTED',
      location: 'Delhi Airport',
      remarks: 'Sorted for flight AI302',
      created_at: '2026-10-07T08:00:00Z'
    },
    {
      id: 23,
      baggage_id: 5,
      timestamp: '08:30',
      status: 'LOADED',
      location: 'Delhi Airport',
      remarks: 'Loaded into cargo hold door 1',
      created_at: '2026-10-07T08:30:00Z'
    }
  ];

  const incidents: Incident[] = [
    {
      id: 1,
      baggage_id: 1,
      reported_by: 1,
      type: 'DAMAGED BAGGAGE',
      description: 'Minor scratch and zipper tear reported on outer pocket',
      status: 'OPEN',
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      baggage_id: 3,
      reported_by: 1,
      type: 'DELAYED',
      description: 'Baggage did not arrive with flight AI405 due to tight turnaround',
      status: 'INVESTIGATING',
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    }
  ];

  return { users, flights, bookings, baggage, movements, incidents };
}

// Load or save from disk
export function loadStore(): StoreData {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(DB_STORE_PATH)) {
      const raw = fs.readFileSync(DB_STORE_PATH, 'utf-8');
      memoryStore = JSON.parse(raw);
      // Migration safeguard: Ensure bookings array exists
      if (!memoryStore?.bookings) {
        memoryStore!.bookings = getInitialSeedData().bookings;
        saveStore();
      }
    } else {
      memoryStore = getInitialSeedData();
      saveStore();
    }
  } catch (err) {
    console.error('Failed reading data_store.json, resetting to seed:', err);
    memoryStore = getInitialSeedData();
    saveStore();
  }
  return memoryStore!;
}

export function saveStore() {
  if (!memoryStore) return;
  try {
    const dir = path.dirname(DB_STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed saving data_store.json:', err);
  }
}

// Attempt MySQL connection if environment specifies
export async function initializeDatabase() {
  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME || 'baggage_tracking';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);

  if (dbHost && dbUser) {
    try {
      mysqlPool = mysql.createPool({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      // Test query
      await mysqlPool.query('SELECT 1');
      useMySQL = true;
      console.log('✓ Connected to MySQL database:', dbName);
      return;
    } catch (err: any) {
      console.warn('MySQL connection failed or server not running. Using persistent storage store.', err.message);
      useMySQL = false;
    }
  }

  // Load persistent file-backed store
  loadStore();
  console.log('✓ Database initialized (Persistent Storage Active).');
}

// Low-level query helper
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows as T;
  }

  // File-backed simulated relational query runner
  return runStoreQuery(sql, params);
}

// Begin transaction
export async function beginTransaction(): Promise<DBTransaction> {
  if (useMySQL && mysqlPool) {
    const connection = await mysqlPool.getConnection();
    await connection.beginTransaction();
    return {
      query: async (sql: string, params: any[] = []) => {
        const [rows] = await connection.query(sql, params);
        return rows;
      },
      commit: async () => {
        await connection.commit();
        connection.release();
      },
      rollback: async () => {
        await connection.rollback();
        connection.release();
      }
    };
  }

  // Snapshot store for transaction rollback
  const store = loadStore();
  const snapshot = JSON.stringify(store);
  return {
    query: async (sql: string, params: any[] = []) => {
      return runStoreQuery(sql, params);
    },
    commit: async () => {
      saveStore();
    },
    rollback: async () => {
      memoryStore = JSON.parse(snapshot);
      saveStore();
    }
  };
}

// Helper to enrich a baggage item with booking/flight/passenger joined fields
function enrichBaggage(b: Baggage, store: StoreData): Baggage {
  const booking = store.bookings?.find(k => k.id === b.booking_id);
  const flightId = b.flight_id || booking?.flight_id;
  const passengerId = b.passenger_id || booking?.passenger_id;

  const flight = store.flights.find(f => f.id === flightId);
  const passenger = store.users.find(u => u.id === passengerId);

  return {
    id: b.id,
    tag_number: b.tag_number,
    booking_id: b.booking_id || booking?.id || 1,
    flight_id: flightId || 1,
    passenger_id: passengerId || 1,
    weight: b.weight,
    status: b.status,
    current_location: b.current_location,
    created_at: b.created_at,
    updated_at: b.updated_at,
    pnr_number: booking?.pnr_number || 'ABC123',
    flight_number: flight?.flight_number || 'UNKNOWN',
    origin: flight?.origin || 'Origin',
    destination: flight?.destination || 'Destination',
    passenger_name: passenger?.name || 'Passenger',
    passenger_email: passenger?.email || ''
  };
}

// Store query parser for standard CRUD operations used in the app
function runStoreQuery(sql: string, params: any[] = []): any {
  const store = loadStore();
  const cleanSql = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT user by email
  if (/SELECT.*FROM users WHERE email = \?/i.test(cleanSql)) {
    const email = params[0]?.toLowerCase();
    const user = store.users.find(u => u.email.toLowerCase() === email);
    return user ? [user] : [];
  }

  // 2. SELECT user by id
  if (/SELECT.*FROM users WHERE id = \?/i.test(cleanSql)) {
    const id = Number(params[0]);
    const user = store.users.find(u => u.id === id);
    return user ? [user] : [];
  }

  // 3. SELECT user by name (for passenger lookup/creation)
  if (/SELECT.*FROM users WHERE LOWER\(name\) = LOWER\(\?\)/i.test(cleanSql) || /SELECT.*FROM users WHERE name = \?/i.test(cleanSql)) {
    const name = String(params[0]).trim().toLowerCase();
    const user = store.users.find(u => u.name.toLowerCase() === name);
    return user ? [user] : [];
  }

  // 4. INSERT INTO users
  if (/INSERT INTO users\b/i.test(cleanSql)) {
    const newId = (store.users.length > 0 ? Math.max(...store.users.map(u => u.id || 0)) : 0) + 1;
    const newUser: User = {
      id: newId,
      name: String(params[0] || 'Passenger'),
      email: String(params[1] || `passenger${newId}@baggagetrack.com`),
      password_hash: params[2] || bcrypt.hashSync('passenger123', 10),
      role: (params[3] as any) || 'PASSENGER',
      created_at: new Date().toISOString()
    };
    store.users.push(newUser);
    saveStore();
    return { insertId: newId, affectedRows: 1 };
  }

  // 5. SELECT flight by flight_number
  if (/SELECT.*FROM flights WHERE flight_number = \?/i.test(cleanSql)) {
    const fNum = String(params[0]).trim().toUpperCase();
    const f = store.flights.find(x => x.flight_number.toUpperCase() === fNum);
    return f ? [f] : [];
  }

  // 6. SELECT all flights
  if (/SELECT.*FROM flights/i.test(cleanSql)) {
    return store.flights;
  }

  // 7. SELECT booking by PNR number
  if (/SELECT.*FROM passenger_bookings.*WHERE.*pnr_number = \?/i.test(cleanSql)) {
    const pnr = String(params[0]).trim().toUpperCase();
    const booking = store.bookings?.find(k => k.pnr_number.toUpperCase() === pnr);
    if (!booking) return [];
    const passenger = store.users.find(u => u.id === booking.passenger_id);
    const flight = store.flights.find(f => f.id === booking.flight_id);
    return [{
      id: booking.id,
      pnr_number: booking.pnr_number,
      passenger_id: booking.passenger_id,
      flight_id: booking.flight_id,
      created_at: booking.created_at,
      passenger_name: passenger?.name || 'Passenger',
      passenger_email: passenger?.email || '',
      flight_number: flight?.flight_number || '',
      origin: flight?.origin || '',
      destination: flight?.destination || ''
    }];
  }

  // 8. SELECT booking by passenger_id
  if (/SELECT.*FROM passenger_bookings.*WHERE.*passenger_id = \?/i.test(cleanSql)) {
    const passengerId = Number(params[0]);
    const matches = (store.bookings || []).filter(k => k.passenger_id === passengerId);
    return matches.map(b => {
      const passenger = store.users.find(u => u.id === b.passenger_id);
      const flight = store.flights.find(f => f.id === b.flight_id);
      return {
        id: b.id,
        pnr_number: b.pnr_number,
        passenger_id: b.passenger_id,
        flight_id: b.flight_id,
        created_at: b.created_at,
        passenger_name: passenger?.name || 'Passenger',
        passenger_email: passenger?.email || '',
        flight_number: flight?.flight_number || '',
        origin: flight?.origin || '',
        destination: flight?.destination || ''
      };
    });
  }

  // 9. INSERT INTO passenger_bookings
  if (/INSERT INTO passenger_bookings\b/i.test(cleanSql)) {
    const newId = ((store.bookings || []).length > 0 ? Math.max(...store.bookings.map(k => k.id || 0)) : 0) + 1;
    const newBooking: PassengerBooking = {
      id: newId,
      pnr_number: String(params[0]).trim().toUpperCase(),
      passenger_id: Number(params[1]),
      flight_id: Number(params[2]),
      created_at: new Date().toISOString()
    };
    if (!store.bookings) store.bookings = [];
    store.bookings.push(newBooking);
    saveStore();
    return { insertId: newId, affectedRows: 1 };
  }

  // 10. SELECT baggage by tag_number (with joined fields)
  if (/SELECT.*FROM baggage.*WHERE.*tag_number = \?/i.test(cleanSql)) {
    const tag = String(params[0]).toUpperCase();
    const b = store.baggage.find(x => x.tag_number.toUpperCase() === tag);
    if (!b) return [];
    return [enrichBaggage(b, store)];
  }

  // 11. SELECT baggage by booking_id or PNR
  if (/SELECT.*FROM baggage.*WHERE.*(booking_id|pnr_number)/i.test(cleanSql)) {
    let matches: Baggage[] = [];
    if (/booking_id = \?/i.test(cleanSql)) {
      const bookingId = Number(params[0]);
      matches = store.baggage.filter(b => b.booking_id === bookingId);
    } else {
      const pnr = String(params[0]).trim().toUpperCase();
      const booking = store.bookings?.find(k => k.pnr_number.toUpperCase() === pnr);
      if (booking) {
        matches = store.baggage.filter(b => b.booking_id === booking.id);
      }
    }
    return matches.map(b => enrichBaggage(b, store));
  }

  // 12. SELECT baggage movements by baggage_id
  if (/SELECT.*FROM baggage_movements WHERE baggage_id = \?/i.test(cleanSql)) {
    const baggageId = Number(params[0]);
    return store.movements
      .filter(m => m.baggage_id === baggageId)
      .sort((a, b) => (a.id || 0) - (b.id || 0));
  }

  // 13. Statistics: COUNT queries
  if (/COUNT/i.test(cleanSql) && /FROM baggage/i.test(cleanSql)) {
    const total = store.baggage.length;
    const inTransit = store.baggage.filter(b => b.status === 'IN TRANSIT').length;
    const delayed = store.baggage.filter(b => b.status === 'DELAYED').length;
    const missing = store.baggage.filter(b => b.status === 'MISSING').length;
    const claimed = store.baggage.filter(b => b.status === 'CLAIMED').length;

    return [{
      total,
      inTransit,
      delayed,
      missing,
      claimed
    }];
  }

  // 14. SELECT all baggage with optional filters
  if (/SELECT.*FROM baggage/i.test(cleanSql)) {
    let result = store.baggage.map(b => enrichBaggage(b, store));

    if (/passenger_id\s*=\s*\?/i.test(cleanSql)) {
      const pid = Number(params[0]);
      result = result.filter(b => b.passenger_id === pid);
    }

    return result;
  }

  // 15. INSERT INTO baggage
  if (/INSERT INTO baggage\b/i.test(cleanSql)) {
    // params: [tag_number, booking_id, flight_id, passenger_id, weight, status, current_location]
    const newId = (store.baggage.length > 0 ? Math.max(...store.baggage.map(b => b.id || 0)) : 0) + 1;
    const newBag: Baggage = {
      id: newId,
      tag_number: String(params[0]).trim().toUpperCase(),
      booking_id: Number(params[1]),
      flight_id: Number(params[2]),
      passenger_id: Number(params[3]),
      weight: Number(params[4]),
      status: (params[5] as any) || 'CHECKED IN',
      current_location: String(params[6]),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.baggage.unshift(newBag);
    saveStore();
    return { insertId: newId, affectedRows: 1 };
  }

  // 16. UPDATE baggage
  if (/UPDATE baggage SET/i.test(cleanSql)) {
    const status = params[0];
    const location = params[1];
    const id = Number(params[2]);
    const item = store.baggage.find(b => b.id === id);
    if (item) {
      item.status = status;
      item.current_location = location;
      item.updated_at = new Date().toISOString();
    }
    saveStore();
    return { affectedRows: 1 };
  }

  // 17. INSERT INTO baggage_movements
  if (/INSERT INTO baggage_movements\b/i.test(cleanSql)) {
    const newId = (store.movements.length > 0 ? Math.max(...store.movements.map(m => m.id || 0)) : 0) + 1;
    const newMovement: BaggageMovement = {
      id: newId,
      baggage_id: Number(params[0]),
      timestamp: String(params[1]),
      status: params[2],
      location: String(params[3]),
      remarks: params[4] || undefined,
      created_at: new Date().toISOString()
    };
    store.movements.push(newMovement);
    saveStore();
    return { insertId: newId, affectedRows: 1 };
  }

  // 18. Incidents
  if (/SELECT.*FROM incidents/i.test(cleanSql)) {
    return store.incidents.map(inc => {
      const b = store.baggage.find(x => x.id === inc.baggage_id);
      const u = store.users.find(x => x.id === inc.reported_by);
      return {
        ...inc,
        tag_number: b?.tag_number || 'UNKNOWN',
        reporter_name: u?.name || 'Staff'
      };
    }).sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  }

  // 19. INSERT INTO incidents
  if (/INSERT INTO incidents\b/i.test(cleanSql)) {
    const newId = (store.incidents.length > 0 ? Math.max(...store.incidents.map(i => i.id || 0)) : 0) + 1;
    const newInc: Incident = {
      id: newId,
      baggage_id: Number(params[0]),
      reported_by: Number(params[1]),
      type: params[2],
      description: params[3],
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.incidents.unshift(newInc);
    saveStore();
    return { insertId: newId, affectedRows: 1 };
  }

  return [];
}
