import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { NavLinks } from "@/components/nav-links";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/upcoming", label: "Upcoming Schedule" },
  { href: "/my-duties", label: "My Duties" },
  { href: "/replacement-board", label: "Replacement Board" },
];

const ADMIN_LINKS = [
  { href: "/admin/members", label: "Members" },
  { href: "/admin/rotation", label: "Rotation" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/schedules", label: "Schedules" },
  { href: "/admin/unavailability", label: "Unavailability" },
];

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const session = await auth();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-3 flex items-center gap-2">
              <BrandMark className="size-7" />
              <span className="font-heading text-sm font-bold tracking-tight">
                Jumuah Duty
              </span>
            </span>
            <NavLinks links={NAV_LINKS} />
            {session?.user?.role === "ADMIN" && (
              <NavLinks links={ADMIN_LINKS} isAdminGroup />
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{session?.user?.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/signin" });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
