import { Router } from "express";
import { eq, sum } from "drizzle-orm";
import { db, referralsTable, usersTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/referrals/stats", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const referrals = await db.select().from(referralsTable).where(eq(referralsTable.referrerId, userId));
  const totalEarnings = referrals.reduce((s, r) => s + Number(r.commission), 0);
  const activeReferrals = referrals.filter(r => r.status === "invested").length;
  const origin = "https://tradefastgold.app";
  res.json({
    referralCode: user.referralCode,
    referralLink: `${origin}/sign-up?ref=${user.referralCode}`,
    totalReferrals: referrals.length,
    activeReferrals,
    totalEarnings,
    pendingEarnings: totalEarnings * 0.1,
  });
});

router.get("/referrals", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const referrals = await db.select().from(referralsTable).where(eq(referralsTable.referrerId, userId)).orderBy(referralsTable.createdAt);
  res.json(referrals.map(r => ({
    id: r.id, referredName: r.referredName, referredEmail: r.referredEmail,
    status: r.status, commission: Number(r.commission), joinedAt: r.createdAt.toISOString(),
  })));
});

export default router;
