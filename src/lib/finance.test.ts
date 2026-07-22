import './test-setup';
import { mockPrisma } from './test-setup';
import assert from 'node:assert';
import test from 'node:test';

import {
  getProjectPendingAmount,
  getClientTotalPaid,
  getTotalRevenue,
  getTotalExpenses,
  getNetProfit,
  getTeamMemberTotalPaid,
  getTeamMemberPendingAmount,
} from './finance';

test('Financial Calculations Unit Tests', async (t) => {
  
  await t.test('getProjectPendingAmount returns remaining budget', async () => {
    // Mock project budget = 1000
    mockPrisma.project.findUnique = async (args: any) => {
      assert.strictEqual(args.where.id, 'proj-123');
      return { budget: 1000 };
    };

    // Mock completed payments sum = 400
    mockPrisma.payment.aggregate = async (args: any) => {
      assert.strictEqual(args.where.projectId, 'proj-123');
      assert.strictEqual(args.where.status, 'COMPLETED');
      return { _sum: { amount: 400 } };
    };

    const pending = await getProjectPendingAmount('proj-123');
    assert.strictEqual(pending, 600); // 1000 - 400 = 600
  });

  await t.test('getProjectPendingAmount handles no payments', async () => {
    mockPrisma.project.findUnique = async () => ({ budget: 500 });
    mockPrisma.payment.aggregate = async () => ({ _sum: { amount: null } });

    const pending = await getProjectPendingAmount('proj-456');
    assert.strictEqual(pending, 500);
  });

  await t.test('getProjectPendingAmount returns 0 if overpaid', async () => {
    mockPrisma.project.findUnique = async () => ({ budget: 500 });
    mockPrisma.payment.aggregate = async () => ({ _sum: { amount: 600 } });

    const pending = await getProjectPendingAmount('proj-789');
    assert.strictEqual(pending, 0); // budget 500, paid 600 => 0 pending
  });

  await t.test('getClientTotalPaid returns correct sum', async () => {
    mockPrisma.payment.aggregate = async (args: any) => {
      assert.strictEqual(args.where.clientId, 'client-123');
      assert.strictEqual(args.where.status, 'COMPLETED');
      return { _sum: { amount: 750.50 } };
    };

    const totalPaid = await getClientTotalPaid('client-123');
    assert.strictEqual(totalPaid, 750.50);
  });

  await t.test('getTotalRevenue filters by date range', async () => {
    mockPrisma.payment.aggregate = async (args: any) => {
      assert.strictEqual(args.where.status, 'COMPLETED');
      assert.ok(args.where.paidAt.gte instanceof Date);
      assert.ok(args.where.paidAt.lte instanceof Date);
      return { _sum: { amount: 1500 } };
    };

    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');
    const revenue = await getTotalRevenue({ start, end });
    assert.strictEqual(revenue, 1500);
  });

  await t.test('getTotalExpenses filters by date range', async () => {
    mockPrisma.expense.aggregate = async (args: any) => {
      assert.ok(args.where.date.gte instanceof Date);
      assert.ok(args.where.date.lte instanceof Date);
      return { _sum: { amount: 300 } };
    };

    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');
    const expenses = await getTotalExpenses({ start, end });
    assert.strictEqual(expenses, 300);
  });

  await t.test('getNetProfit returns revenue minus expenses', async () => {
    mockPrisma.payment.aggregate = async () => {
      return { _sum: { amount: 2000 } };
    };

    mockPrisma.expense.aggregate = async () => {
      return { _sum: { amount: 800 } };
    };

    const profit = await getNetProfit();
    assert.strictEqual(profit, 1200); // 2000 - 800 = 1200
  });

  await t.test('getTeamMemberTotalPaid returns correct sum for completed payments', async () => {
    mockPrisma.teamPayment = mockPrisma.teamPayment || {};
    mockPrisma.teamPayment.aggregate = async (args: any) => {
      assert.strictEqual(args.where.teamMemberId, 'tm-123');
      assert.strictEqual(args.where.status, 'COMPLETED');
      return { _sum: { amount: 45000 } };
    };

    const totalPaid = await getTeamMemberTotalPaid('tm-123');
    assert.strictEqual(totalPaid, 45000);
  });

  await t.test('getTeamMemberPendingAmount returns correct sum for pending payments', async () => {
    mockPrisma.teamPayment = mockPrisma.teamPayment || {};
    mockPrisma.teamPayment.aggregate = async (args: any) => {
      assert.strictEqual(args.where.teamMemberId, 'tm-123');
      assert.strictEqual(args.where.status, 'PENDING');
      return { _sum: { amount: 15000 } };
    };

    const pendingAmount = await getTeamMemberPendingAmount('tm-123');
    assert.strictEqual(pendingAmount, 15000);
  });
});
