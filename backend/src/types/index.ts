export type UserRole = 'PASSENGER' | 'STAFF';

export type BaggageStatus =
  | 'CHECKED IN'
  | 'SECURITY'
  | 'SORTED'
  | 'LOADED'
  | 'IN TRANSIT'
  | 'ARRIVED'
  | 'DELAYED'
  | 'MISSING'
  | 'CLAIMED';

export type IncidentType =
  | 'DAMAGED BAGGAGE'
  | 'DELAYED'
  | 'MISSING'
  | 'WRONG DESTINATION'
  | 'SECURITY ISSUE'
  | 'OTHER';

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  created_at?: string;
}

export interface Flight {
  id: number;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  status: string;
}

export interface PassengerBooking {
  id: number;
  pnr_number: string;
  passenger_id: number;
  flight_id: number;
  created_at?: string;
  // Joined fields
  passenger_name?: string;
  passenger_email?: string;
  flight_number?: string;
  origin?: string;
  destination?: string;
  baggage_count?: number;
}

export interface Baggage {
  id: number;
  tag_number: string;
  booking_id?: number;
  flight_id: number;
  passenger_id: number;
  weight: number;
  status: BaggageStatus;
  current_location: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  pnr_number?: string;
  flight_number?: string;
  origin?: string;
  destination?: string;
  passenger_name?: string;
  passenger_email?: string;
}

export interface BaggageMovement {
  id?: number;
  baggage_id: number;
  timestamp: string;
  status: BaggageStatus;
  location: string;
  remarks?: string;
  created_at?: string;
}

export interface Incident {
  id?: number;
  baggage_id: number;
  reported_by: number;
  type: IncidentType;
  description: string;
  status: IncidentStatus;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  tag_number?: string;
  reporter_name?: string;
  reporter_email?: string;
}

export interface DashboardStatistics {
  total: number;
  inTransit: number;
  delayed: number;
  missing: number;
  claimed: number;
}

export interface PNRBaggageLookupResponse {
  pnr_number: string;
  passenger_name: string;
  flight_number: string;
  origin: string;
  destination: string;
  baggage: Baggage[];
}
