"use client";

import { AlertTriangle, BellRing, CheckCircle2, Radio, RadioTower, Route, ShieldCheck, Thermometer, Wind } from "lucide-react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DURATION = 6000;

const STEPS = [
  {
    tag: "Sense",
    title: "A sentinel node reads what its location needs",
    text: "Temperature, smoke, rainfall, river level — each node is configured with exactly the instruments its guardian cares about.",
    mesh: "mesh-ember",
    Visual: SenseVisual,
  },
  {
    tag: "Relay",
    title: "Small LoRa packets hop across kilometres",
    text: "No cellular signal or internet required. Nearby nodes relay the packet until it reaches a gateway or another person in the mesh.",
    mesh: "mesh-sky",
    Visual: RelayVisual,
  },
  {
    tag: "Re-route",
    title: "When a node drops, the mesh finds another way",
    text: "Offline or low-battery relays are routed around automatically, so a single failure never silences a region.",
    mesh: "mesh-sand",
    Visual: RerouteVisual,
  },
  {
    tag: "Alert",
    title: "Critical alerts reach the right people first",
    text: "Alerts are prioritised over messages and telemetry, and delivered to authorities and the community the moment they land.",
    mesh: "mesh-forest",
    Visual: AlertVisual,
  },
];

/** Autoplaying feature list with a progress rail, paired with a grainy product visual. */
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || reduce) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), DURATION);
    return () => clearTimeout(t);
  }, [active, inView, reduce]);

  const step = STEPS[active];

  return (
    <div ref={ref} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <ol className="border-t border-border">
          {STEPS.map((s, i) => {
            const on = i === active;
            return (
              <li key={s.tag} className="relative border-b border-border">
                <button onClick={() => setActive(i)} className="flex w-full items-baseline gap-4 py-5 text-left" aria-expanded={on}>
                  <span className={cn("font-mono text-xs transition-colors", on ? "text-primary" : "text-muted-foreground")}>0{i + 1}</span>
                  <span className="flex-1">
                    <span className={cn("block text-[17px] font-medium transition-colors", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                      {s.title}
                    </span>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.span
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                          className="block overflow-hidden"
                        >
                          <span className="block pt-2 text-[15px] leading-relaxed text-muted-foreground">{s.text}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{s.tag}</span>
                </button>
                {on && (
                  <motion.span
                    key={`bar-${active}`}
                    className="absolute -bottom-px left-0 h-px origin-left bg-foreground"
                    initial={{ width: "0%" }}
                    animate={{ width: inView && !reduce ? "100%" : "0%" }}
                    transition={{ duration: DURATION / 1000, ease: "linear" }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className={cn("mesh grid aspect-[5/4] place-items-center rounded-[28px] p-6 transition-[background-color] duration-700", step.mesh)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 14, scale: 0.98, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            className="w-full max-w-sm"
          >
            <step.Visual />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const card = "rounded-2xl border border-white/60 bg-white/85 p-4 shadow-[0_24px_60px_-24px_rgb(20_32_27/0.45)] backdrop-blur-md";

function SenseVisual() {
  const bars = [22, 25, 24, 28, 31, 30, 36, 42, 51, 63, 74, 82];
  return (
    <div className="space-y-2.5">
      <div className={card}>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 font-medium"><Wind className="size-4 text-danger" />Smoke / Particles</span>
          <span className="font-mono text-muted-foreground">N-01</span>
        </div>
        <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">82<span className="ml-1 text-sm font-normal text-muted-foreground">µg/m³</span></p>
        <div className="mt-3 flex h-16 items-end gap-1">
          {bars.map((v, i) => (
            <motion.span
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(v / 82) * 100}%` }}
              transition={{ delay: 0.15 + i * 0.04, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              className={cn("flex-1 rounded-sm", v > 75 ? "bg-danger" : v > 50 ? "bg-warn" : "bg-foreground/15")}
            />
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-danger"><AlertTriangle className="size-3" />Above threshold (75 µg/m³)</p>
      </div>
      <div className={cn(card, "flex items-center gap-3 py-3")}>
        <Thermometer className="size-4 text-warn" />
        <span className="text-xs">Temperature</span>
        <span className="ml-auto font-mono text-xs">39.8 °C</span>
      </div>
    </div>
  );
}

function RelayVisual() {
  const chain = ["N-01", "N-03", "N-06", "N-08", "GW"];
  return (
    <div className={card}>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 font-medium"><Radio className="size-4 text-primary" />Packet #A41F</span>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px]">24 B · SF9</span>
      </div>
      <div className="mt-5 flex items-center">
        {chain.map((id, i) => (
          <div key={id} className="flex flex-1 items-center last:flex-none">
            <motion.span
              initial={{ backgroundColor: "rgb(240 238 233)", color: "rgb(102 112 107)" }}
              animate={{ backgroundColor: "rgb(20 32 27)", color: "rgb(255 255 255)" }}
              transition={{ delay: 0.3 + i * 0.6, duration: 0.2 }}
              className="grid size-10 place-items-center rounded-full font-mono text-[10px]"
            >
              {id}
            </motion.span>
            {i < chain.length - 1 && (
              <span className="relative mx-1 h-0.5 flex-1 overflow-hidden rounded bg-border">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5 + i * 0.6, duration: 0.4 }}
                />
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-1.5 font-mono text-[10px]">
        {[["Distance", "85.2 km"], ["Hops", "4"], ["Latency", "3.4 s"]].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-muted px-2 py-1.5">
            <p className="text-muted-foreground">{k}</p>
            <p>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RerouteVisual() {
  return (
    <div className="space-y-2.5">
      <div className={cn(card, "flex items-center gap-3 py-3")}>
        <span className="grid size-8 place-items-center rounded-lg bg-warn/15 text-warn"><AlertTriangle className="size-4" /></span>
        <div className="text-xs">
          <p className="font-medium">N-04 battery at 21%</p>
          <p className="text-muted-foreground">Relay penalised — routing around</p>
        </div>
      </div>
      <div className={card}>
        <p className="flex items-center gap-2 text-xs font-medium"><Route className="size-4 text-primary" />Alternative pathway</p>
        <div className="mt-3 space-y-1.5 font-mono text-[11px]">
          <p className="flex items-center gap-2 text-muted-foreground line-through decoration-danger/60">N-04 → N-05 → N-07 → GW</p>
          <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-primary" />N-04 → N-03 → N-06 → N-08 → GW
          </motion.p>
        </div>
      </div>
    </div>
  );
}

function AlertVisual() {
  const items = [
    { who: "Municipal Civil Defense", what: "Smoke alert · N-01 Serra Verde", t: "now" },
    { who: "Serra Verde Ranger Post", what: "Guardian notified over LoRa", t: "2s" },
    { who: "Escola Rural Ipê", what: "Evacuation drill on standby", t: "4s" },
  ];
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <motion.div
          key={it.who}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.25 }}
          className={cn(card, "flex items-center gap-3 py-3", i > 0 && "opacity-90")}
        >
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", i === 0 ? "bg-foreground text-background" : "bg-accent text-primary")}>
            {i === 0 ? <BellRing className="size-4" /> : i === 1 ? <RadioTower className="size-4" /> : <ShieldCheck className="size-4" />}
          </span>
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-medium">{it.who}</p>
            <p className="truncate text-muted-foreground">{it.what}</p>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">{it.t}</span>
        </motion.div>
      ))}
    </div>
  );
}
