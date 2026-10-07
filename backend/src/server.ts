import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.ts';
import { initializeDatabase } from './config/database.ts';

const PORT = process.env.PORT || 5000;

async function startStandaloneBackend() {
  await initializeDatabase();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`✈ BaggageTrack Backend API running on http://localhost:${PORT}`);
  });
}

startStandaloneBackend();
