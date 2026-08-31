export type AppRole = "ADMIN" | "MEMBER";

// Augment the modules where User/JWT are actually declared (@auth/core/*) —
// "next-auth" and "next-auth/jwt" are pure re-export barrels, so augmenting them
// directly does not merge with the types actually used by NextAuth's callbacks.
// Session.user is typed as `User` (via DefaultSession), so User is the interface
// to extend — not an inline shape declared directly on Session.
declare module "@auth/core/types" {
  interface User {
    id: string;
    role: AppRole;
    canBookRoom: boolean;
    canBeKhatib: boolean;
    canBeImam: boolean;
    isActive: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    role?: AppRole;
    canBookRoom?: boolean;
    canBeKhatib?: boolean;
    canBeImam?: boolean;
    isActive?: boolean;
  }
}
