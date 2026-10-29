"use client";

import { CheckCircle2, Flame, MapPin, RadioTower } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { GeoMeshMap } from "@/components/geo-mesh-map";
import { distanceKm, findRoute, INITIAL_NODES, LINKS, SENSORS, type SensorKey } from "@/lib/mesh";
import { cn } from "@/lib/utils";

const SCENARIOS: { source: string; sensor: SensorKey; value: string }[] = [
  { source: "N-01", sensor: "smoke", value: "82 µg/m³" },
  { source: "N-04", sensor: "temperature", value: "41.3 °C" },
  { source: "N-05", sensor: "riverLevel", value: "3.62 m" },
  { source: "N-02", sensor: "airQuality", value: "168 AQI" },
];

const byId = new Map(INITIAL_NODES.map((n) => [n.id, n]));

/** Self-playing product shot: globe → fly into the mesh → an alert hops to the gateway, then the next source fires. */
export function HeroMap() {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [hops, setHops] = useState(0);
  const scenario = SCENARIOS[round % SCENARIOS.length];
  const route = useMemo(() => findRoute(scenario.source, INITIAL_NODES, LINKS), [scenario.source]);
  const total = route ? route.length - 1 : 0;
  const done = hops >= total;
  const km = route ? route.slice(1, hops + 1).reduce((s, id, i) => s + distanceKm(byId.get(route[i])!, byId.get(id)!), 0) : 0;

  useEffect(() => {
    if (!started || !route) return;
    const t = setTimeout(
      () => {
        if (done) {
          setHops(0);
          setRound((r) => r + 1);
        } else setHops((h) => h + 1);
      },
      done ? 2600 : hops === 0 ? 1200 : 950,
    );
    return () => clearTimeout(t);
  }, [started, hops, done, route]);

  return (
    <div className="relative h-full w-full">
      <GeoMeshMap
        nodes={INITIAL_NODES}
        links={LINKS}
        route={started ? route : null}
        hops={hops}
        broadcasting={started && route && !done ? route[hops] : null}
        selected={started ? scenario.source : null}
        interactive={false}
        intro
        onIntroEnd={() => setStarted(true)}
        coverage
        compact
        padding={{ top: 70, bottom: 70, left: 60, right: 60 }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_50%,transparent_55%,rgb(247_246_242/0.6))]" />

      {/* Location chip */}
      <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-black/5 bg-white/85 px-3 py-1.5 text-xs shadow-sm backdrop-blur-md">
        <MapPin className="size-3.5 text-primary" />
        <span className="font-medium">Chapada dos Veadeiros, GO</span>
        <span className="hidden text-muted-foreground sm:inline">· 9 nodes · 16 links</span>
      </div>

      {/* Alert card */}
      <AnimatePresence mode="wait">
        {started && route && (
          <motion.div
            key={round}
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute bottom-4 left-4 w-[min(330px,calc(100%-2rem))] rounded-2xl border border-black/5 bg-white/90 p-3.5 shadow-[0_20px_50px_-20px_rgb(20_32_27/0.45)] backdrop-blur-md"
          >
            <div className="flex items-start gap-3">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", done ? "bg-accent text-primary" : "bg-danger/10 text-danger")}>
                {done ? <CheckCircle2 className="size-4.5" /> : <Flame className="size-4.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center justify-between gap-2 text-[13px] font-semibold">
                  {SENSORS[scenario.sensor].label} alert
                  <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] font-medium", done ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                    {done ? "Delivered" : `Hop ${Math.min(hops + 1, total)}/${total}`}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {scenario.source} · {byId.get(scenario.source)?.guardian} · <span className="font-mono text-foreground">{scenario.value}</span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              {route.map((id, i) => (
                <div key={id} className="flex flex-1 items-center gap-1 last:flex-none">
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 font-mono text-[10px] transition-colors duration-300",
                      i <= hops ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {id}
                  </span>
                  {i < route.length - 1 && (
                    <span className="relative h-px flex-1 bg-border">
                      <span className="absolute inset-y-0 left-0 bg-primary transition-all duration-700" style={{ width: i < hops ? "100%" : "0%" }} />
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2.5 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{km.toFixed(1)} km over LoRa</span>
              <span>0 cell towers</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gateway card */}
      <div className="absolute top-4 right-4 hidden w-52 rounded-2xl border border-black/5 bg-white/85 p-3 shadow-sm backdrop-blur-md md:block">
        <p className="flex items-center gap-2 text-xs font-medium">
          <span className="grid size-6 place-items-center rounded-lg bg-foreground text-background">
            <RadioTower className="size-3" />
          </span>
          Regional gateway
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 font-mono text-[10px]">
          <div className="rounded-lg bg-muted px-2 py-1.5">
            <p className="text-muted-foreground">Uplink</p>
            <p className="text-foreground">Alto Paraíso</p>
          </div>
          <div className="rounded-lg bg-muted px-2 py-1.5">
            <p className="text-muted-foreground">Alerts</p>
            <p className="text-foreground tabular-nums">{started ? round + (done ? 1 : 0) : 0} today</p>
          </div>
        </div>
      </div>
    </div>
  );
}
