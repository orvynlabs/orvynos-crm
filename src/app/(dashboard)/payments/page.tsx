import { prisma } from "@/lib/db";
import { PaymentsClient } from "./payments-client";

export const revalidate = 0;

export default async function PaymentsPage() {
  const [payments, projects, expenses] = await Promise.all([
    prisma.payment.findMany({
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, budget: true } },
      },
      orderBy: {
        paidAt: "desc",
      },
    }),
    prisma.project.findMany({
      select: {
        id: true,
        name: true,
        clientId: true,
        budget: true,
        client: { select: { name: true } },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.expense.findMany({
      select: {
        amount: true,
        date: true,
      },
    }),
  ]);

  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientId: p.clientId,
    clientName: p.client.name,
  }));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const completedPayments = payments.filter((p) => p.status === "COMPLETED");

  const overallRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const overallExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const thisMonthPayments = completedPayments.filter((p) => {
    const d = new Date(p.paidAt);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const thisMonthExpensesSum = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <PaymentsClient
      initialPayments={JSON.parse(JSON.stringify(payments))}
      projects={projectOptions}
      metrics={{
        thisMonthRevenue,
        thisMonthExpenses: thisMonthExpensesSum,
        overallRevenue,
        overallExpenses,
      }}
    />
  );
}
