// Setup global mock objects for Prisma and PG Pool
const mockPrisma: any = {
  project: {
    findUnique: async () => null,
  },
  payment: {
    aggregate: async () => ({ _sum: { amount: null } }),
  },
  expense: {
    aggregate: async () => ({ _sum: { amount: null } }),
  },
  teamPayment: {
    aggregate: async () => ({ _sum: { amount: null } }),
  },
};

const mockPool: any = {
  connect: async () => ({}),
  query: async () => ({ rows: [] }),
  end: async () => {},
};

(global as any).prisma = mockPrisma;
(global as any).pool = mockPool;

export { mockPrisma, mockPool };
