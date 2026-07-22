import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Updating user profile images...');

  const updates = [
    { email: 'asif@orvynlabs.com', image: '/avatars/asif.jpg' },
    { email: 'niyaf@orvynlabs.com', image: '/avatars/niyaf.png' },
    { email: 'mubashir@orvynlabs.com', image: '/avatars/mubashir.png' },
    { email: 'adhil@orvynlabs.com', image: '/avatars/adhil.png' },
  ];

  for (const u of updates) {
    const res = await prisma.user.updateMany({
      where: { email: u.email },
      data: { image: u.image },
    });
    console.log(`Updated ${u.email} -> ${u.image} (${res.count} updated)`);
  }

  console.log('Done updating user images.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
