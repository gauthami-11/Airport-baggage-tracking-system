import {
  Baggage,
  BaggageMovement,
  Incident,
  DashboardStatistics,
  User,
  BaggageStatus,
  IncidentType
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

  // Baggage Tracking (Public)
  async getBaggageByTag(tagNumber: string): Promise<Baggage> {
    const cleanTag = tagNumber.trim().toUpperCase();
    const res = await fetch(`${API_BASE}/baggage/${cleanTag}`);
    return handleResponse<Baggage>(res);
  },

  async getMovementsByTag(tagNumber: string): Promise<BaggageMovement[]> {
    const cleanTag = tagNumber.trim().toUpperCase();
    const res = await fetch(`${API_BASE}/baggage/${cleanTag}/movements`);
    return handleResponse<BaggageMovement[]>(res);
  },

  // Staff Baggage Operations
  async getAllBaggage(filters?: { status?: string; search?: string }): Promise<Baggage[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/baggage${queryStr}`, {
      headers: getAuthHeader()
    });
    return handleResponse<Baggage[]>(res);
  },

  async getStatistics(): Promise<DashboardStatistics> {
    const res = await fetch(`${API_BASE}/baggage/statistics`, {
      headers: getAuthHeader()
    });
    return handleResponse<DashboardStatistics>(res);
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
  async getIncidents(status?: string): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/incidents${queryStr}`, {
      headers: getAuthHeader()
    });
    return handleResponse<Incident[]>(res);
  },

  async reportIncident(data: {
    baggageTag: string;
    type: IncidentType;
    description: string;
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
    flights: any[];
    recentBaggage: Baggage[];
  }> {
    const res = await fetch(`${API_BASE}/passenger/dashboard`, {
      headers: getAuthHeader()
    });
    return handleResponse(res);
  }
};
