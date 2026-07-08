/**
 * Local email/password authentication.
 *
 * Self-hosted auth: passwords are hashed with Node's built-in scrypt and
 * sessions are stored in Postgres via connect-pg-simple. No third-party
 * identity provider is used.
 */
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { db, usersTable, walletsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const scrypt = promisify(_scrypt);

const SCRYPT_KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const hashBuffer = Buffer.from(hashHex, "hex");
  const derivedKey = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
  if (hashBuffer.length !== derivedKey.length) return false;
  return timingSafeEqual(hashBuffer, derivedKey);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, email.toLowerCase().trim()));

        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }
        if (!user.isActive) {
          return done(null, false, { message: "Account is suspended" });
        }
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }),
  );

  passport.serializeUser((user: Express.User, cb) => cb(null, (user as { id: number }).id));
  passport.deserializeUser(async (id: number, cb) => {
    try {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
      cb(null, user ?? false);
    } catch (err) {
      cb(err as Error);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    const { email, password, confirmPassword, firstName, lastName } = req.body ?? {};

    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match" });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const [user] = await db
      .insert(usersTable)
      .values({
        email: normalizedEmail,
        passwordHash,
        firstName,
        lastName,
        referralCode,
      })
      .returning();

    await db.insert(walletsTable).values([
      { userId: user.id, type: "main", balance: "0", currency: "USD" },
      { userId: user.id, type: "profit", balance: "0", currency: "USD" },
      { userId: user.id, type: "bonus", balance: "0", currency: "USD" },
      { userId: user.id, type: "referral", balance: "0", currency: "USD" },
    ]);

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message?: string }) => {
      if (err) return next(err);
      if (!user) {
        res.status(401).json({ error: info?.message ?? "Invalid email or password" });
        return;
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.status(204).end();
      });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};
