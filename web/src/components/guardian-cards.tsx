"use client";

import { ArrowUpRight, Building2, GraduationCap, Leaf, Tractor, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const GUARDIANS: { icon: LucideIcon; title: string; sensors: string[]; text: string; mesh: string }[] = [
  { icon: GraduationCap, title: "School", sensors: ["Air quality", "Temperature"], text: "Classrooms become sentinels — monitoring the air students breathe and keeping a text line open when phones go dark.", mesh: "mesh-sky" },
  { icon: Tractor, title: "Farmer", sensors: ["Soil moisture", "Rainfall"], text: "Field-level data for irrigation and drought, plus early warning of fire spreading across neighbouring land.", mesh: "mesh-sand" },
  { icon: Leaf, title: "NGO", sensors: ["Smoke", "Humidity"], text: "Ranger posts and conservation teams watch the forest edge, where a wildfire's first minutes matter most.", mesh: "mesh-forest" },
  { icon: Building2, title: "Municipality", sensors: ["River level", "Air quality"], text: "Civil defense gets live river levels and a resilient channel to every guardian when cellular networks fail.", mesh: "mesh-ember" },
];

/** Panels widen on hover — after skiper-ui's ExpandOnHover. Stacked and fully open on small screens. */
export function GuardianCards() {
  const [active, setActive] = useState(2);
  return (
    <div className="flex flex-col gap-3 lg:h-[440px] lg:flex-row">
      {GUARDIANS.map(({ icon: Icon, title, sensors, text, mesh }, i) => {
        const on = active === i;
        return (
          <div
            key={title}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            tabIndex={0}
            className={cn(
              "mesh group flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[24px] p-6 outline-none transition-[flex] duration-500 ease-[cubic-bezier(.2,.7,.2,1)] focus-visible:ring-2 focus-visible:ring-ring",
              mesh,
              on ? "lg:flex-[2.6]" : "lg:flex-1",
            )}
          >
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/80 text-foreground shadow-sm backdrop-blur">
                <Icon className="size-5" />
              </span>
              <ArrowUpRight className={cn("size-5 text-foreground/50 transition-all duration-500", on ? "lg:opacity-100" : "lg:opacity-0")} />
            </div>
            <div>
              <h3 className="font-display text-[1.65rem] leading-none font-semibold tracking-[-0.03em]">{title}</h3>
              <div
                className={cn(
                  "grid transition-all duration-500 ease-[cubic-bezier(.2,.7,.2,1)]",
                  on ? "lg:grid-rows-[1fr] lg:opacity-100" : "lg:grid-rows-[0fr] lg:opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-foreground/75">{text}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {sensors.map((s) => (
                  <span key={s} className="rounded-full bg-white/75 px-2.5 py-1 text-xs whitespace-nowrap text-foreground/80 backdrop-blur">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
