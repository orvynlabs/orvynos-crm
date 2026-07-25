import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient; pool: Pool };

let connectionString = process.env.DATABASE_URL;

if (connectionString && connectionString.startsWith('"') && connectionString.endsWith('"')) {
  connectionString = connectionString.substring(1, connectionString.length - 1);
}

if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 10000, // Reduced from 30s to 10s for Vercel Serverless
    connectionTimeoutMillis: 10000, // Reduced to 10s
    maxUses: 7500, // Automatically close connections before they age out
    ssl: { rejectUnauthorized: false },
    allowExitOnIdle: true, // Crucial for Vercel functions to exit cleanly
  });

  globalForPrisma.pool.on('error', (err) => {
    console.warn('Notice: Idle DB connection ended by Neon pooler:', err.message);
  });
}

if (!globalForPrisma.prisma || !(globalForPrisma.prisma as any).dailyUpdate) {
  const adapter = new PrismaPg(globalForPrisma.pool);
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma;
export const pool = globalForPrisma.pool;

/**
 * Executes a database operation with automatic retry logic if the connection is dropped or timing out.
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const msg = (err.message || '').toLowerCase();
      const isConnectionError =
        msg.includes('timeout') ||
        msg.includes('terminated') ||
        msg.includes('connection') ||
        msg.includes('closed') ||
        msg.includes('socket') ||
        err.code === 'ECONNRESET' ||
        err.code === '57P01';

      if (!isConnectionError || attempt > retries) {
        throw err;
      }

      console.warn(`[Database Retry] Attempt ${attempt}/${retries} after transient connection error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  return fn();
}

