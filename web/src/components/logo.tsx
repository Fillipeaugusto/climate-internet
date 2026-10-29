import Link from "next/link";
import { cn } from "@/lib/utils";

/** Three relay nodes and their links — the mesh, as a mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-8 place-items-center rounded-[10px] bg-foreground text-background", className)}>
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden>
        <path d="M6 16.5 12 6l6 10.5H6Z" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.6" strokeDasharray="2 2.2" />
        <circle cx="12" cy="6" r="2.6" fill="#5fd3a0" />
        <circle cx="6" cy="16.5" r="2.6" fill="currentColor" />
        <circle cx="18" cy="16.5" r="2.6" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({ subtitle, className }: { subtitle?: string; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight">Climate Internet</span>
        {subtitle && <span className="block font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{subtitle}</span>}
      </span>
    </Link>
  );
}
