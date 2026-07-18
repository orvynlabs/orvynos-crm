import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient; pool: Pool };

let connectionString = process.env.DATABASE_URL;

if (connectionString && connectionString.startsWith('"') && connectionString.endsWith('"')) {
  connectionString = connectionString.substring(1, connectionString.length - 1);
}

// In all local environments (not on Vercel), bypass the PgBouncer pooler to prevent auth and idle drops
if (!process.env.VERCEL && connectionString) {
  connectionString = connectionString.replace('-pooler', '');
}

if (!globalForPrisma.pool) {
  const poolConfig: any = {
    max: 10,                        // Allow up to 10 connections for concurrent queries
    idleTimeoutMillis: 10000,      // Terminate idle clients after 10s to keep pool fresh
    connectionTimeoutMillis: 5000, // Fail fast (5s) if the database is cold-starting or down
  };

  if (connectionString) {
    try {
      const parsedUrl = new URL(connectionString);
      poolConfig.user = decodeURIComponent(parsedUrl.username);
      poolConfig.password = decodeURIComponent(parsedUrl.password);
      poolConfig.host = parsedUrl.hostname;
      poolConfig.port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432;
      poolConfig.database = parsedUrl.pathname.substring(1);
      
      const sslMode = parsedUrl.searchParams.get('sslmode');
      if (sslMode === 'verify-full' || sslMode === 'require' || parsedUrl.searchParams.has('ssl')) {
        poolConfig.ssl = { rejectUnauthorized: false };
      }
    } catch (err) {
      console.error('Prisma DB helper: failed to parse connection string. Falling back to raw string:', err);
      poolConfig.connectionString = connectionString;
    }
  } else {
    poolConfig.connectionString = connectionString;
  }

  globalForPrisma.pool = new Pool(poolConfig);

  // Handle unexpected errors on idle pool connections to prevent crashes
  globalForPrisma.pool.on('error', (err) => {
    console.error('Unexpected error on idle database connection:', err);
  });
}

if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg(globalForPrisma.pool);
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma;
export const pool = globalForPrisma.pool;

