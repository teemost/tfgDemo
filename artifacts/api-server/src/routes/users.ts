import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { UpdateMeBody } from "@workspace/api-zod";

const router = Router();

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? null,
    country: user.country ?? null,
    role: user.role,
    kycStatus: user.kycStatus,
    referralCode: user.referralCode,
    avatarUrl: user.avatarUrl ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.dbUserId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(serializeUser(user));
});

router.patch("/users/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { firstName, lastName, phone, country, avatarUrl } = parsed.data;
  const updates: Record<string, unknown> = {};
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (phone !== undefined) updates.phone = phone;
  if (country !== undefined) updates.country = country;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.dbUserId!)).returning();
  res.json(serializeUser(user));
});

export default router;
