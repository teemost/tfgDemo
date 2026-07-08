import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, walletsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { UpdateMeBody } from "@workspace/api-zod";

const router = Router();

// Ensure user record exists after Clerk sign-in
router.post("/users/me/ensure", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const email = (auth.sessionClaims?.email as string) ?? "";
  const firstName = (auth.sessionClaims?.given_name as string) ?? "";
  const lastName = (auth.sessionClaims?.family_name as string) ?? "";

  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));

  if (!user) {
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    [user] = await db.insert(usersTable).values({
      clerkId,
      email,
      firstName,
      lastName,
      referralCode,
    }).returning();

    // Create 4 wallets for new user
    await db.insert(walletsTable).values([
      { userId: user.id, type: "main", balance: "0", currency: "USD" },
      { userId: user.id, type: "profit", balance: "0", currency: "USD" },
      { userId: user.id, type: "bonus", balance: "0", currency: "USD" },
      { userId: user.id, type: "referral", balance: "0", currency: "USD" },
    ]);
  }

  res.json({
    id: user.id,
    clerkId: user.clerkId,
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
  });
});

router.get("/users/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.dbUserId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    clerkId: user.clerkId,
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
  });
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
  res.json({
    id: user.id,
    clerkId: user.clerkId,
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
  });
});

export default router;
