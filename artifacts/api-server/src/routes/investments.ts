import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, investmentsTable, plansTable, walletsTable, transactionsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CreateInvestmentBody, GetInvestmentParams, ListInvestmentsQueryParams } from "@workspace/api-zod";

const router = Router();

function formatInvestment(i: typeof investmentsTable.$inferSelect) {
  const start = new Date(i.startDate).getTime();
  const end = new Date(i.endDate).getTime();
  const now = Date.now();
  const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  return {
    id: i.id, userId: i.userId, planId: i.planId, planName: i.planName,
    amount: Number(i.amount), roiPercent: Number(i.roiPercent), durationDays: i.durationDays,
    status: i.status, startDate: i.startDate, endDate: i.endDate,
    profitEarned: Number(i.profitEarned), progressPercent: Math.round(progress),
    createdAt: i.createdAt.toISOString(),
  };
}

router.get("/investments", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = ListInvestmentsQueryParams.safeParse(req.query);
  const userId = req.dbUserId!;
  let rows = await db.select().from(investmentsTable).where(eq(investmentsTable.userId, userId)).orderBy(investmentsTable.createdAt);
  if (params.success && params.data.status) {
    rows = rows.filter(i => i.status === params.data.status);
  }
  res.json(rows.map(formatInvestment));
});

router.post("/investments", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateInvestmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { planId, amount } = parsed.data;
  const userId = req.dbUserId!;

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, planId));
  if (!plan || !plan.isActive) { res.status(400).json({ error: "Plan not found or inactive" }); return; }
  if (amount < Number(plan.minAmount) || amount > Number(plan.maxAmount)) {
    res.status(400).json({ error: `Amount must be between $${plan.minAmount} and $${plan.maxAmount}` }); return;
  }

  const [mainWallet] = await db.select().from(walletsTable).where(and(eq(walletsTable.userId, userId), eq(walletsTable.type, "main")));
  if (!mainWallet || Number(mainWallet.balance) < amount) {
    res.status(400).json({ error: "Insufficient balance in main wallet" }); return;
  }

  const startDate = new Date().toISOString().split("T")[0];
  const endDate = new Date(Date.now() + plan.durationDays * 86400000).toISOString().split("T")[0];

  const [investment] = await db.insert(investmentsTable).values({
    userId, planId, planName: plan.name, amount: String(amount),
    roiPercent: plan.roiPercent, durationDays: plan.durationDays,
    status: "active", startDate, endDate, profitEarned: "0",
  }).returning();

  await db.update(walletsTable).set({ balance: String(Number(mainWallet.balance) - amount) }).where(eq(mainWallet.id, mainWallet.id));
  await db.insert(transactionsTable).values({ userId, type: "investment", amount: String(amount), description: `Invested in ${plan.name} plan`, referenceId: investment.id });

  res.status(201).json(formatInvestment(investment));
});

router.get("/investments/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetInvestmentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [inv] = await db.select().from(investmentsTable).where(and(eq(investmentsTable.id, params.data.id), eq(investmentsTable.userId, req.dbUserId!)));
  if (!inv) { res.status(404).json({ error: "Investment not found" }); return; }
  res.json(formatInvestment(inv));
});

export default router;
