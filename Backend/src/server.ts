import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { logger } from './utils/logger';

// Validate production configuration on startup
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.GEMINI_API_KEY?.trim()) {
  logger.error('CRITICAL: GEMINI_API_KEY environment variable is required in production.');
  process.exit(1);
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const server = app.listen(PORT, () => {
  logger.info(
    `TripGenie AI backend server running on port ${PORT} [${
      process.env.NODE_ENV || 'development'
    }]`
  );
});

// Graceful shutdown handling
let isShuttingDown = false;

export const gracefulShutdown = (signal: string): void => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      logger.error('Error occurred during server close', { error: err.message });
      process.exit(1);
    }
    logger.info('Server closed cleanly. Process exiting.');
    process.exit(0);
  });

  // Force exit if active connections take longer than 10 seconds
  const forceTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000);

  if (typeof forceTimer.unref === 'function') forceTimer.unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
