import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const kycTable = pgTable("kyc", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  status: text("status").notNull().default("pending"),
  documentType: text("document_type"),
  documentFrontUrl: text("document_front_url"),
  documentBackUrl: text("document_back_url"),
  selfieUrl: text("selfie_url"),
  proofOfAddressUrl: text("proof_of_address_url"),
  rejectionReason: text("rejection_reason"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertKycSchema = createInsertSchema(kycTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKyc = z.infer<typeof insertKycSchema>;
export type Kyc = typeof kycTable.$inferSelect;
