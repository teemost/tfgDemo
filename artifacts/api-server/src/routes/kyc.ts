import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, kycTable, usersTable, notificationsTable } from "@workspace/db";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/requireAuth";
import { SubmitKycBody } from "@workspace/api-zod";

const router = Router();

function fmtKyc(k: typeof kycTable.$inferSelect) {
  return {
    id: k.id, userId: k.userId, status: k.status,
    documentType: k.documentType ?? null, documentFrontUrl: k.documentFrontUrl ?? null,
    documentBackUrl: k.documentBackUrl ?? null, selfieUrl: k.selfieUrl ?? null,
    proofOfAddressUrl: k.proofOfAddressUrl ?? null, rejectionReason: k.rejectionReason ?? null,
    reviewedAt: k.reviewedAt ? k.reviewedAt.toISOString() : null,
    createdAt: k.createdAt.toISOString(),
  };
}

router.get("/kyc", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [kyc] = await db.select().from(kycTable).where(eq(kycTable.userId, req.dbUserId!));
  if (!kyc) { res.status(404).json({ error: "No KYC record found" }); return; }
  res.json(fmtKyc(kyc));
});

router.post("/kyc", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = SubmitKycBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const userId = req.dbUserId!;
  const existing = await db.select().from(kycTable).where(eq(kycTable.userId, userId));
  let kyc;
  if (existing.length > 0) {
    [kyc] = await db.update(kycTable).set({ ...parsed.data, status: "pending", rejectionReason: null, reviewedAt: null }).where(eq(kycTable.userId, userId)).returning();
  } else {
    [kyc] = await db.insert(kycTable).values({ userId, ...parsed.data, status: "pending" }).returning();
    await db.update(usersTable).set({ kycStatus: "pending" }).where(eq(usersTable.id, userId));
  }
  res.status(201).json(fmtKyc(kyc));
});

router.get("/admin/kyc", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const page = Number(req.query.page ?? 1); const limit = 20;
  let rows = await db.select().from(kycTable).orderBy(kycTable.createdAt);
  if (req.query.status) rows = rows.filter(k => k.status === req.query.status);
  res.json({ data: rows.slice((page - 1) * limit, page * limit).map(fmtKyc), total: rows.length, page, limit });
});

router.patch("/admin/kyc/:id/approve", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [kyc] = await db.update(kycTable).set({ status: "approved", reviewedAt: new Date() }).where(eq(kycTable.id, id)).returning();
  if (!kyc) { res.status(404).json({ error: "KYC record not found" }); return; }
  await db.update(usersTable).set({ kycStatus: "approved" }).where(eq(usersTable.id, kyc.userId));
  await db.insert(notificationsTable).values({ userId: kyc.userId, type: "kyc", title: "KYC Approved", message: "Your identity verification has been approved." });
  res.json(fmtKyc(kyc));
});

router.patch("/admin/kyc/:id/reject", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { reason } = req.body;
  const [kyc] = await db.update(kycTable).set({ status: "rejected", rejectionReason: reason, reviewedAt: new Date() }).where(eq(kycTable.id, id)).returning();
  if (!kyc) { res.status(404).json({ error: "KYC record not found" }); return; }
  await db.update(usersTable).set({ kycStatus: "rejected" }).where(eq(usersTable.id, kyc.userId));
  await db.insert(notificationsTable).values({ userId: kyc.userId, type: "kyc", title: "KYC Rejected", message: `Your KYC was rejected. Reason: ${reason}` });
  res.json(fmtKyc(kyc));
});

export default router;
