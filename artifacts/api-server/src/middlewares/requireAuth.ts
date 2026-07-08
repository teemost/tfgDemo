import type { Request, Response, NextFunction } from "express";
import type { usersTable } from "@workspace/db";

export interface AuthRequest extends Request {
  dbUserId?: number;
  dbUserRole?: string;
}

type DbUser = typeof usersTable.$inferSelect;

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = req.user as DbUser;
  if (!user.isActive) {
    res.status(403).json({ error: "Account is suspended." });
    return;
  }

  req.dbUserId = user.id;
  req.dbUserRole = user.role;
  next();
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
