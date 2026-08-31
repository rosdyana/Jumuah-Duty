import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Not signed in") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Not allowed") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Authoritative auth check for Server Actions and Server Components — never rely on
 * src/proxy.ts alone, since Server Actions can be invoked directly regardless of the
 * page that rendered their trigger.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.isActive) {
    throw new UnauthorizedError();
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }
  return user;
}
