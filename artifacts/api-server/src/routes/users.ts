import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, walletsTable } from "@workspace/db";
import { isAuthenticated } from "../auth/replitAuth";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { UpdateMeBody } from "@workspace/api-zod";

const router = Router();

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    authId: user.authId,
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

// Ensure user record exists after Replit Auth sign-in
router.post("/users/me/ensure", isAuthenticated, async (req, res): Promise<void> => {
  const claims = (req.user as any)?.claims;
  const authId = claims?.sub as string | undefined;
  if (!authId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const email = (claims?.email as string) ?? "";
  const firstName = (claims?.first_name as string) ?? "";
  const lastName = (claims?.last_name as string) ?? "";
  const avatarUrl = (claims?.profile_image_url as string) ?? null;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.authId, authId));

  if (!user) {
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    [user] = await db
      .insert(usersTable)
      .values({
        authId,
        email: email || `${authId}@users.noreply.replit.app`,
        firstName,
        lastName,
        avatarUrl,
        referralCode,
      })
      .returning();

    // Create 4 wallets for new user
    await db.insert(walletsTable).values([
      { userId: user.id, type: "main", balance: "0", currency: "USD" },
      { userId: user.id, type: "profit", balance: "0", currency: "USD" },
      { userId: user.id, type: "bonus", balance: "0", currency: "USD" },
      { userId: user.id, type: "referral", balance: "0", currency: "USD" },
    ]);
  } else if (!user.email && email) {
    // Sync missing profile data from Replit Auth for existing users
    [user] = await db
      .update(usersTable)
      .set({
        email: email || user.email,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        avatarUrl: avatarUrl || user.avatarUrl,
      })
      .where(eq(usersTable.authId, authId))
      .returning();
  }

  res.json(serializeUser(user));
});

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
