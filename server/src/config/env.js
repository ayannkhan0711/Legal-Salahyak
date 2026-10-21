/**
 * config/env.js
 * Centralised env loading and validation.
 * Throws on startup if required variables are missing.
 */
import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be ≥ 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be ≥ 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be a 64-char hex string (32 bytes)'),

  AI_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_EMBEDDING_MODEL: z.string().default('text-embedding-004'),
  GEMINI_CHAT_MODEL: z.string().default('gemini-1.5-flash'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  OPENAI_CHAT_MODEL: z.string().default('gpt-4o-mini'),



  PLATFORM_COMMISSION_PERCENT: z.coerce.number().min(0).max(100).default(15),
  GST_RATE_PERCENT: z.coerce.number().default(18),
  MIN_CONSULTATION_FEE_PAISE: z.coerce.number().default(30000),
  DOCUMENT_RETENTION_DAYS: z.coerce.number().default(30),

  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('LegalSahayak <noreply@legalsahayak.in>'),

  SMS_PROVIDER: z.string().default(''),
  TWILIO_ACCOUNT_SID: z.string().default(''),
  TWILIO_AUTH_TOKEN: z.string().default(''),
  TWILIO_FROM_NUMBER: z.string().default(''),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(15),

  ATLAS_VECTOR_INDEX: z.string().default('vector_index'),
  VECTOR_TOP_K: z.coerce.number().default(6),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@legalsahayak.in'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('Admin@123456'),
  SEED_ADMIN_NAME: z.string().default('Platform Admin'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
