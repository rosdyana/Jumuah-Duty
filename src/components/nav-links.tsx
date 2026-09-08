"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };

export function NavLinks({
  links,
  isAdminGroup = false,
}: {
  links: NavLink[];
  isAdminGroup?: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      {isAdminGroup && (
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />
      )}
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Button
            key={link.href}
            variant="ghost"
            size="sm"
            className={cn(
              "relative",
              active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
            )}
            render={<Link href={link.href} />}
          >
            {link.label}
          </Button>
        );
      })}
    </>
  );
}
