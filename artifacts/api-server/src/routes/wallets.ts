import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, walletsTable, transactionsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { WalletTransferBody } from "@workspace/api-zod";

const router = Router();

router.get("/wallets", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const wallets = await db.select().from(walletsTable).where(eq(walletsTable.userId, req.dbUserId!));
  res.json(wallets.map(w => ({
    id: w.id, userId: w.userId, type: w.type,
    balance: Number(w.balance), currency: w.currency,
    createdAt: w.createdAt.toISOString(),
  })));
});

router.post("/wallets/transfer", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = WalletTransferBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { fromWalletType, toWalletType, amount } = parsed.data;
  const userId = req.dbUserId!;

  const [fromWallet] = await db.select().from(walletsTable).where(and(eq(walletsTable.userId, userId), eq(walletsTable.type, fromWalletType)));
  const [toWallet] = await db.select().from(walletsTable).where(and(eq(walletsTable.userId, userId), eq(walletsTable.type, toWalletType)));

  if (!fromWallet || !toWallet) { res.status(404).json({ error: "Wallet not found" }); return; }
  if (Number(fromWallet.balance) < amount) { res.status(400).json({ error: "Insufficient balance" }); return; }
  if (fromWalletType === toWalletType) { res.status(400).json({ error: "Cannot transfer to same wallet" }); return; }

  const newFrom = Number(fromWallet.balance) - amount;
  const newTo = Number(toWallet.balance) + amount;

  await db.update(walletsTable).set({ balance: String(newFrom) }).where(eq(walletsTable.id, fromWallet.id));
  await db.update(walletsTable).set({ balance: String(newTo) }).where(eq(walletsTable.id, toWallet.id));
  await db.insert(transactionsTable).values({ userId, type: "transfer", amount: String(amount), description: `Transfer from ${fromWalletType} to ${toWalletType} wallet` });

  res.json({ success: true, message: "Transfer successful", fromBalance: newFrom, toBalance: newTo });
});

export default router;
