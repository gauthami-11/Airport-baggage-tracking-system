import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.ts';
import baggageRoutes from './routes/baggageRoutes.ts';
import incidentRoutes from './routes/incidentRoutes.ts';
import { getPassengerDashboardHandler } from './controllers/baggageController.ts';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'BaggageTrack API', timestamp: new Date().toISOString() });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/baggage', baggageRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.get('/api/passenger/dashboard', getPassengerDashboardHandler);

  // Centralized Error Handling
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error:', err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Internal server error.' });
  });

  return app;
}
