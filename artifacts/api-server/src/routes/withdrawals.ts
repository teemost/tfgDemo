import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, withdrawalsTable, walletsTable, notificationsTable, transactionsTable } from "@workspace/db";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/requireAuth";
import { CreateWithdrawalBody, GetWithdrawalParams, ListWithdrawalsQueryParams } from "@workspace/api-zod";

const router = Router();

function fmtW(w: typeof withdrawalsTable.$inferSelect) {
  return {
    id: w.id, userId: w.userId, amount: Number(w.amount), method: w.method,
    status: w.status, walletAddress: w.walletAddress, bankDetails: w.bankDetails ?? null,
    rejectionReason: w.rejectionReason ?? null,
    processedAt: w.processedAt ? w.processedAt.toISOString() : null,
    createdAt: w.createdAt.toISOString(),
  };
}

router.get("/withdrawals", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = ListWithdrawalsQueryParams.safeParse(req.query);
  let rows = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.userId, req.dbUserId!)).orderBy(withdrawalsTable.createdAt);
  if (params.success && params.data.status) rows = rows.filter(w => w.status === params.data.status);
  res.json(rows.map(fmtW));
});

router.post("/withdrawals", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateWithdrawalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { amount, method, walletAddress, bankDetails } = parsed.data;
  const userId = req.dbUserId!;
  const [mainWallet] = await db.select().from(walletsTable).where(and(eq(walletsTable.userId, userId), eq(walletsTable.type, "main")));
  if (!mainWallet || Number(mainWallet.balance) < amount) {
    res.status(400).json({ error: "Insufficient balance" }); return;
  }
  await db.update(walletsTable).set({ balance: String(Number(mainWallet.balance) - amount) }).where(eq(walletsTable.id, mainWallet.id));
  const [withdrawal] = await db.insert(withdrawalsTable).values({
    userId, amount: String(amount), method, walletAddress, bankDetails: bankDetails ?? null, status: "pending",
  }).returning();
  await db.insert(transactionsTable).values({ userId, type: "withdrawal", amount: String(amount), description: `Withdrawal request via ${method}`, referenceId: withdrawal.id });
  res.status(201).json(fmtW(withdrawal));
});

router.get("/withdrawals/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetWithdrawalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [w] = await db.select().from(withdrawalsTable).where(and(eq(withdrawalsTable.id, params.data.id), eq(withdrawalsTable.userId, req.dbUserId!)));
  if (!w) { res.status(404).json({ error: "Withdrawal not found" }); return; }
  res.json(fmtW(w));
});

router.get("/admin/withdrawals", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const page = Number(req.query.page ?? 1); const limit = 20;
  let rows = await db.select().from(withdrawalsTable).orderBy(withdrawalsTable.createdAt);
  if (req.query.status) rows = rows.filter(w => w.status === req.query.status);
  const total = rows.length;
  res.json({ data: rows.slice((page - 1) * limit, page * limit).map(fmtW), total, page, limit });
});

router.patch("/admin/withdrawals/:id/approve", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [w] = await db.update(withdrawalsTable).set({ status: "approved", processedAt: new Date() }).where(eq(withdrawalsTable.id, id)).returning();
  if (!w) { res.status(404).json({ error: "Withdrawal not found" }); return; }
  await db.insert(notificationsTable).values({ userId: w.userId, type: "withdrawal", title: "Withdrawal Approved", message: `Your withdrawal of $${Number(w.amount).toFixed(2)} has been approved.` });
  res.json(fmtW(w));
});

router.patch("/admin/withdrawals/:id/decline", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { reason } = req.body;
  const [w] = await db.update(withdrawalsTable).set({ status: "declined", rejectionReason: reason, processedAt: new Date() }).where(eq(withdrawalsTable.id, id)).returning();
  if (!w) { res.status(404).json({ error: "Withdrawal not found" }); return; }
  const [mainWallet] = await db.select().from(walletsTable).where(and(eq(walletsTable.userId, w.userId), eq(walletsTable.type, "main")));
  if (mainWallet) await db.update(walletsTable).set({ balance: String(Number(mainWallet.balance) + Number(w.amount)) }).where(eq(walletsTable.id, mainWallet.id));
  await db.insert(notificationsTable).values({ userId: w.userId, type: "withdrawal", title: "Withdrawal Declined", message: `Your withdrawal of $${Number(w.amount).toFixed(2)} was declined. Reason: ${reason}` });
  res.json(fmtW(w));
});

export default router;
