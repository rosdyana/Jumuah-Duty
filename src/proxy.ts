export { auth as proxy } from "@/auth";

// Next.js 16 renamed middleware.ts -> proxy.ts; matcher syntax is unchanged.
// Excludes sign-in, the NextAuth/cron/health API routes, and static assets.
export const config = {
  matcher: [
    "/((?!signin|api/auth|api/cron|api/health|_next/static|_next/image|favicon.ico).*)",
  ],
};
