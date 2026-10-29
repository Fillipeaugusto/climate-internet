import { cn } from "@/lib/utils";

/** Letters roll up on hover, staggered — after skiper-ui's text roll navigation. Pure CSS. */
export function TextRoll({ children, className }: { children: string; className?: string }) {
  const letters = children.split("");
  return (
    <span className={cn("group/roll relative inline-flex overflow-hidden leading-[1.15]", className)} aria-label={children}>
      {letters.map((c, i) => (
        <span key={i} aria-hidden className="relative inline-block">
          <span
            className="inline-block transition-transform duration-[450ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover/roll:-translate-y-full"
            style={{ transitionDelay: `${i * 18}ms` }}
          >
            {c === " " ? " " : c}
          </span>
          <span
            className="absolute inset-x-0 top-full inline-block transition-transform duration-[450ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover/roll:-translate-y-full"
            style={{ transitionDelay: `${i * 18}ms` }}
          >
            {c === " " ? " " : c}
          </span>
        </span>
      ))}
    </span>
  );
}
