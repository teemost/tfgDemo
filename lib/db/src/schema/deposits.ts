import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const depositsTable = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  method: text("method").notNull(),
  status: text("status").notNull().default("pending"),
  reference: text("reference").notNull().unique(),
  transactionHash: text("transaction_hash"),
  proofUrl: text("proof_url"),
  rejectionReason: text("rejection_reason"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDepositSchema = createInsertSchema(depositsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type Deposit = typeof depositsTable.$inferSelect;
