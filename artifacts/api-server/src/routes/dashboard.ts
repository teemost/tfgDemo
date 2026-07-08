import { Router } from "express";
import { eq, sum, count, and } from "drizzle-orm";
import { db, walletsTable, investmentsTable, withdrawalsTable, depositsTable, transactionsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.dbUserId!;

  const [wallets, activeInvestments, pendingWithdrawals, recentTxs, depositSum, withdrawalSum, profitSum] = await Promise.all([
    db.select().from(walletsTable).where(eq(walletsTable.userId, userId)),
    db.select({ cnt: count() }).from(investmentsTable).where(and(eq(investmentsTable.userId, userId), eq(investmentsTable.status, "active"))),
    db.select({ s: sum(withdrawalsTable.amount) }).from(withdrawalsTable).where(and(eq(withdrawalsTable.userId, userId), eq(withdrawalsTable.status, "pending"))),
    db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId)).orderBy(transactionsTable.createdAt).limit(5),
    db.select({ s: sum(depositsTable.amount) }).from(depositsTable).where(and(eq(depositsTable.userId, userId), eq(depositsTable.status, "confirmed"))),
    db.select({ s: sum(withdrawalsTable.amount) }).from(withdrawalsTable).where(and(eq(withdrawalsTable.userId, userId), eq(withdrawalsTable.status, "approved"))),
    db.select({ s: sum(transactionsTable.amount) }).from(transactionsTable).where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "profit"))),
  ]);

  const mainWallet = wallets.find(w => w.type === "main");
  const profitWallet = wallets.find(w => w.type === "profit");
  const bonusWallet = wallets.find(w => w.type === "bonus");
  const referralWallet = wallets.find(w => w.type === "referral");

  const portfolioValue = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

  res.json({
    portfolioValue,
    availableBalance: Number(mainWallet?.balance ?? 0),
    activeInvestments: activeInvestments[0]?.cnt ?? 0,
    pendingWithdrawals: Number(pendingWithdrawals[0]?.s ?? 0),
    totalProfit: Number(profitSum[0]?.s ?? 0),
    dailyEarnings: Number(profitWallet?.balance ?? 0) * 0.01,
    totalDeposited: Number(depositSum[0]?.s ?? 0),
    totalWithdrawn: Number(withdrawalSum[0]?.s ?? 0),
    recentTransactions: recentTxs.map(t => ({
      id: t.id, userId: t.userId, type: t.type,
      amount: Number(t.amount), status: t.status,
      description: t.description, referenceId: t.referenceId ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
  });
});

export default router;
