import { pgTable, text, serial, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plansTable = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tier: text("tier").notNull(),
  description: text("description"),
  minAmount: numeric("min_amount", { precision: 18, scale: 2 }).notNull(),
  maxAmount: numeric("max_amount", { precision: 18, scale: 2 }).notNull(),
  roiPercent: numeric("roi_percent", { precision: 6, scale: 2 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  features: text("features").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlanSchema = createInsertSchema(plansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plansTable.$inferSelect;
