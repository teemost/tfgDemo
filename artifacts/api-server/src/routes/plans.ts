import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, plansTable } from "@workspace/db";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/requireAuth";
import { CreatePlanBody, GetPlanParams, UpdatePlanBody, UpdatePlanParams, DeletePlanParams } from "@workspace/api-zod";

const router = Router();

function formatPlan(p: typeof plansTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    tier: p.tier,
    description: p.description ?? null,
    minAmount: Number(p.minAmount),
    maxAmount: Number(p.maxAmount),
    roiPercent: Number(p.roiPercent),
    durationDays: p.durationDays,
    isActive: p.isActive,
    features: p.features ?? [],
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/plans", async (_req, res): Promise<void> => {
  const plans = await db.select().from(plansTable).where(eq(plansTable.isActive, true)).orderBy(plansTable.id);
  res.json(plans.map(formatPlan));
});

router.post("/plans", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreatePlanBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { name, tier, description, minAmount, maxAmount, roiPercent, durationDays, features } = parsed.data;
  const [plan] = await db.insert(plansTable).values({
    name, tier, description, durationDays,
    minAmount: String(minAmount), maxAmount: String(maxAmount), roiPercent: String(roiPercent),
    features: features ?? [],
  }).returning();
  res.status(201).json(formatPlan(plan));
});

router.get("/plans/:id", async (req, res): Promise<void> => {
  const params = GetPlanParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, params.data.id));
  if (!plan) { res.status(404).json({ error: "Plan not found" }); return; }
  res.json(formatPlan(plan));
});

router.patch("/plans/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdatePlanParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdatePlanBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.name !== undefined) updates.name = d.name;
  if (d.description !== undefined) updates.description = d.description;
  if (d.minAmount !== undefined) updates.minAmount = String(d.minAmount);
  if (d.maxAmount !== undefined) updates.maxAmount = String(d.maxAmount);
  if (d.roiPercent !== undefined) updates.roiPercent = String(d.roiPercent);
  if (d.durationDays !== undefined) updates.durationDays = d.durationDays;
  if (d.isActive !== undefined) updates.isActive = d.isActive;
  if (d.features !== undefined) updates.features = d.features;
  const [plan] = await db.update(plansTable).set(updates).where(eq(plansTable.id, params.data.id)).returning();
  if (!plan) { res.status(404).json({ error: "Plan not found" }); return; }
  res.json(formatPlan(plan));
});

router.delete("/plans/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const params = DeletePlanParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(plansTable).where(eq(plansTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
