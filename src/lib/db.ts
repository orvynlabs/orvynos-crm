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
    max: 5, // Optimized max connections for Neon Free Tier limit (20 connections max across app)
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false },
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
export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isConnectionError =
        err.message?.includes('timeout') ||
        err.message?.includes('terminated') ||
        err.message?.includes('Connection') ||
        err.code === 'ECONNRESET';

      if (!isConnectionError || attempt > retries) {
        throw err;
      }

      console.warn(`[Database Retry] Attempt ${attempt}/${retries} after transient connection error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  return fn();
}
