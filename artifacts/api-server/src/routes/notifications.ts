import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { MarkNotificationReadParams } from "@workspace/api-zod";

const router = Router();

function fmtN(n: typeof notificationsTable.$inferSelect) {
  return { id: n.id, userId: n.userId, type: n.type, title: n.title, message: n.message, isRead: n.isRead, createdAt: n.createdAt.toISOString() };
}

router.get("/notifications", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  let rows = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, req.dbUserId!)).orderBy(notificationsTable.createdAt);
  if (req.query.unreadOnly === "true") rows = rows.filter(n => !n.isRead);
  res.json(rows.map(fmtN));
});

router.patch("/notifications/:id/read", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [n] = await db.update(notificationsTable).set({ isRead: true }).where(and(eq(notificationsTable.id, params.data.id), eq(notificationsTable.userId, req.dbUserId!))).returning();
  if (!n) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(fmtN(n));
});

router.patch("/notifications/read-all", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const result = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, req.dbUserId!)).returning();
  res.json({ count: result.length });
});

export default router;
