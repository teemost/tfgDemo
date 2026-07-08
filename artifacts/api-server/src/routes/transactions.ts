import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/transactions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const type = req.query.type as string | undefined;

  let rows = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId)).orderBy(transactionsTable.createdAt);
  if (type) rows = rows.filter(t => t.type === type);
  const total = rows.length;
  const data = rows.slice((page - 1) * limit, page * limit).map(t => ({
    id: t.id, userId: t.userId, type: t.type, amount: Number(t.amount),
    status: t.status, description: t.description, referenceId: t.referenceId ?? null,
    createdAt: t.createdAt.toISOString(),
  }));
  res.json({ data, total, page, limit });
});

export default router;
