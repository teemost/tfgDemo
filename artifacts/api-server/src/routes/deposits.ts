import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, depositsTable, walletsTable, notificationsTable, transactionsTable } from "@workspace/db";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/requireAuth";
import { CreateDepositBody, GetDepositParams, ListDepositsQueryParams } from "@workspace/api-zod";

const router = Router();

function fmtDeposit(d: typeof depositsTable.$inferSelect) {
  return {
    id: d.id, userId: d.userId, amount: Number(d.amount), method: d.method,
    status: d.status, reference: d.reference, transactionHash: d.transactionHash ?? null,
    proofUrl: d.proofUrl ?? null, rejectionReason: d.rejectionReason ?? null,
    confirmedAt: d.confirmedAt ? d.confirmedAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/deposits", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = ListDepositsQueryParams.safeParse(req.query);
  let rows = await db.select().from(depositsTable).where(eq(depositsTable.userId, req.dbUserId!)).orderBy(depositsTable.createdAt);
  if (params.success && params.data.status) rows = rows.filter(d => d.status === params.data.status);
  res.json(rows.map(fmtDeposit));
});

router.post("/deposits", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateDepositBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const reference = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const [deposit] = await db.insert(depositsTable).values({
    userId: req.dbUserId!, amount: String(parsed.data.amount), method: parsed.data.method,
    status: "pending", reference,
    transactionHash: parsed.data.transactionHash ?? null,
    proofUrl: parsed.data.proofUrl ?? null,
  }).returning();
  res.status(201).json(fmtDeposit(deposit));
});

router.get("/deposits/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetDepositParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [d] = await db.select().from(depositsTable).where(and(eq(depositsTable.id, params.data.id), eq(depositsTable.userId, req.dbUserId!)));
  if (!d) { res.status(404).json({ error: "Deposit not found" }); return; }
  res.json(fmtDeposit(d));
});

// Admin routes
router.get("/admin/deposits", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = 20;
  const status = req.query.status as string | undefined;
  let rows = await db.select().from(depositsTable).orderBy(depositsTable.createdAt);
  if (status) rows = rows.filter(d => d.status === status);
  const total = rows.length;
  const data = rows.slice((page - 1) * limit, page * limit).map(fmtDeposit);
  res.json({ data, total, page, limit });
});

router.patch("/admin/deposits/:id/approve", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [deposit] = await db.update(depositsTable).set({ status: "confirmed", confirmedAt: new Date() }).where(eq(depositsTable.id, id)).returning();
  if (!deposit) { res.status(404).json({ error: "Deposit not found" }); return; }
  // Credit main wallet
  const [wallet] = await db.select().from(walletsTable).where(and(eq(walletsTable.userId, deposit.userId), eq(walletsTable.type, "main")));
  if (wallet) {
    await db.update(walletsTable).set({ balance: String(Number(wallet.balance) + Number(deposit.amount)) }).where(eq(walletsTable.id, wallet.id));
  }
  await db.insert(transactionsTable).values({ userId: deposit.userId, type: "deposit", amount: deposit.amount, description: `Deposit confirmed via ${deposit.method}`, referenceId: deposit.id });
  await db.insert(notificationsTable).values({ userId: deposit.userId, type: "deposit", title: "Deposit Confirmed", message: `Your deposit of $${Number(deposit.amount).toFixed(2)} has been confirmed.` });
  res.json(fmtDeposit(deposit));
});

router.patch("/admin/deposits/:id/reject", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { reason } = req.body;
  const [deposit] = await db.update(depositsTable).set({ status: "rejected", rejectionReason: reason }).where(eq(depositsTable.id, id)).returning();
  if (!deposit) { res.status(404).json({ error: "Deposit not found" }); return; }
  await db.insert(notificationsTable).values({ userId: deposit.userId, type: "deposit", title: "Deposit Rejected", message: `Your deposit of $${Number(deposit.amount).toFixed(2)} was rejected. Reason: ${reason}` });
  res.json(fmtDeposit(deposit));
});

export default router;
