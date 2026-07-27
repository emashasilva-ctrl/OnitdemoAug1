import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-heading text-2xl font-semibold tracking-tight text-foreground",
        className
      )}
      aria-label="On It! home"
    >
      On It<span className="text-primary">!</span>
    </Link>
  );
}
