import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import itineraryRoutes from './routes/itineraryRoutes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './utils/logger';

// Load environment variables
dotenv.config();

const app: Application = express();

// 1. Disable server signature header
app.disable('x-powered-by');

// 2. HTTP Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // Pure API server; does not serve HTML documents
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 3. Request Tracing with X-Request-ID
app.use(requestIdMiddleware);

// 4. CORS Configuration
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';
const allowedOriginsList = clientOrigin.split(',').map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, mobile clients where origin is undefined
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOriginsList.includes(origin)) {
        return callback(null, true);
      }

      // In non-production, permit standard localhost ports
      if (!isProduction && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS policy violation: Origin '${origin}' is not allowed`)
      );
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
    ],
    credentials: true,
  })
);

// 5. Body parser with strict request-size limit (100kb)
app.use(express.json({ limit: '100kb' }));

// 6. Health Check Endpoint (safe, no external Gemini quota consumed)
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'TripGenie AI backend is running',
    data: {
      status: 'healthy',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

// 7. API Routes
app.use('/api/itineraries', itineraryRoutes);

// 8. 404 Handler for undefined routes
app.use(notFoundHandler);

// 9. Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
