import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const SALT_ROUNDS = 10;
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

/**
 * Hash a plain PIN for storage.
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Detect whether a stored value is already a bcrypt hash.
 * Bcrypt hashes always start with $2a$, $2b$, or $2y$ and are 60 chars long.
 * This lets us support legacy plaintext PINs already in the DB without a
 * forced migration step that could lock someone out.
 */
function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}

/**
 * Compare a plain PIN against a stored value, whether that value is
 * a bcrypt hash (new accounts) or legacy plaintext (pre-migration accounts).
 */
export async function verifyPin(plainPin: string, storedValue: string): Promise<boolean> {
  if (isBcryptHash(storedValue)) {
    return bcrypt.compare(plainPin, storedValue);
  }
  // Legacy plaintext fallback
  return plainPin === storedValue;
}

/**
 * Check if a username is currently locked out due to too many failed
 * login attempts within the lockout window. Returns remaining lockout
 * seconds if locked, or 0 if not locked.
 */
export async function checkLockout(username: string): Promise<number> {
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000);

  const recentAttempts = await prisma.loginAttempt.findMany({
    where: {
      username,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_ATTEMPTS,
  });

  const failedCount = recentAttempts.filter((a) => !a.success).length;

  if (failedCount >= MAX_ATTEMPTS) {
    const oldestRelevant = recentAttempts[recentAttempts.length - 1];
    const lockedUntil = new Date(oldestRelevant.createdAt.getTime() + LOCKOUT_WINDOW_MINUTES * 60 * 1000);
    const remainingMs = lockedUntil.getTime() - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }

  return 0;
}

/**
 * Record a login attempt (success or failure) for rate-limiting purposes.
 */
export async function recordLoginAttempt(username: string, success: boolean, ipAddress?: string) {
  await prisma.loginAttempt.create({
    data: { username, success, ipAddress: ipAddress ?? null },
  });
}

/**
 * Read the current session from the wms_session cookie, if any.
 * Returns null if there is no session or it can't be parsed.
 */
export async function getSession(): Promise<{ id: number; username: string; name: string; role: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("wms_session");
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Require the current session to have the OWNER role.
 * Returns the session if authorized, or null if not (caller should
 * respond with 403).
 */
export async function requireOwner(): Promise<{ id: number; username: string; name: string; role: string } | null> {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return null;
  return session;
}
