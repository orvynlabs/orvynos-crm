import 'dotenv/config';

// In all local environments (not on Vercel), bypass the PgBouncer pooler to prevent auth and idle drops
if (!process.env.VERCEL && process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('-pooler', '');
}

import { prisma } from './src/lib/db';

async function main() {
  console.log('Clearing receiptKeys in database...');
  const res = await prisma.payment.updateMany({
    data: {
      receiptKey: null,
    },
  });
  console.log(`Successfully cleared receiptKey for ${res.count} payments!`);
  await prisma.$disconnect();
}

main().catch(console.error);
