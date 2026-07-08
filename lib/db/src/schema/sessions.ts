import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table used by express-session (connect-pg-simple store).
// (IMPORTANT) This table is required for server-side sessions, don't drop it.
export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
