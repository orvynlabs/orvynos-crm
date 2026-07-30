import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function purge() {
  console.log('Starting full database purge of dummy data...');

  try {
    // Delete in reverse order of foreign key relationships
    const leadActivities = await prisma.leadActivity.deleteMany();
    console.log(`Deleted ${leadActivities.count} lead activities.`);

    const leads = await prisma.lead.deleteMany();
    console.log(`Deleted ${leads.count} leads.`);

    const docVersions = await prisma.documentVersion.deleteMany();
    console.log(`Deleted ${docVersions.count} document versions.`);

    const docs = await prisma.document.deleteMany();
    console.log(`Deleted ${docs.count} documents.`);

    const proposals = await prisma.proposal.deleteMany();
    console.log(`Deleted ${proposals.count} proposals.`);

    const invoices = await prisma.invoice.deleteMany();
    console.log(`Deleted ${invoices.count} invoices.`);

    const agreements = await prisma.agreement.deleteMany();
    console.log(`Deleted ${agreements.count} agreements.`);

    const quotations = await prisma.quotation.deleteMany();
    console.log(`Deleted ${quotations.count} quotations.`);

    const payments = await prisma.payment.deleteMany();
    console.log(`Deleted ${payments.count} payments.`);

    const teamPayments = await prisma.teamPayment.deleteMany();
    console.log(`Deleted ${teamPayments.count} team payments.`);

    const expenses = await prisma.expense.deleteMany();
    console.log(`Deleted ${expenses.count} expenses.`);

    const projectMembers = await prisma.projectMember.deleteMany();
    console.log(`Deleted ${projectMembers.count} project members.`);

    const projectActivities = await prisma.projectActivity.deleteMany();
    console.log(`Deleted ${projectActivities.count} project activities.`);

    const projectNotes = await prisma.projectNote.deleteMany();
    console.log(`Deleted ${projectNotes.count} project notes.`);

    const projects = await prisma.project.deleteMany();
    console.log(`Deleted ${projects.count} projects.`);

    const clientNotes = await prisma.clientNote.deleteMany();
    console.log(`Deleted ${clientNotes.count} client notes.`);

    const clients = await prisma.client.deleteMany();
    console.log(`Deleted ${clients.count} clients.`);

    if ((prisma as any).dailyUpdate) {
      const dailyUpdates = await (prisma as any).dailyUpdate.deleteMany();
      console.log(`Deleted ${dailyUpdates.count} daily updates.`);
    }

    console.log('Database dummy data purge complete!');
    
    const userCount = await prisma.user.count();
    const teamCount = await prisma.teamMember.count();
    console.log(`Preserved ${userCount} users and ${teamCount} team members for login access.`);

  } catch (error) {
    console.error('Error purging database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

purge();
