"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/motion/button/base";
import { TextRoll } from "@/components/motion/text-roll";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#problem", label: "Problem" },
  { href: "#how", label: "How it works" },
  { href: "#platform", label: "Platform" },
  { href: "#guardians", label: "Guardians" },
  { href: "#hardware", label: "Hardware" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <div className="relative mx-auto max-w-6xl px-4 pt-3">
        <div
          className={cn(
            "flex h-14 items-center justify-between rounded-full pr-2 pl-4 transition-all duration-300",
            scrolled ? "border border-border/80 bg-card/80 shadow-[0_8px_30px_-12px_rgb(20_32_27/0.25)] backdrop-blur-xl" : "border border-transparent",
          )}
        >
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
                <TextRoll>{l.label}</TextRoll>
              </a>
            ))}
          </nav>
          <ButtonLink href="/platform" size="sm" className="h-9 px-4 text-[13px]">
            Open platform <ArrowRight className="size-3.5" />
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
