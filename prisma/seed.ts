import { PrismaClient, ProjectStatus, LeadStage, LeadActivityType, PaymentStatus, PaymentMethod, ExpenseCategory } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Pre-hashed bcrypt value for the string "password"
const DUMMY_PASSWORD_HASH = '$2b$10$5tDRZFEx0lmbsVmoFGj0I.VlTfEXD9XpqcR80Gpkrn7Y0fOQyEJJO';

async function main() {
  console.log('Clearing database...');
  
  // Delete in reverse order of relationships
  await prisma.leadActivity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.teamPayment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.projectActivity.deleteMany();
  await prisma.projectNote.deleteMany();
  await prisma.project.deleteMany();
  await prisma.clientNote.deleteMany();
  await prisma.client.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding team members (founders)...');

  const founders = [
    {
      name: 'Asif',
      email: 'asif@orvynlabs.com',
      role: 'owner',
      title: 'Co-founder / Tech Lead',
      skills: ['React', 'Next.js', 'Node.js', 'TypeScript', 'Prisma'],
      phone: '+91 98765 43210',
      bio: 'Leading the technical direction and core architecture at Orvyn Labs.'
    },
    {
      name: 'Mubashir',
      email: 'mubashir@orvynlabs.com',
      role: 'owner',
      title: 'Co-founder / Creative Director',
      skills: ['UI/UX Design', 'Figma', 'Tailwind CSS', 'Branding', 'Framer Motion'],
      phone: '+91 98765 43211',
      bio: 'Crafting beautiful user experiences and maintaining the brand guidelines.'
    },
    {
      name: 'Adhil',
      email: 'adhil@orvynlabs.com',
      role: 'owner',
      title: 'Co-founder / Full-stack Developer',
      skills: ['PostgreSQL', 'Express', 'Next.js', 'Node.js', 'Docker'],
      phone: '+91 98765 43212',
      bio: 'Building scalable database backends and full-stack solutions.'
    },
    {
      name: 'Niyaf',
      email: 'niyaf@orvynlabs.com',
      role: 'owner',
      title: 'Co-founder / Operations Lead',
      skills: ['Project Management', 'Client Relations', 'QA Testing', 'Git', 'Agile'],
      phone: '+91 98765 43213',
      bio: 'Overseeing daily operations, client communications, and quality assurance.'
    }
  ];

  const seededUsers: any[] = [];
  const seededTeamMembers: any[] = [];

  for (const f of founders) {
    const user = await prisma.user.create({
      data: {
        name: f.name,
        email: f.email,
        passwordHash: DUMMY_PASSWORD_HASH,
        role: f.role,
      }
    });

    const teamMember = await prisma.teamMember.create({
      data: {
        userId: user.id,
        title: f.title,
        skills: f.skills,
        phone: f.phone,
        bio: f.bio
      }
    });

    seededUsers.push(user);
    seededTeamMembers.push(teamMember);
  }

  console.log(`Seeded ${seededUsers.length} team members.`);

  console.log('Seeding clients...');
  
  const clientsData = [
    {
      name: 'TechVibe Solutions',
      contactName: 'Sarah Connor',
      email: 'sarah@techvibe.io',
      phone: '+91 88877 66554',
      gstin: '29AAAAA1111A1Z1',
      website: 'https://techvibe.io',
      address: '12, MG Road, Indira Nagar',
      city: 'Bangalore',
      state: 'Karnataka'
    },
    {
      name: 'PixelKraft Media',
      contactName: 'Rahul Sharma',
      email: 'rahul@pixelkraft.in',
      phone: '+91 77766 55443',
      gstin: '32BBBBB2222B2Z2',
      website: 'https://pixelkraft.in',
      address: 'Building 4B, Infopark Phase II',
      city: 'Kochi',
      state: 'Kerala'
    },
    {
      name: 'Greenfield Ventures',
      contactName: 'Maria Jose',
      email: 'maria@greenfield.co',
      phone: '+91 99988 77665',
      website: 'https://greenfield.co',
      address: 'Greenfield Campus, IT Corridor',
      city: 'Chennai',
      state: 'Tamil Nadu'
    }
  ];

  const seededClients: any[] = [];
  for (const c of clientsData) {
    const client = await prisma.client.create({
      data: c
    });
    seededClients.push(client);

    // Seed a note for each client
    await prisma.clientNote.create({
      data: {
        clientId: client.id,
        content: `Initial client onboarding completed. Good communication channel established with ${c.contactName}.`,
        createdById: seededUsers[3].id // Niyaf (Operations)
      }
    });
  }

  console.log(`Seeded ${seededClients.length} clients.`);

  console.log('Seeding projects...');

  const projectsData = [
    {
      clientIndex: 0, // TechVibe
      name: 'E-commerce Redesign',
      description: 'Complete overhaul of the current e-commerce platform including mobile responsive design and fast checkout flow.',
      status: ProjectStatus.ONGOING,
      budget: 450000.00,
      progress: 45,
      techStack: ['Next.js', 'Tailwind CSS', 'Prisma', 'PostgreSQL'],
      startDate: new Date('2026-06-01'),
      deadline: new Date('2026-09-01'),
      members: [
        { memberIndex: 0, role: 'Tech Lead' }, // Asif
        { memberIndex: 1, role: 'UI/UX Designer' }, // Mubashir
        { memberIndex: 2, role: 'Full-stack Developer' } // Adhil
      ]
    },
    {
      clientIndex: 1, // PixelKraft
      name: 'Mobile App UI Kit',
      description: 'Designing a reusable design system and Figma UI kit for client\'s media production application.',
      status: ProjectStatus.COMPLETED,
      budget: 150000.00,
      progress: 100,
      techStack: ['Figma', 'Tailwind CSS', 'Framer Motion'],
      startDate: new Date('2026-05-01'),
      deadline: new Date('2026-06-15'),
      completedAt: new Date('2026-06-12'),
      members: [
        { memberIndex: 1, role: 'Lead UI/UX Designer' } // Mubashir
      ]
    },
    {
      clientIndex: 2, // Greenfield
      name: 'Corporate Website',
      description: 'Creating a high-performance landing page and corporate brochure site with SEO optimization.',
      status: ProjectStatus.REVIEW,
      budget: 200000.00,
      progress: 90,
      techStack: ['React', 'Next.js', 'Tailwind CSS'],
      startDate: new Date('2026-06-15'),
      deadline: new Date('2026-08-01'),
      members: [
        { memberIndex: 0, role: 'Developer' }, // Asif
        { memberIndex: 1, role: 'Designer' } // Mubashir
      ]
    },
    {
      clientIndex: 0, // TechVibe
      name: 'SaaS Dashboard Design',
      description: 'Dashboard wireframing and design iteration for their internal operational CRM metrics.',
      status: ProjectStatus.NEW,
      budget: 350000.00,
      progress: 0,
      techStack: ['Figma', 'React'],
      startDate: new Date('2026-07-20'),
      deadline: new Date('2026-10-20'),
      members: [
        { memberIndex: 1, role: 'Designer' }, // Mubashir
        { memberIndex: 3, role: 'Project Manager' } // Niyaf
      ]
    },
    {
      clientIndex: 2, // Greenfield
      name: 'AI Portfolio Portal',
      description: 'Interactive analytics dashboard displaying portfolio performance with AI forecasting features.',
      status: ProjectStatus.ON_HOLD,
      budget: 500000.00,
      progress: 20,
      techStack: ['Next.js', 'Python', 'Tailwind CSS', 'PostgreSQL'],
      startDate: new Date('2026-05-10'),
      deadline: new Date('2026-12-01'),
      members: [
        { memberIndex: 2, role: 'Lead Backend Developer' }, // Adhil
        { memberIndex: 0, role: 'Tech Lead' }, // Asif
        { memberIndex: 3, role: 'Project Manager' } // Niyaf
      ]
    }
  ];

  const seededProjects: any[] = [];
  for (const p of projectsData) {
    const project = await prisma.project.create({
      data: {
        clientId: seededClients[p.clientIndex].id,
        name: p.name,
        description: p.description,
        status: p.status,
        budget: p.budget,
        progress: p.progress,
        techStack: p.techStack,
        startDate: p.startDate,
        deadline: p.deadline,
        completedAt: p.completedAt
      }
    });
    seededProjects.push(project);

    // Create members mapping
    for (const m of p.members) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          teamMemberId: seededTeamMembers[m.memberIndex].id,
          roleOnProject: m.role
        }
      });
    }

    // Seed initial project notes
    await prisma.projectNote.create({
      data: {
        projectId: project.id,
        content: `Kickoff meeting completed. Initial constraints aligned and project members assigned.`,
        createdById: seededUsers[3].id // Niyaf
      }
    });

    // Seed activities
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        action: 'status_changed',
        detail: `Project initialized in status ${p.status}.`
      }
    });
  }

  console.log(`Seeded ${seededProjects.length} projects.`);

  console.log('Seeding payments...');

  const paymentsData = [
    {
      projectIndex: 0, // E-commerce Redesign
      clientIndex: 0,
      amount: 150000.00,
      method: PaymentMethod.UPI,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date('2026-06-05'),
      reference: 'UPI1234567890',
      notes: 'Initial 33% advance payment.',
      receiptNumber: 'RCPT-2026-0001'
    },
    {
      projectIndex: 1, // Mobile App UI Kit
      clientIndex: 1,
      amount: 150000.00,
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date('2026-06-15'),
      reference: 'TXN987654321',
      notes: 'Full payment upon completion.',
      receiptNumber: 'RCPT-2026-0002'
    },
    {
      projectIndex: 2, // Corporate Website
      clientIndex: 2,
      amount: 50000.00,
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date('2026-06-20'),
      reference: 'TXN555444333',
      notes: '25% advance payment.',
      receiptNumber: 'RCPT-2026-0003'
    },
    {
      projectIndex: 2, // Corporate Website
      clientIndex: 2,
      amount: 150000.00,
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PENDING,
      paidAt: new Date('2026-07-25'),
      notes: 'Milestone 2 - Deliverable review pending.',
    }
  ];

  for (const pay of paymentsData) {
    await prisma.payment.create({
      data: {
        projectId: seededProjects[pay.projectIndex].id,
        clientId: seededClients[pay.clientIndex].id,
        amount: pay.amount,
        method: pay.method,
        status: pay.status,
        paidAt: pay.paidAt,
        reference: pay.reference,
        notes: pay.notes,
        receiptNumber: pay.receiptNumber
      }
    });

    if (pay.status === PaymentStatus.COMPLETED) {
      await prisma.projectActivity.create({
        data: {
          projectId: seededProjects[pay.projectIndex].id,
          action: 'payment_received',
          detail: `Received payment of INR ${pay.amount.toLocaleString('en-IN')} via ${pay.method}.`
        }
      });
    }
  }

  console.log(`Seeded ${paymentsData.length} payments.`);

  console.log('Seeding expenses...');

  const expensesData = [
    {
      title: 'Vercel Pro Team Subscription',
      category: ExpenseCategory.SOFTWARE,
      amount: 3200.00,
      date: new Date('2026-07-01'),
      notes: 'Monthly billing for agency hosting and deployments.'
    },
    {
      title: 'Neon Database Serverless Scale Plan',
      category: ExpenseCategory.HOSTING,
      amount: 1600.00,
      date: new Date('2026-07-05'),
      notes: 'Database instance serverless cost.',
      projectIndex: 0 // E-commerce Redesign
    },
    {
      title: 'orvynlabs.com domains renewal',
      category: ExpenseCategory.DOMAINS,
      amount: 1100.00,
      date: new Date('2026-05-12'),
      notes: 'Annual domain registrar fees.'
    },
    {
      title: 'Coffee and snacks for review meetings',
      category: ExpenseCategory.OFFICE,
      amount: 850.00,
      date: new Date('2026-07-10'),
      notes: 'Founder weekly sync refreshments.'
    },
    {
      title: 'Client onsite review travel',
      category: ExpenseCategory.TRAVEL,
      amount: 2200.00,
      date: new Date('2026-06-20'),
      notes: 'Cab fare and dinner during final design approval with Sarah.',
      projectIndex: 0 // E-commerce Redesign
    }
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({
      data: {
        title: exp.title,
        category: exp.category,
        amount: exp.amount,
        date: exp.date,
        notes: exp.notes,
        projectId: exp.projectIndex !== undefined ? seededProjects[exp.projectIndex].id : null
      }
    });
  }

  console.log(`Seeded ${expensesData.length} expenses.`);

  console.log('Seeding team payments (payroll)...');
  
  // Seed some founder payroll obligations/payments
  const teamPaymentsData = [
    {
      teamMemberIndex: 0, // Asif
      projectIndex: 0,
      amount: 50000.00,
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.BANK_TRANSFER,
      paidAt: new Date('2026-06-30'),
      notes: 'Monthly payout for E-commerce tech lead deliverable.'
    },
    {
      teamMemberIndex: 1, // Mubashir
      projectIndex: 1,
      amount: 30000.00,
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.UPI,
      paidAt: new Date('2026-06-15'),
      notes: 'UI Kit design milestone completion payout.'
    },
    {
      teamMemberIndex: 2, // Adhil
      projectIndex: 0,
      amount: 40000.00,
      status: PaymentStatus.PENDING,
      notes: 'Backend setup milestone deliverable payout.'
    }
  ];

  for (const tp of teamPaymentsData) {
    await prisma.teamPayment.create({
      data: {
        teamMemberId: seededTeamMembers[tp.teamMemberIndex].id,
        projectId: seededProjects[tp.projectIndex].id,
        amount: tp.amount,
        status: tp.status,
        method: tp.method,
        paidAt: tp.paidAt,
        notes: tp.notes
      }
    });
  }

  console.log(`Seeded ${teamPaymentsData.length} team payments.`);

  console.log('Seeding leads...');

  const leadsData = [
    {
      name: 'John Smith',
      company: 'Smith Tech Solutions',
      email: 'john@smithtech.co',
      phone: '+1 555 019 2834',
      source: 'website',
      stage: LeadStage.NEW,
      sortOrder: 0,
      estimatedValue: 300000.00,
      notes: 'Lead submitted via contact form. Interested in custom customer portal software.',
      activities: [
        { type: LeadActivityType.NOTE, content: 'Lead record generated automatically from website submission.' }
      ]
    },
    {
      name: 'Amina Shah',
      company: 'Kala Boutique',
      email: 'amina@kalaboutique.in',
      phone: '+91 99000 88000',
      source: 'instagram',
      stage: LeadStage.CONTACTED,
      sortOrder: 0,
      estimatedValue: 120000.00,
      notes: 'Inquired through Instagram DM about building a Shopify store and brand identity.',
      activities: [
        { type: LeadActivityType.NOTE, content: 'Instagram inquiry received.' },
        { type: LeadActivityType.WHATSAPP, content: 'Sent brochure pdf and WhatsApp message listing details requested.' }
      ]
    },
    {
      name: 'Vikram Malhotra',
      company: 'Velo Labs',
      email: 'vikram@velolabs.com',
      phone: '+91 91919 82828',
      source: 'referral',
      stage: LeadStage.QUALIFIED,
      sortOrder: 0,
      estimatedValue: 600000.00,
      notes: 'Referred by Greenfield Ventures. Wants a Next.js database analytics portal.',
      activities: [
        { type: LeadActivityType.CALL, content: 'Discovery call completed. Technical requirements aligned.' },
        { type: LeadActivityType.NOTE, content: 'Client qualified. Budget fits our agency minimum and scope is realistic.' }
      ]
    },
    {
      name: 'Helen Chen',
      company: 'Lotus Travel Group',
      email: 'helen@lotustravel.sg',
      phone: '+65 9123 4567',
      source: 'cold outreach',
      stage: LeadStage.PROPOSAL_SENT,
      sortOrder: 0,
      estimatedValue: 400000.00,
      notes: 'Responded to LinkedIn cold message. Interested in full SEO and website speed optimization package.',
      activities: [
        { type: LeadActivityType.CALL, content: 'Requirements definition meeting.' },
        { type: LeadActivityType.EMAIL, content: 'Sent comprehensive proposal PDF and draft agreement contract.' }
      ]
    },
    {
      name: 'Kabeer Das',
      company: 'Organic Farms',
      email: 'kabeer@organicfarms.in',
      phone: '+91 95000 12000',
      source: 'referral',
      stage: LeadStage.NEGOTIATION,
      sortOrder: 0,
      estimatedValue: 250000.00,
      notes: 'Negotiating payment terms for web development project. Wants split into 4 milestones.',
      activities: [
        { type: LeadActivityType.MEETING, content: 'Negotiation meeting held at client office. Decided to review 4-milestone plan.' }
      ]
    }
  ];

  for (const l of leadsData) {
    const lead = await prisma.lead.create({
      data: {
        name: l.name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        source: l.source,
        stage: l.stage,
        sortOrder: l.sortOrder,
        estimatedValue: l.estimatedValue,
        notes: l.notes
      }
    });

    for (const act of l.activities) {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: act.type,
          content: act.content,
          createdById: seededUsers[3].id // Niyaf
        }
      });
    }
  }

  console.log(`Seeded ${leadsData.length} leads.`);
  
  console.log('Database seeding successfully completed!');
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
