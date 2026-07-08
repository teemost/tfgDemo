import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, supportTicketsTable, ticketMessagesTable } from "@workspace/db";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/requireAuth";
import { CreateTicketBody, GetTicketParams, ReplyTicketBody, ReplyTicketParams } from "@workspace/api-zod";

const router = Router();

function fmtTicket(t: typeof supportTicketsTable.$inferSelect) {
  return { id: t.id, userId: t.userId, subject: t.subject, category: t.category, status: t.status, priority: t.priority, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
}
function fmtMsg(m: typeof ticketMessagesTable.$inferSelect) {
  return { id: m.id, ticketId: m.ticketId, senderRole: m.senderRole, message: m.message, createdAt: m.createdAt.toISOString() };
}

router.get("/support/tickets", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rows = await db.select().from(supportTicketsTable).where(eq(supportTicketsTable.userId, req.dbUserId!)).orderBy(supportTicketsTable.createdAt);
  res.json(rows.map(fmtTicket));
});

router.post("/support/tickets", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateTicketBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [ticket] = await db.insert(supportTicketsTable).values({ userId: req.dbUserId!, subject: parsed.data.subject, category: parsed.data.category, priority: parsed.data.priority ?? "medium", status: "open" }).returning();
  await db.insert(ticketMessagesTable).values({ ticketId: ticket.id, senderRole: "user", message: parsed.data.message });
  res.status(201).json(fmtTicket(ticket));
});

router.get("/support/tickets/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetTicketParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [ticket] = await db.select().from(supportTicketsTable).where(and(eq(supportTicketsTable.id, params.data.id), eq(supportTicketsTable.userId, req.dbUserId!)));
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }
  const messages = await db.select().from(ticketMessagesTable).where(eq(ticketMessagesTable.ticketId, ticket.id)).orderBy(ticketMessagesTable.createdAt);
  res.json({ ...fmtTicket(ticket), messages: messages.map(fmtMsg) });
});

router.post("/support/tickets/:id/reply", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = ReplyTicketParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = ReplyTicketBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [ticket] = await db.select().from(supportTicketsTable).where(and(eq(supportTicketsTable.id, params.data.id), eq(supportTicketsTable.userId, req.dbUserId!)));
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }
  const [msg] = await db.insert(ticketMessagesTable).values({ ticketId: ticket.id, senderRole: "user", message: parsed.data.message }).returning();
  res.status(201).json(fmtMsg(msg));
});

// Admin
router.get("/admin/tickets", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const page = Number(req.query.page ?? 1); const limit = 20;
  let rows = await db.select().from(supportTicketsTable).orderBy(supportTicketsTable.createdAt);
  if (req.query.status) rows = rows.filter(t => t.status === req.query.status);
  res.json({ data: rows.slice((page - 1) * limit, page * limit).map(fmtTicket), total: rows.length, page, limit });
});

export default router;
