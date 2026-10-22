import {
  Baggage,
  BaggageMovement,
  Incident,
  DashboardStatistics,
  User,
  Flight,
  BaggageStatus,
  IncidentType,
  PNRBaggageLookupResponse
} from '../types/index.ts';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('bt_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const data = await res.json();
      if (data && data.message) {
        errorMsg = data.message;
      }
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ message: string; token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  // Flights Lookup
  async getFlights(): Promise<Flight[]> {
    const res = await fetch(`${API_BASE}/flights?_t=${Date.now()}`, {
      cache: 'no-store'
    });
    return handleResponse<Flight[]>(res);
  },

  // Baggage Tracking (Public by Tag)
  async getBaggageByTag(tagNumber: string): Promise<Baggage> {
    const cleanTag = tagNumber.trim().toUpperCase();
    const res = await fetch(`${API_BASE}/baggage/${cleanTag}?_t=${Date.now()}`, {
      cache: 'no-store'
    });
    return handleResponse<Baggage>(res);
  },

  // Baggage Tracking (Public by PNR)
  async getBaggageByPNR(pnrNumber: string): Promise<PNRBaggageLookupResponse> {
    const cleanPNR = pnrNumber.trim().toUpperCase();
    const res = await fetch(`${API_BASE}/bookings/${cleanPNR}/baggage?_t=${Date.now()}`, {
      cache: 'no-store'
    });
    return handleResponse<PNRBaggageLookupResponse>(res);
  },

  async getMovementsByTag(tagNumber: string): Promise<BaggageMovement[]> {
    const cleanTag = tagNumber.trim().toUpperCase();
    const res = await fetch(`${API_BASE}/baggage/${cleanTag}/movements?_t=${Date.now()}`, {
      cache: 'no-store'
    });
    return handleResponse<BaggageMovement[]>(res);
  },

  // Staff Baggage Operations
  async getAllBaggage(filters?: { status?: string; search?: string }): Promise<Baggage[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    params.append('_t', String(Date.now()));

    const res = await fetch(`${API_BASE}/baggage?${params.toString()}`, {
      headers: getAuthHeader(),
      cache: 'no-store'
    });
    return handleResponse<Baggage[]>(res);
  },

  async getStatistics(): Promise<DashboardStatistics> {
    const res = await fetch(`${API_BASE}/baggage/statistics?_t=${Date.now()}`, {
      headers: getAuthHeader(),
      cache: 'no-store'
    });
    return handleResponse<DashboardStatistics>(res);
  },

  // Staff Register New Baggage
  async registerBaggage(data: {
    tagNumber: string;
    pnrNumber: string;
    passengerName?: string;
    flightNumber: string;
    weight: number;
    status?: BaggageStatus;
    currentLocation: string;
    remarks?: string;
  }): Promise<{ message: string; tagNumber: string; pnrNumber: string; baggage: Baggage }> {
    const res = await fetch(`${API_BASE}/baggage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateBaggageStatus(
    tagNumber: string,
    data: { status: BaggageStatus; location: string; remarks?: string }
  ): Promise<{ message: string; baggage: Baggage; movement: BaggageMovement }> {
    const cleanTag = tagNumber.trim().toUpperCase();
    const res = await fetch(`${API_BASE}/baggage/${cleanTag}/movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Incident Operations
  async getIncidents(filters?: { status?: string; passengerId?: number } | string): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (typeof filters === 'string') {
      if (filters !== 'ALL') params.append('status', filters);
    } else if (filters) {
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.passengerId) params.append('passengerId', String(filters.passengerId));
    }
    params.append('_t', String(Date.now()));

    const res = await fetch(`${API_BASE}/incidents?${params.toString()}`, {
      headers: getAuthHeader(),
      cache: 'no-store'
    });
    return handleResponse<Incident[]>(res);
  },

  async reportIncident(data: {
    baggageTag: string;
    type: IncidentType;
    description: string;
    passengerId?: number;
  }): Promise<{ message: string; incident: Incident }> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Passenger Dashboard
  async getPassengerDashboard(): Promise<{
    passenger: User;
    flightsCount: number;
    baggageCount: number;
    bookings?: any[];
    flights: any[];
    recentBaggage: Baggage[];
  }> {
    const res = await fetch(`${API_BASE}/passenger/dashboard?_t=${Date.now()}`, {
      headers: getAuthHeader(),
      cache: 'no-store'
    });
    return handleResponse(res);
  }
};
