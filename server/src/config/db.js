/**
 * config/db.js
 * MongoDB connection with automatic retry and graceful shutdown.
 */
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      // Required for Atlas Vector Search – do not use legacy topology
      directConnection: false,
    });

    isConnected = true;
    logger.info('✅  MongoDB connected');

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected – will reconnect automatically');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });
  } catch (err) {
    logger.error({ err }, 'MongoDB initial connection failed');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed (SIGTERM)');
  process.exit(0);
});
