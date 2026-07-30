import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Pre-hashed bcrypt value for the string "password"
const DUMMY_PASSWORD_HASH = '$2b$10$5tDRZFEx0lmbsVmoFGj0I.VlTfEXD9XpqcR80Gpkrn7Y0fOQyEJJO';

async function main() {
  console.log('Seeding core team members (founders)...');

  const founders = [
    {
      name: 'Asif',
      email: 'asif@orvynlabs.com',
      image: '/avatars/asif.jpg',
      role: 'owner',
      title: 'Co-founder / Tech Lead',
      skills: ['React', 'Next.js', 'Node.js', 'TypeScript', 'Prisma'],
      phone: '+91 98765 43210',
      bio: 'Leading the technical direction and core architecture at Orvyn Labs.'
    },
    {
      name: 'Mubashir',
      email: 'mubashir@orvynlabs.com',
      image: '/avatars/mubashir.png',
      role: 'owner',
      title: 'Co-founder / Creative Director',
      skills: ['UI/UX Design', 'Figma', 'Tailwind CSS', 'Branding', 'Framer Motion'],
      phone: '+91 98765 43211',
      bio: 'Crafting beautiful user experiences and maintaining the brand guidelines.'
    },
    {
      name: 'Adhil',
      email: 'adhil@orvynlabs.com',
      image: '/avatars/adhil.png',
      role: 'owner',
      title: 'Co-founder / Full-stack Developer',
      skills: ['PostgreSQL', 'Express', 'Next.js', 'Node.js', 'Docker'],
      phone: '+91 98765 43212',
      bio: 'Building scalable database backends and full-stack solutions.'
    },
    {
      name: 'Niyaf',
      email: 'niyaf@orvynlabs.com',
      image: '/avatars/niyaf.png',
      role: 'owner',
      title: 'Co-founder / Operations Lead',
      skills: ['Project Management', 'Client Relations', 'QA Testing', 'Git', 'Agile'],
      phone: '+91 98765 43213',
      bio: 'Overseeing daily operations, client communications, and quality assurance.'
    }
  ];

  for (const f of founders) {
    let user = await prisma.user.findUnique({
      where: { email: f.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: f.name,
          email: f.email,
          passwordHash: DUMMY_PASSWORD_HASH,
          role: f.role,
          image: f.image,
        }
      });
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { userId: user.id }
    });

    if (!teamMember) {
      await prisma.teamMember.create({
        data: {
          userId: user.id,
          title: f.title,
          skills: f.skills,
          phone: f.phone,
          bio: f.bio
        }
      });
    }
  }

  console.log('Core team members successfully initialized (0 dummy data).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
