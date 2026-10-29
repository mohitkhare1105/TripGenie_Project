import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import itineraryRoutes from './routes/itineraryRoutes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();

// Configure CORS
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = clientOrigin.includes(',')
  ? clientOrigin.split(',').map((origin) => origin.trim())
  : clientOrigin;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Body parser with size limit to prevent oversized payload attacks
app.use(express.json({ limit: '100kb' }));

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'TripGenie AI backend is running',
  });
});

// Itinerary Routes
app.use('/api/itineraries', itineraryRoutes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
