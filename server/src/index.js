/**
 * src/index.js
 * LegalSahayak Express server entry point.
 * Sets up security middleware, routes, Socket.IO, and global error handler.
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimit.js';

// ── Route imports ────────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import documentRoutes from './modules/documents/documents.routes.js';
import advocateRoutes from './modules/advocates/advocates.routes.js';
import bookingRoutes from './modules/bookings/bookings.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

// ── Socket.IO ────────────────────────────────────────────────
import { registerConsultationSockets } from './sockets/consultationSocket.js';
import { startBackgroundJobs } from './jobs/index.js';

const app = express();
const httpServer = createServer(app);

// ── Security headers ─────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", env.CLIENT_URL],
      },
    },
  }),
);

// ── CORS ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // required for httpOnly cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Webhook endpoint: needs raw body BEFORE json() middleware ─
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ── NoSQL injection sanitisation ────────────────────────────
app.use(mongoSanitize());

// ── Rate limiting (broad) ────────────────────────────────────
app.use('/api/', generalLimiter);

// ── Request logging ──────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/agent/conversations', chatRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/advocates', advocateRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', bookingRoutes); // /payments/verify and /payments/webhook share the router
app.use('/api/v1/admin', adminRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.NODE_ENV }));

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// ── Global error handler ─────────────────────────────────────
app.use(errorHandler);

// ── Socket.IO ────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});
registerConsultationSockets(io);

// ── Bootstrap ────────────────────────────────────────────────
async function bootstrap() {
  await connectDB();
  startBackgroundJobs();
  httpServer.listen(env.PORT, () => {
    logger.info(`🚀  LegalSahayak server running on http://localhost:${env.PORT}`);
  });
}

bootstrap();
