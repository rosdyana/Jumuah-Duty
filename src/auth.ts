import NextAuth, { type Session } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  session: {
    strategy: "jwt",
    // Short-ish so a deactivated user or a capability/role change made by an admin
    // takes effect for that member soon after, without requiring an explicit sign-out.
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    // Admin-must-pre-provision: reject any email without an existing, active User row.
    async signIn({ user }) {
      if (!user.email) return false;
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
      });
      return !!dbUser && dbUser.isActive;
    },
    async jwt({ token }) {
      if (!token.email) return token;
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email.toLowerCase() },
      });
      if (!dbUser) {
        token.isActive = false;
        return token;
      }
      token.userId = dbUser.id;
      token.role = dbUser.role;
      token.canBookRoom = dbUser.canBookRoom;
      token.canBeKhatib = dbUser.canBeKhatib;
      token.canBeImam = dbUser.canBeImam;
      token.isActive = dbUser.isActive;
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (!session.user) return session;
      session.user.id = token.userId ?? "";
      session.user.role = token.role ?? "MEMBER";
      session.user.canBookRoom = token.canBookRoom ?? false;
      session.user.canBeKhatib = token.canBeKhatib ?? false;
      session.user.canBeImam = token.canBeImam ?? false;
      session.user.isActive = token.isActive ?? false;
      return session;
    },
    // First line of defense for route access (src/proxy.ts). Reads only the JWT
    // claims already on `auth` — no DB call here. The authoritative checks live in
    // src/lib/auth-guards.ts, called from every Server Action / admin page.
    authorized({ request, auth: session }) {
      if (!session?.user?.isActive) return false;
      if (request.nextUrl.pathname.startsWith("/admin")) {
        return session.user.role === "ADMIN";
      }
      return true;
    },
  },
});
