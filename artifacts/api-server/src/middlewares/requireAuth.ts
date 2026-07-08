import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../auth/replitAuth";

export interface AuthRequest extends Request {
  dbUserId?: number;
  dbUserRole?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  await isAuthenticated(req, res, async () => {
    const authId = (req.user as any)?.claims?.sub;
    if (!authId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.authId, authId));
    if (!user) {
      res.status(401).json({ error: "User not found. Please complete registration." });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ error: "Account is suspended." });
      return;
    }

    req.dbUserId = user.id;
    req.dbUserRole = user.role;
    next();
  });
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  await requireAuth(req, res, async () => {
    if (req.dbUserRole !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
};
