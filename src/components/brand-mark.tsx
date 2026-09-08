import { Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <Moon className={cn("size-4 fill-current", iconClassName)} strokeWidth={2} />
    </span>
  );
}
