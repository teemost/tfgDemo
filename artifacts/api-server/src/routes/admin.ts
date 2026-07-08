import { Router } from "express";
import { eq, count, sum } from "drizzle-orm";
import { db, usersTable, depositsTable, withdrawalsTable, investmentsTable, kycTable, supportTicketsTable, walletsTable, transactionsTable } from "@workspace/db";
import { requireAdmin, type AuthRequest } from "../middlewares/requireAuth";
import { GetAdminUserParams, UpdateAdminUserBody, UpdateAdminUserParams, ListAdminUsersQueryParams } from "@workspace/api-zod";

const router = Router();

function fmtUser(u: typeof usersTable.$inferSelect) {
  return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, phone: u.phone ?? null, country: u.country ?? null, role: u.role, kycStatus: u.kycStatus, referralCode: u.referralCode, avatarUrl: u.avatarUrl ?? null, isActive: u.isActive, createdAt: u.createdAt.toISOString() };
}

router.get("/admin/stats", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const [users, activeUsers, pendingDeposits, pendingWithdrawals, pendingKyc, openTickets, totalDeposits, totalWithdrawals, totalInvestments] = await Promise.all([
    db.select({ cnt: count() }).from(usersTable),
    db.select({ cnt: count() }).from(usersTable).where(eq(usersTable.isActive, true)),
    db.select({ cnt: count() }).from(depositsTable).where(eq(depositsTable.status, "pending")),
    db.select({ cnt: count() }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "pending")),
    db.select({ cnt: count() }).from(kycTable).where(eq(kycTable.status, "pending")),
    db.select({ cnt: count() }).from(supportTicketsTable).where(eq(supportTicketsTable.status, "open")),
    db.select({ s: sum(depositsTable.amount) }).from(depositsTable).where(eq(depositsTable.status, "confirmed")),
    db.select({ s: sum(withdrawalsTable.amount) }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "approved")),
    db.select({ s: sum(investmentsTable.amount) }).from(investmentsTable).where(eq(investmentsTable.status, "active")),
  ]);
  res.json({
    totalUsers: users[0]?.cnt ?? 0,
    activeUsers: activeUsers[0]?.cnt ?? 0,
    totalDeposits: Number(totalDeposits[0]?.s ?? 0),
    totalWithdrawals: Number(totalWithdrawals[0]?.s ?? 0),
    totalInvestments: Number(totalInvestments[0]?.s ?? 0),
    totalProfit: Number(totalInvestments[0]?.s ?? 0) * 0.05,
    pendingDeposits: pendingDeposits[0]?.cnt ?? 0,
    pendingWithdrawals: pendingWithdrawals[0]?.cnt ?? 0,
    pendingKyc: pendingKyc[0]?.cnt ?? 0,
    openTickets: openTickets[0]?.cnt ?? 0,
  });
});

router.get("/admin/users", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const page = Number(req.query.page ?? 1); const limit = 20;
  let rows = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  if (req.query.search) {
    const s = (req.query.search as string).toLowerCase();
    rows = rows.filter(u => u.email.toLowerCase().includes(s) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(s));
  }
  if (req.query.kycStatus) rows = rows.filter(u => u.kycStatus === req.query.kycStatus);
  const total = rows.length;
  res.json({ data: rows.slice((page - 1) * limit, page * limit).map(fmtUser), total, page, limit });
});

router.get("/admin/users/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const params = GetAdminUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, user.id));
  const [investSum] = await db.select({ s: sum(investmentsTable.amount) }).from(investmentsTable).where(eq(investmentsTable.userId, user.id));
  const [depositSum] = await db.select({ s: sum(depositsTable.amount) }).from(depositsTable).where(eq(depositsTable.userId, user.id));
  const [withdrawalSum] = await db.select({ s: sum(withdrawalsTable.amount) }).from(withdrawalsTable).where(eq(withdrawalsTable.userId, user.id));
  res.json({ user: fmtUser(user), wallets: wallets.map(w => ({ id: w.id, userId: w.userId, type: w.type, balance: Number(w.balance), currency: w.currency, createdAt: w.createdAt.toISOString() })), totalInvested: Number(investSum?.s ?? 0), totalProfit: Number(investSum?.s ?? 0) * 0.05, totalDeposited: Number(depositSum?.s ?? 0), totalWithdrawn: Number(withdrawalSum?.s ?? 0) });
});

router.patch("/admin/users/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateAdminUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateAdminUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, unknown> = {};
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.kycStatus !== undefined) updates.kycStatus = parsed.data.kycStatus;
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, user.id));
  res.json({ user: fmtUser(user), wallets: wallets.map(w => ({ id: w.id, userId: w.userId, type: w.type, balance: Number(w.balance), currency: w.currency, createdAt: w.createdAt.toISOString() })), totalInvested: 0, totalProfit: 0, totalDeposited: 0, totalWithdrawn: 0 });
});

router.post("/admin/users/:id/credit", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }

  const { walletType, amount, note } = req.body as { walletType: string; amount: number; note?: string };
  if (!walletType || !["main", "profit", "bonus", "referral"].includes(walletType)) {
    res.status(400).json({ error: "Invalid wallet type. Must be: main, profit, bonus, or referral" }); return;
  }
  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum === 0) {
    res.status(400).json({ error: "Amount must be a non-zero number" }); return;
  }

  const [wallet] = await db.select().from(walletsTable)
    .where(eq(walletsTable.userId, userId));

  const allWallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  const targetWallet = allWallets.find(w => w.type === walletType);
  if (!targetWallet) { res.status(404).json({ error: "Wallet not found for this user" }); return; }

  const currentBalance = Number(targetWallet.balance);
  const newBalance = currentBalance + amountNum;
  if (newBalance < 0) {
    res.status(400).json({ error: `Insufficient balance. Current: $${currentBalance.toFixed(2)}` }); return;
  }

  const [updated] = await db.update(walletsTable)
    .set({ balance: newBalance.toFixed(2) })
    .where(eq(walletsTable.id, targetWallet.id))
    .returning();

  await db.insert(transactionsTable).values({
    userId,
    type: amountNum > 0 ? "bonus" : "withdrawal",
    amount: Math.abs(amountNum).toFixed(2),
    status: "completed",
    description: note || `Admin ${amountNum > 0 ? "credit" : "debit"} to ${walletType} wallet`,
    referenceId: `ADMIN-${Date.now()}`,
  });

  res.json({
    success: true,
    wallet: { id: updated.id, type: updated.type, balance: Number(updated.balance), currency: updated.currency },
    credited: amountNum,
    previousBalance: currentBalance,
    newBalance: Number(updated.balance),
  });
});

export default router;
