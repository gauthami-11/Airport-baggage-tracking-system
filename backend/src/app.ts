import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.ts';
import baggageRoutes from './routes/baggageRoutes.ts';
import incidentRoutes from './routes/incidentRoutes.ts';
import { getPassengerDashboardHandler } from './controllers/baggageController.ts';
import { errorHandler } from './middleware/errorMiddleware.ts';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'BaggageTrack API', timestamp: new Date().toISOString() });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/baggage', baggageRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.get('/api/passenger/dashboard', getPassengerDashboardHandler);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
