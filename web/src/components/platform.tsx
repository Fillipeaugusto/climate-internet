"use client";

import {
  Activity,
  BatteryFull,
  BatteryLow,
  BatteryWarning,
  BellRing,
  Building2,
  CircleDot,
  CloudRain,
  Droplets,
  FlaskConical,
  Gauge,
  GraduationCap,
  Layers,
  Leaf,
  Map as MapIcon,
  Maximize2,
  MessageSquareText,
  Mountain,
  Moon,
  Play,
  Plug,
  Radio,
  RadioTower,
  Satellite,
  Search,
  Send,
  Settings2,
  Signal,
  Sprout,
  Thermometer,
  Tractor,
  UserPlus,
  Users,
  Waves,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import NextLink from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkline } from "@/components/charts/sparkline";
import { GeoMeshMap, type MapStyleKey } from "@/components/geo-mesh-map";
import { LogoMark } from "@/components/logo";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { Switch } from "@/components/motion/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import {
  clock,
  distanceKm,
  findRoute,
  fmt,
  fmtCoord,
  health,
  INITIAL_NODES,
  LINKS,
  lngLat,
  neighbors,
  reading,
  SENSOR_ORDER,
  SENSORS,
  type GuardianType,
  type Link,
  type MeshNode,
  type SensorKey,
} from "@/lib/mesh";
import { cn } from "@/lib/utils";

const SENSOR_ICON: Record<SensorKey, LucideIcon> = {
  temperature: Thermometer,
  humidity: Droplets,
  airQuality: Gauge,
  smoke: Wind,
  riverLevel: Waves,
  soilMoisture: Sprout,
  rainfall: CloudRain,
};

const GUARDIAN_ICON: Record<GuardianType, LucideIcon> = {
  School: GraduationCap,
  Farmer: Tractor,
  NGO: Leaf,
  Municipality: Building2,
  Research: FlaskConical,
};

const STYLE_ICON: Record<MapStyleKey, LucideIcon> = { light: MapIcon, terrain: Mountain, satellite: Satellite, dark: Moon };
const STYLE_LABEL: Record<MapStyleKey, string> = { light: "Light", terrain: "Streets", satellite: "Satellite", dark: "Dark" };

const HEALTH_TEXT = { ok: "text-primary", low: "text-warn", critical: "text-danger", offline: "text-muted-foreground" };
const HEALTH_BG = { ok: "bg-primary", low: "bg-warn", critical: "bg-danger", offline: "bg-muted-foreground/40" };
const HEALTH_LABEL = { ok: "Healthy", low: "Low battery", critical: "Critical", offline: "Offline" };

type LogEntry = { id: number; time: string; text: string; tone?: "alert" | "ok" | "warn" };
type Message = { id: number; from: string; text: string; time: string; hops: number | null; status: "sending" | "delivered" | "queued" };

const seedOf = (id: string) => id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

const panel = "rounded-2xl border border-border/80 bg-card/95 shadow-[0_18px_50px_-24px_rgb(20_32_27/0.35)] backdrop-blur-xl";

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-medium tracking-wide text-muted-foreground uppercase", className)}>{children}</p>;
}

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export function Platform() {
  const [tab, setTab] = useState("map");
  const [nodes, setNodes] = useState<MeshNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<Link[]>(LINKS);
  const [selected, setSelected] = useState("N-01");
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [now, setNow] = useState<string>("");
  const [tick, setTick] = useState(0);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("light");
  const [coverage, setCoverage] = useState(false);
  const [fitKey, setFitKey] = useState(0);
  const wide = useWide();

  const [route, setRoute] = useState<string[] | null>(null);
  const [hops, setHops] = useState(0);
  const [relaying, setRelaying] = useState(false);
  const [delivered, setDelivered] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const logId = useRef(0);

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: "N-06", text: "Bridge road flooded near km 12 — use the north detour.", time: "07:42:10", hops: 2, status: "delivered" },
    { id: 2, from: "N-02", text: "School evacuation drill complete. All students safe.", time: "08:15:03", hops: 3, status: "delivered" },
  ]);
  const [cellularDown, setCellularDown] = useState(true);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const node = byId.get(selected) ?? nodes[0];

  useEffect(() => {
    setNow(clock());
    const t = setInterval(() => {
      setNow(clock());
      setTick((x) => x + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const push = (text: string, tone?: LogEntry["tone"]) =>
    setLog((l) => [...l, { id: ++logId.current, time: clock(), text, tone }]);

  // Advance the relay one hop at a time.
  useEffect(() => {
    if (!relaying || !route) return;
    if (hops >= route.length - 1) {
      push("Delivered to gateway — authorities & guardians notified", "ok");
      setDelivered((d) => d + 1);
      setRelaying(false);
      return;
    }
    const t = setTimeout(() => {
      const a = route[hops];
      const b = route[hops + 1];
      const l = links.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
      const km = distanceKm(byId.get(a)!, byId.get(b)!);
      push(`Relayed ${a} → ${b} · ${km.toFixed(1)} km${l ? ` · RSSI ${l.rssi} dBm` : ""}`);
      setHops((h) => h + 1);
    }, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relaying, hops, route]);

  function select(id: string, fly = false) {
    setSelected(id);
    if (fly) setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 }));
  }

  function simulateAlert() {
    const src = node.gateway ? "N-01" : node.id;
    const srcNode = byId.get(src)!;
    const sensor = srcNode.sensors[0] ?? "temperature";
    setLog([]);
    setHops(0);
    push(`Alert at ${src} · ${SENSORS[sensor].label} above threshold`, "alert");
    const r = findRoute(src, nodes, links);
    setRoute(r);
    if (!r) {
      push("No healthy path to gateway — packet held (store & forward)", "warn");
      return;
    }
    const skipped = nodes.filter((n) => !n.gateway && health(n) !== "ok" && !r.includes(n.id)).map((n) => n.id);
    if (skipped.length) push(`Routing around ${skipped.join(", ")} (low battery / offline)`, "warn");
    setRelaying(true);
  }

  function updateNode(id: string, patch: Partial<MeshNode>) {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function toggleSensor(key: SensorKey) {
    updateNode(node.id, {
      sensors: node.sensors.includes(key) ? node.sensors.filter((s) => s !== key) : [...node.sensors, key],
    });
  }

  function registerGuardian(g: { name: string; type: GuardianType; location: string; sensors: SensorKey[] }) {
    const id = `N-${String(nodes.filter((n) => !n.gateway).length + 1).padStart(2, "0")}`;
    // Drop the new node in the emptiest area of the map, then link it to its two nearest neighbours.
    const spots = [
      { x: 620, y: 140 }, { x: 250, y: 300 }, { x: 560, y: 560 }, { x: 820, y: 330 }, { x: 260, y: 640 }, { x: 640, y: 30 },
    ];
    const spot = spots.find((s) => nodes.every((n) => Math.hypot(n.x - s.x, n.y - s.y) > 90)) ?? { x: 500, y: 200 };
    const newNode: MeshNode = { id, ...spot, battery: 100, online: true, guardian: g.name, guardianType: g.type, location: g.location, sensors: g.sensors };
    const nearest = [...nodes]
      .filter((n) => !n.gateway)
      .sort((a, b) => Math.hypot(a.x - spot.x, a.y - spot.y) - Math.hypot(b.x - spot.x, b.y - spot.y))
      .slice(0, 2);
    setNodes((ns) => [...ns.filter((n) => !n.gateway), newNode, ...ns.filter((n) => n.gateway)]);
    setLinks((ls) => [...ls, ...nearest.map((n) => ({ a: id, b: n.id, rssi: -88 - Math.round(Math.hypot(n.x - spot.x, n.y - spot.y) / 30) }))]);
    setSelected(id);
    return id;
  }

  function sendMessage(from: string, text: string) {
    const r = findRoute(from, nodes, links);
    const id = Date.now();
    setMessages((m) => [...m, { id, from, text, time: clock(), hops: r ? r.length - 1 : null, status: r ? "sending" : "queued" }]);
    if (r) {
      setTimeout(() => setMessages((m) => m.map((x) => (x.id === id ? { ...x, status: "delivered" } : x))), 900 * r.length);
    }
  }

  const sensorNodes = nodes.filter((n) => !n.gateway);
  const online = sensorNodes.filter((n) => n.online).length;
  const done = route && hops >= route.length - 1 && !relaying;

  return (
    <Tabs value={tab} onValueChange={setTab} variant="pill" className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-auto min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border bg-card/90 px-3 py-2 backdrop-blur-xl md:px-4">
        <div className="flex min-w-0 items-center gap-3 md:gap-5">
          <NextLink href="/" className="flex items-center gap-2.5">
            <LogoMark className="size-7 rounded-[9px]" />
            <span className="hidden leading-tight whitespace-nowrap sm:block">
              <span className="block text-sm font-semibold tracking-tight">Climate Internet</span>
              <span className="block text-[11px] text-muted-foreground">Mesh Monitor</span>
            </span>
          </NextLink>
          <span className="hidden h-6 w-px bg-border md:block" />
          <TabsList className="border border-border bg-muted/60 text-[13px]">
            <TabsTrigger value="map" icon={<MapIcon className="size-3.5" />}>Map</TabsTrigger>
            <TabsTrigger value="profile" icon={<Radio className="size-3.5" />}>Node</TabsTrigger>
            <TabsTrigger value="guardians" icon={<Users className="size-3.5" />}>Guardians</TabsTrigger>
            <TabsTrigger value="messages" icon={<MessageSquareText className="size-3.5" />}>Messages</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs xl:flex">
            <span className="relative flex size-2"><span className="ping-soft absolute inset-0 rounded-full bg-primary" /><span className="relative size-2 rounded-full bg-primary" /></span>
            {online}/{sensorNodes.length} nodes online
          </span>
          <span className="rounded-full border border-warn/40 bg-warn/10 px-2.5 py-1 text-xs font-medium text-warn">Simulated data</span>
          <span className="hidden rounded-full bg-muted px-2.5 py-1 font-mono text-xs tabular-nums sm:block" suppressHydrationWarning>{now}</span>
        </div>
      </header>

      {/* ── MESH MAP ─────────────────────────────── */}
      <TabsContent value="map" className="mt-0 flex flex-1 flex-col rounded-none lg:relative lg:block lg:h-[calc(100dvh-3.5rem)] lg:flex-none">
        <div className="relative h-[62vh] lg:absolute lg:inset-0 lg:h-auto lg:[--map-inset-right:368px]">
          <GeoMeshMap
            nodes={nodes}
            links={links}
            route={route}
            hops={hops}
            broadcasting={relaying && route ? route[hops] : null}
            selected={selected}
            onSelect={(id) => select(id)}
            mapStyle={mapStyle}
            coverage={coverage}
            fitKey={fitKey}
            focus={focus}
            padding={wide ? { top: 70, bottom: 110, left: 350, right: 390 } : { top: 50, bottom: 90, left: 40, right: 40 }}
          />

          {/* Toolbar */}
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-3 lg:pr-[368px] lg:pl-[328px]">
            <div className={cn(panel, "pointer-events-auto flex items-center gap-1 rounded-full p-1.5")}>
              <Button size="sm" variant={relaying ? "secondary" : "primary"} onClick={simulateAlert} disabled={relaying} className="h-9 gap-2 px-4 text-[13px]">
                {relaying ? <Activity className="size-3.5 animate-pulse" /> : <Play className="size-3.5 fill-current" />}
                {relaying ? "Relaying…" : <>Simulate alert<span className="hidden font-mono text-background/60 sm:inline">{node.gateway ? "" : ` · ${node.id}`}</span></>}
              </Button>
              <span className="mx-1 h-6 w-px bg-border" />
              <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Basemap">
                {(Object.keys(STYLE_ICON) as MapStyleKey[]).map((k) => {
                  const Icon = STYLE_ICON[k];
                  return (
                    <button
                      key={k}
                      role="radio"
                      aria-checked={mapStyle === k}
                      title={STYLE_LABEL[k]}
                      onClick={() => setMapStyle(k)}
                      className={cn("grid size-9 place-items-center rounded-full transition-colors", mapStyle === k ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
                    >
                      <Icon className="size-4" />
                      <span className="sr-only">{STYLE_LABEL[k]}</span>
                    </button>
                  );
                })}
              </div>
              <span className="mx-1 h-6 w-px bg-border" />
              <button
                onClick={() => setCoverage((c) => !c)}
                aria-pressed={coverage}
                title="LoRa coverage"
                className={cn("grid size-9 place-items-center rounded-full transition-colors", coverage ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <Layers className="size-4" />
                <span className="sr-only">Toggle coverage</span>
              </button>
              <button onClick={() => setFitKey((k) => k + 1)} title="Fit mesh" className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Maximize2 className="size-4" />
                <span className="sr-only">Fit mesh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Left: fleet */}
        <aside className={cn(panel, "z-10 m-3 flex flex-col overflow-hidden lg:absolute lg:top-4 lg:bottom-4 lg:left-4 lg:m-0 lg:w-[300px]")}>
          <Fleet nodes={nodes} links={links} selected={selected} delivered={delivered} onSelect={(id) => select(id, true)} />
        </aside>

        {/* Right: inspector + log */}
        <aside className="z-10 m-3 mt-0 flex flex-col gap-3 lg:absolute lg:top-4 lg:right-4 lg:bottom-4 lg:m-0 lg:w-[340px]">
          <NodeCard node={node} links={links} tick={tick} onToggleOnline={(v) => updateNode(node.id, { online: v })} onOpenProfile={() => setTab("profile")} />
          <div className={cn(panel, "flex min-h-[220px] flex-1 flex-col overflow-hidden")}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-medium"><BellRing className="size-4 text-muted-foreground" />Alert route</p>
              {route && (
                <AnimatedBadge size="sm" status={done ? "success" : relaying ? "loading" : "warning"} contentKey={done ? "d" : relaying ? "r" : "q"}>
                  {done ? "Delivered" : relaying ? `Hop ${hops + 1}/${route.length - 1}` : "Queued"}
                </AnimatedBadge>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {log.length === 0 ? (
                <div className="grid h-full place-items-center py-6 text-center">
                  <div>
                    <span className="mx-auto grid size-10 place-items-center rounded-full bg-muted text-muted-foreground"><CircleDot className="size-4" /></span>
                    <p className="mt-3 text-sm font-medium">No active alert</p>
                    <p className="mx-auto mt-1 max-w-[220px] text-xs text-muted-foreground">Select a node and press “Simulate alert” to trace a packet across the mesh.</p>
                  </div>
                </div>
              ) : (
                <ol className="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-border">
                  <AnimatePresence initial={false}>
                    {log.map((e) => (
                      <motion.li key={e.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="relative pl-6">
                        <span
                          className={cn(
                            "absolute top-1.5 left-0 size-[11px] rounded-full ring-4 ring-card",
                            e.tone === "alert" ? "bg-danger" : e.tone === "ok" ? "bg-primary" : e.tone === "warn" ? "bg-warn" : "bg-foreground/30",
                          )}
                        />
                        <p className="font-mono text-[10px] text-muted-foreground">{e.time}</p>
                        <p className="text-[13px] leading-snug">{e.text}</p>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ol>
              )}
            </div>
          </div>
        </aside>
      </TabsContent>

      {/* ── NODE PROFILE ─────────────────────────── */}
      <TabsContent value="profile" className="relative mt-0 flex-1 rounded-none">
        <NodeProfile
          nodes={sensorNodes}
          node={node.gateway ? sensorNodes[0] : node}
          tick={tick}
          onSelect={setSelected}
          onToggleSensor={toggleSensor}
          onClose={() => setTab("map")}
        />
      </TabsContent>

      {/* ── GUARDIANS ────────────────────────────── */}
      <TabsContent value="guardians" className="mt-0 flex-1 rounded-none">
        <Guardians
          nodes={sensorNodes}
          onRegister={(g) => registerGuardian(g)}
          onView={(id) => {
            select(id, true);
            setTab("map");
          }}
        />
      </TabsContent>

      {/* ── MESSAGES ─────────────────────────────── */}
      <TabsContent value="messages" className="mt-0 flex-1 rounded-none">
        <Messages nodes={sensorNodes} messages={messages} cellularDown={cellularDown} setCellularDown={setCellularDown} onSend={sendMessage} />
      </TabsContent>
    </Tabs>
  );
}

/* ───────────────────────────────────────────── */

function BatteryBar({ value }: { value: number | null }) {
  if (value === null) return <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground"><Plug className="size-3" />mains</span>;
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", value < 10 ? "bg-danger" : value < 30 ? "bg-warn" : "bg-foreground/70")} style={{ width: `${Math.max(value, 4)}%` }} />
      </span>
      <span className="w-8 text-right font-mono text-[11px] text-muted-foreground tabular-nums">{value}%</span>
    </span>
  );
}

function Fleet({ nodes, links, selected, delivered, onSelect }: { nodes: MeshNode[]; links: Link[]; selected: string; delivered: number; onSelect: (id: string) => void }) {
  const [q, setQ] = useState("");
  const sensorNodes = nodes.filter((n) => !n.gateway);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const online = sensorNodes.filter((n) => n.online);
  const avg = Math.round(online.reduce((s, n) => s + (n.battery ?? 100), 0) / Math.max(online.length, 1));
  const activeLinks = links.filter((l) => byId.get(l.a)?.online && byId.get(l.b)?.online).length;
  const query = q.trim().toLowerCase();
  const list = nodes.filter((n) => !query || `${n.id} ${n.guardian} ${n.location}`.toLowerCase().includes(query));

  const kpis = [
    { label: "Online", value: `${online.length}/${sensorNodes.length}`, icon: Signal },
    { label: "Avg battery", value: `${avg}%`, icon: BatteryFull },
    { label: "Active links", value: `${activeLinks}`, icon: Activity },
    { label: "Alerts delivered", value: `${delivered}`, icon: BellRing },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-px border-b border-border bg-border">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon className="size-3" />{label}</p>
            <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <div className="p-3 pb-2">
        <label className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-sm focus-within:border-foreground/30">
          <Search className="size-3.5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search nodes, guardians…" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
        </label>
      </div>
      <ul className="flex-1 overflow-y-auto px-2 pb-2 max-lg:max-h-[320px]">
        {list.map((n) => {
          const h = health(n);
          const Icon = n.gateway ? RadioTower : GUARDIAN_ICON[n.guardianType];
          return (
            <li key={n.id}>
              <button
                onClick={() => onSelect(n.id)}
                className={cn("flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted", selected === n.id && "bg-muted ring-1 ring-border")}
              >
                <span className="relative grid size-8 shrink-0 place-items-center rounded-lg bg-background ring-1 ring-border">
                  <Icon className="size-3.5 text-foreground/70" />
                  <span className={cn("absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-card", HEALTH_BG[h])} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block font-mono text-xs font-semibold", h === "offline" && "text-muted-foreground line-through")}>{n.id}</span>
                  <span className="block truncate text-xs text-muted-foreground">{n.guardian}</span>
                </span>
                <BatteryBar value={n.battery} />
              </button>
            </li>
          );
        })}
        {list.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted-foreground">No nodes match “{q}”.</li>}
      </ul>
      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
        {(["ok", "low", "critical", "offline"] as const).map((h) => (
          <span key={h} className="flex items-center gap-1.5"><span className={cn("size-2 rounded-full", HEALTH_BG[h])} />{HEALTH_LABEL[h]}</span>
        ))}
      </div>
    </>
  );
}

/* ───────────────────────────────────────────── */

function NodeCard({ node, links, tick, onToggleOnline, onOpenProfile }: { node: MeshNode; links: Link[]; tick: number; onToggleOnline: (v: boolean) => void; onOpenProfile: () => void }) {
  const h = health(node);
  const Icon = node.gateway ? RadioTower : GUARDIAN_ICON[node.guardianType];
  const nb = neighbors(node.id, links);
  const best = nb.length ? Math.max(...nb.map((x) => x.link.rssi)) : null;
  return (
    <div className={cn(panel, "p-4")}>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", node.gateway ? "bg-foreground text-background" : "bg-accent text-accent-foreground")}>
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-base font-semibold">{node.id}</p>
            <span className={cn("flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium", HEALTH_TEXT[h])}>
              <span className={cn("size-1.5 rounded-full", HEALTH_BG[h])} />{HEALTH_LABEL[h]}
            </span>
          </div>
          <p className="truncate text-sm">{node.guardian}</p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">{node.location} · {fmtCoord(lngLat(node))}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-[11px]">
        {[
          { k: "Power", v: node.battery === null ? "Mains" : `${node.battery}%`, icon: node.battery !== null && node.battery < 30 ? BatteryLow : BatteryFull },
          { k: "Neighbours", v: `${nb.length}`, icon: Activity },
          { k: "Best link", v: best === null ? "—" : `${best} dBm`, icon: Signal },
        ].map(({ k, v, icon: I }) => (
          <div key={k} className="rounded-lg bg-muted/70 px-2.5 py-2">
            <p className="flex items-center gap-1 text-muted-foreground"><I className="size-3" />{k}</p>
            <p className="mt-0.5 font-mono text-[13px] text-foreground">{v}</p>
          </div>
        ))}
      </div>
      {node.sensors.length > 0 && (
        <div className="mt-3 space-y-2.5 max-lg:max-h-none lg:max-h-[190px] lg:overflow-y-auto">
          {node.sensors.map((k) => {
            const seed = seedOf(node.id) + SENSOR_ORDER.indexOf(k);
            const data = Array.from({ length: 24 }, (_, i) => reading(k, tick - 23 + i, seed));
            const SIcon = SENSOR_ICON[k];
            return (
              <div key={k} className={cn(!node.online && "opacity-40")}>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><SIcon className="size-3.5" />{SENSORS[k].label}</span>
                  <span className="font-mono tabular-nums">{node.online ? fmt(k, data[23]) : "—"}</span>
                </div>
                <Sparkline data={data} label={SENSORS[k].label} variant="area" height={30} color="var(--primary)" />
              </div>
            );
          })}
        </div>
      )}
      {!node.gateway && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <Switch checked={node.online} onCheckedChange={onToggleOnline} label="Online" />
          <Button size="sm" variant="secondary" onClick={onOpenProfile}><Settings2 className="size-3.5" />Configure</Button>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────── */

function NodeProfile({
  nodes,
  node,
  tick,
  onSelect,
  onToggleSensor,
  onClose,
}: {
  nodes: MeshNode[];
  node: MeshNode;
  tick: number;
  onSelect: (id: string) => void;
  onToggleSensor: (k: SensorKey) => void;
  onClose: () => void;
}) {
  const R = 210;
  const C = 270;
  const Icon = GUARDIAN_ICON[node.guardianType];
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
      <aside className={cn(panel, "h-fit overflow-hidden")}>
        <p className="border-b border-border px-4 py-3 text-sm font-medium">Nodes</p>
        <ul className="p-2">
          {nodes.map((n) => {
            const h = health(n);
            return (
              <li key={n.id}>
                <button onClick={() => onSelect(n.id)} className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted", n.id === node.id && "bg-foreground text-background hover:bg-foreground")}>
                  <span className={cn("size-2 rounded-full", HEALTH_BG[h])} />
                  <span className="font-mono text-xs font-semibold">{n.id}</span>
                  <span className={cn("truncate text-xs", n.id === node.id ? "text-background/70" : "text-muted-foreground")}>{n.guardian}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className={cn(panel, "relative overflow-hidden")}>
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex items-start justify-between gap-4 border-b border-border bg-card/80 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="size-5" /></span>
            <div>
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Sensor-agnostic node profile</p>
              <p className="text-lg font-semibold"><span className="font-mono">{node.id}</span> · {node.guardian}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{node.location} · {fmtCoord(lngLat(node))}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Back to map" className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="relative flex flex-col items-center px-4 pt-4 pb-8">
          <div className="relative aspect-square w-full max-w-[520px]">
            <svg viewBox="0 0 540 540" className="absolute inset-0 h-full w-full">
              <circle cx={C} cy={C} r={R} fill="none" stroke="var(--border)" strokeDasharray="2 6" />
              {SENSOR_ORDER.map((k, i) => {
                const a = (i / SENSOR_ORDER.length) * Math.PI * 2 - Math.PI / 2;
                const on = node.sensors.includes(k);
                return (
                  <motion.line
                    key={k}
                    x1={C} y1={C} x2={C + Math.cos(a) * R} y2={C + Math.sin(a) * R}
                    stroke={on ? "var(--primary)" : "var(--border)"}
                    strokeWidth={on ? 2 : 1}
                    strokeDasharray={on ? undefined : "3 6"}
                    className={on ? "flow-dash" : undefined}
                    animate={{ opacity: on ? 0.9 : 0.7 }}
                  />
                );
              })}
            </svg>
            {SENSOR_ORDER.map((k, i) => {
              const a = (i / SENSOR_ORDER.length) * Math.PI * 2 - Math.PI / 2;
              const on = node.sensors.includes(k);
              const SIcon = SENSOR_ICON[k];
              const v = reading(k, tick, seedOf(node.id) + i);
              return (
                <button
                  key={k}
                  onClick={() => onToggleSensor(k)}
                  style={{ left: `${((C + Math.cos(a) * R) / 540) * 100}%`, top: `${((C + Math.sin(a) * R) / 540) * 100}%` }}
                  className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  aria-pressed={on}
                >
                  <motion.span
                    animate={{ scale: on ? 1 : 0.9 }}
                    className={cn(
                      "grid size-12 place-items-center rounded-2xl border bg-card shadow-sm transition-colors sm:size-14",
                      on ? "border-primary/40 bg-accent text-accent-foreground shadow-[0_10px_24px_-12px_var(--primary)]" : "border-border text-muted-foreground group-hover:border-foreground/30",
                    )}
                  >
                    <SIcon className="size-5" />
                  </motion.span>
                  <span className="mt-1.5 rounded-md bg-card/90 px-1.5 text-[11px] font-medium whitespace-nowrap sm:text-xs">{SENSORS[k].label}</span>
                  <span className={cn("font-mono text-[10px] tabular-nums", on ? "text-primary" : "text-transparent")}>{fmt(k, v)}</span>
                </button>
              );
            })}
            <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <span className="relative grid size-20 place-items-center rounded-3xl bg-foreground text-background shadow-2xl sm:size-24">
                <span className="ping-soft absolute inset-0 rounded-3xl bg-primary/40" />
                <Radio className="relative size-8" />
              </span>
              <span className="mt-2 rounded-full bg-card px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-muted-foreground shadow-sm">LoRa 915 MHz node</span>
            </div>
          </div>
          <p className="mt-2 max-w-xl text-center text-sm text-muted-foreground">
            Climate Internet is a communication layer, not a fixed sensor. Highlighted instruments are active on{" "}
            <span className="font-mono text-foreground">{node.id}</span>; the rest show what the same hardware could support elsewhere.{" "}
            <span className="text-foreground">Click a sensor to attach or detach it.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────── */

const TYPES: GuardianType[] = ["School", "Farmer", "NGO", "Municipality", "Research"];
const inputClass = "mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/40 focus:ring-4 focus:ring-foreground/5";

function Guardians({ nodes, onRegister, onView }: { nodes: MeshNode[]; onRegister: (g: { name: string; type: GuardianType; location: string; sensors: SensorKey[] }) => string; onView: (id: string) => void }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<GuardianType>("School");
  const [sensors, setSensors] = useState<SensorKey[]>(["temperature", "airQuality"]);
  const [joined, setJoined] = useState<string | null>(null);

  const counts = TYPES.map((t) => ({ t, n: nodes.filter((x) => x.guardianType === t).length }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || sensors.length === 0) return;
    const id = onRegister({ name: name.trim(), type, location: location.trim() || "Unspecified", sensors });
    setJoined(id);
    setName("");
    setLocation("");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
      <div>
        <SectionLabel>Environmental guardians</SectionLabel>
        <h2 className="mt-1 font-display text-3xl font-semibold tracking-[-0.03em]">Every node, its own collaborator.</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {counts.map(({ t, n }) => {
            const Icon = GUARDIAN_ICON[t];
            return (
              <div key={t} className={cn(panel, "p-4 shadow-none")}>
                <span className="grid size-8 place-items-center rounded-lg bg-muted"><Icon className="size-4" /></span>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{n}</p>
                <p className="text-xs text-muted-foreground">{t}</p>
              </div>
            );
          })}
        </div>
        <div className={cn(panel, "mt-4 overflow-x-auto shadow-none")}>
          <table className="w-full min-w-[580px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Node</th>
                <th className="px-4 py-3 font-medium">Guardian</th>
                <th className="px-4 py-3 font-medium">Sensors</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Battery</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => {
                const h = health(n);
                const Icon = GUARDIAN_ICON[n.guardianType];
                return (
                  <tr key={n.id} onClick={() => onView(n.id)} className={cn("cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/60", joined === n.id && "bg-accent/60")}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{n.id}</td>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-2"><Icon className="size-3.5 text-muted-foreground" />{n.guardian}</p>
                      <p className="text-xs text-muted-foreground">{n.guardianType} · {n.location}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-1">
                        {n.sensors.map((k) => {
                          const SIcon = SENSOR_ICON[k];
                          return <span key={k} title={SENSORS[k].label} className="grid size-7 place-items-center rounded-full bg-muted text-foreground/70 ring-2 ring-card"><SIcon className="size-3.5" /></span>;
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium", HEALTH_TEXT[h])}><span className={cn("size-1.5 rounded-full", HEALTH_BG[h])} />{HEALTH_LABEL[h]}</span>
                    </td>
                    <td className="px-4 py-3"><BatteryBar value={n.battery} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={submit} className={cn(panel, "h-fit p-5")}>
        <p className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-foreground text-background"><UserPlus className="size-4" /></span>Register a guardian</p>
        <ol className="mt-4 grid grid-cols-4 gap-1 text-center text-[10px] text-muted-foreground">
          {["Register", "Assign node", "Sensors", "Join mesh"].map((s, i) => (
            <li key={s} className="rounded-md bg-muted px-1 py-1.5"><span className="font-mono text-foreground">{i + 1}</span> {s}</li>
          ))}
        </ol>
        <label className="mt-5 block text-xs font-medium text-muted-foreground">Organization name
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Escola Municipal Aurora" className={inputClass} />
        </label>
        <label className="mt-3 block text-xs font-medium text-muted-foreground">Location
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. North ridge" className={inputClass} />
        </label>
        <p className="mt-4 text-xs font-medium text-muted-foreground">Collaborator type</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button type="button" key={t} onClick={() => setType(t)} className={cn("rounded-full border px-3 py-1 text-xs transition-colors", type === t ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30")}>{t}</button>
          ))}
        </div>
        <p className="mt-4 text-xs font-medium text-muted-foreground">Sensors for this location</p>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {SENSOR_ORDER.map((k) => {
            const on = sensors.includes(k);
            const Icon = SENSOR_ICON[k];
            return (
              <button type="button" key={k} onClick={() => setSensors((s) => (on ? s.filter((x) => x !== k) : [...s, k]))} className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors", on ? "border-primary/40 bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-foreground/30")}>
                <Icon className="size-3.5" />{SENSORS[k].label}
              </button>
            );
          })}
        </div>
        <Button type="submit" className="mt-5 h-10 w-full">Join the mesh</Button>
        <AnimatePresence>
          {joined && (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-lg bg-accent px-3 py-2 text-center text-xs text-accent-foreground">
              <span className="font-mono font-semibold">{joined}</span> joined the mesh and linked to its nearest neighbours.{" "}
              <button type="button" onClick={() => onView(joined)} className="font-medium underline underline-offset-2">View on map</button>
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

/* ───────────────────────────────────────────── */

function Messages({
  nodes,
  messages,
  cellularDown,
  setCellularDown,
  onSend,
}: {
  nodes: MeshNode[];
  messages: Message[];
  cellularDown: boolean;
  setCellularDown: (v: boolean) => void;
  onSend: (from: string, text: string) => void;
}) {
  const [from, setFrom] = useState(nodes[0]?.id ?? "N-01");
  const [text, setText] = useState("");
  const MAX = 160;
  const endRef = useRef<HTMLDivElement>(null);
  // Braces matter: Chrome's scrollIntoView now returns a Promise, which React would treat as a cleanup.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_300px]">
      <div className={cn(panel, "flex min-h-[560px] flex-col overflow-hidden")}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-foreground text-background"><MessageSquareText className="size-4" /></span>
            <div>
              <p className="font-semibold">Community channel</p>
              <p className="text-xs text-muted-foreground">Text over LoRa · works without cellular or internet</p>
            </div>
          </div>
          <AnimatedBadge size="sm" status={cellularDown ? "danger" : "success"} contentKey={String(cellularDown)}>
            Cellular {cellularDown ? "down" : "up"}
          </AnimatedBadge>
        </div>
        <div className="dot-grid flex-1 space-y-3 overflow-y-auto bg-background/50 p-5">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const n = nodes.find((x) => x.id === m.from);
              const Icon = n ? GUARDIAN_ICON[n.guardianType] : Radio;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex max-w-[85%] items-end gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-foreground/70 ring-1 ring-border"><Icon className="size-3.5" /></span>
                  <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 shadow-xs">
                    <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono font-semibold text-foreground">{m.from}</span>
                      {n?.guardian}
                      <span className="font-mono">· {m.time}</span>
                    </p>
                    <p className="mt-1 text-sm">{m.text}</p>
                    <p className={cn("mt-1 font-mono text-[10px]", m.status === "delivered" ? "text-primary" : m.status === "queued" ? "text-warn" : "text-muted-foreground")}>
                      {m.status === "delivered" && `✓ delivered via ${m.hops} hop${m.hops === 1 ? "" : "s"}`}
                      {m.status === "sending" && `relaying across ${m.hops} hops…`}
                      {m.status === "queued" && "no path — queued, will retry"}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onSend(from, text.trim());
            setText("");
          }}
          className="border-t border-border p-3"
        >
          <div className="flex items-center gap-2 rounded-xl border border-input bg-background p-1.5 focus-within:border-foreground/30">
            <select value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 rounded-lg bg-muted px-2 font-mono text-xs outline-none" aria-label="Send from node">
              {nodes.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
            <input value={text} onChange={(e) => setText(e.target.value.slice(0, MAX))} placeholder="Short message to the mesh…" className="h-8 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground" />
            <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">{text.length}/{MAX}</span>
            <Button type="submit" size="icon" className="size-8 rounded-lg" aria-label="Send"><Send className="size-3.5" /></Button>
          </div>
        </form>
      </div>
      <div className="space-y-4">
        <div className={cn("mesh mesh-sky rounded-2xl p-5")}>
          <p className="font-semibold">A safety net, not just a contribution</p>
          <p className="mt-2 text-sm text-foreground/70">When cellular networks fail during a flood or wildfire, every guardian on the mesh can still send short text messages hop-by-hop to the gateway and to each other.</p>
          <div className="mt-4 rounded-xl bg-white/80 p-3 backdrop-blur">
            <Switch checked={cellularDown} onCheckedChange={setCellularDown} label="Simulate cellular outage" />
          </div>
        </div>
        <div className={cn(panel, "p-4 shadow-none")}>
          <SectionLabel>Link budget</SectionLabel>
          <dl className="mt-3 space-y-2 text-sm">
            {[["Payload", `≤ ${MAX} B`], ["Modulation", "SF9 / 125 kHz"], ["Priority", "Alerts › msgs › telemetry"]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-mono text-xs">{v}</dd></div>
            ))}
          </dl>
        </div>
        <div className={cn(panel, "flex items-center gap-3 p-4 shadow-none")}>
          <BatteryWarning className="size-4 shrink-0 text-warn" />
          <p className="text-xs text-muted-foreground">Critical nodes (&lt;10% battery) are never used as relays — traffic routes around them.</p>
        </div>
      </div>
    </div>
  );
}
