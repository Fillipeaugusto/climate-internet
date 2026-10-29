import {
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  BatteryWarning,
  CheckCircle2,
  CloudRain,
  Cpu,
  Droplets,
  Flame,
  HeartHandshake,
  MessageSquareText,
  Network,
  RadioTower,
  Route,
  SatelliteDish,
  Signal,
  SignalZero,
  Sprout,
  Sun,
  Thermometer,
  UserPlus,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { GuardianCards } from "@/components/guardian-cards";
import { HeroMap } from "@/components/hero-map";
import { HowItWorks } from "@/components/how-it-works";
import { Logo } from "@/components/logo";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { ButtonLink } from "@/components/motion/button/base";
import { Marquee } from "@/components/motion/marquee";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

const THREATS = [
  { icon: Thermometer, label: "Extreme heat" },
  { icon: CloudRain, label: "Long droughts" },
  { icon: Flame, label: "Wildfires" },
  { icon: Droplets, label: "Intense rainfall" },
  { icon: Waves, label: "Floods" },
  { icon: Wind, label: "Smoke & air pollution" },
];

const HARDWARE: { icon: LucideIcon; name: string; detail: string; price: string; specs: string[] }[] = [
  { icon: Sun, name: "RAK 4-in-1 Solar Node", detail: "Outdoor enclosure, 5 W solar panel, battery and controller in one box.", price: "120", specs: ["IP67", "Solar", "LoRa 915"] },
  { icon: Cpu, name: "ThinkNode M1 / M2", detail: "Pocket Meshtastic companion for off-grid text messaging.", price: "53", specs: ["Pocket", "Meshtastic", "BLE"] },
  { icon: SatelliteDish, name: "Gateway station", detail: "Mains-powered uplink that bridges the mesh to the platform.", price: "300", specs: ["Mains", "Uplink", "Multi-channel"] },
];

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground", className)}>{children}</span>;
}

function SectionHead({ eyebrow, title, text, className }: { eyebrow: string; title: React.ReactNode; text?: string; className?: string }) {
  return (
    <ScrollReveal className={cn("max-w-3xl", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">{title}</h2>
      {text && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">{text}</p>}
    </ScrollReveal>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh overflow-x-clip font-body">
      <SiteHeader />

      {/* ── Hero ───────────────────────────────── */}
      <section className="relative -mt-[68px] pt-[68px]">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(95_211_160/0.22),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 text-center md:pt-24">
          <ScrollReveal>
            <a href="#problem" className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/80 py-1 pr-3 pl-1 text-xs shadow-xs backdrop-blur transition-colors hover:border-foreground/20">
              <span className="rounded-full bg-foreground px-2 py-0.5 font-medium text-background">2026</span>
              IEEE ComSoc LATAM Student Contest
              <ArrowRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </a>
            <h1 className="mx-auto mt-7 max-w-5xl font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[1.05] font-semibold tracking-[-0.035em] text-balance">
              Critical climate data should travel <em className="text-primary">farther</em> and <em className="text-primary">earlier.</em>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
              A low-cost LoRa mesh network that carries environmental alerts across rural Latin America — where cellular coverage is weak, expensive, or gone.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/platform" size="lg" className="h-11 px-5 text-[15px]">
                Launch live demo <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="#how" size="lg" variant="secondary" className="h-11 px-5 text-[15px]">
                How it works
              </ButtonLink>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.15} y={30} className="relative mx-auto mt-14 max-w-6xl px-4">
          <div className="rounded-[30px] border border-border/80 bg-card/60 p-2 shadow-[0_50px_100px_-40px_rgb(20_32_27/0.45)] backdrop-blur">
            <div className="overflow-hidden rounded-[23px] border border-border/70 bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-border" />
                  <span className="size-2.5 rounded-full bg-border" />
                  <span className="size-2.5 rounded-full bg-border" />
                </div>
                <span className="rounded-md bg-muted px-3 py-0.5 font-mono text-[11px] text-muted-foreground">climate-internet.app/platform</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <span className="relative flex size-2"><span className="ping-soft absolute inset-0 rounded-full bg-primary" /><span className="relative size-2 rounded-full bg-primary" /></span>
                  Live
                </span>
              </div>
              <div className="h-[460px] md:h-[560px]">
                <HeroMap />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Proof row */}
        <div className="mx-auto mt-14 grid max-w-6xl gap-10 px-4 md:grid-cols-[auto_auto_auto_1fr] md:items-start md:gap-12">
          {[
            { value: 15, suffix: " km", label: "line-of-sight range\nper LoRa hop" },
            { value: 53, prefix: "$", label: "entry cost of a\nmesh node (USD)" },
            { value: 0, label: "cell towers needed\nto relay an alert" },
          ].map((s) => (
            <ScrollReveal key={s.label} className="flex items-center gap-3">
              <span className="font-display text-5xl leading-none font-semibold tracking-[-0.04em]">
                {s.prefix}
                <AnimatedNumber value={s.value} startOnView />
                {s.suffix && <span className="text-3xl">{s.suffix}</span>}
              </span>
              <span className="text-sm leading-snug whitespace-pre-line text-muted-foreground">{s.label}</span>
            </ScrollReveal>
          ))}
          <ScrollReveal className="md:justify-self-end md:text-right">
            <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground md:ml-auto">
              “Climate resilience is not only about collecting data — it’s about making sure the right information reaches the right people when it matters.”
            </p>
            <p className="mt-3 text-sm font-medium">Climate Internet team</p>
          </ScrollReveal>
        </div>
      </section>

      <div className="mt-20 border-y border-border bg-card/60 py-5">
        <Marquee speed={40} fade pauseOnHover gap="3.5rem">
          {THREATS.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2.5 text-[15px] text-muted-foreground">
              <Icon className="size-4 text-foreground/60" /> {label}
            </span>
          ))}
        </Marquee>
      </div>

      {/* ── Problem ─────────────────────────────── */}
      <section id="problem" className="mx-auto grid max-w-6xl scroll-mt-24 items-center gap-12 px-4 py-28 lg:grid-cols-[1fr_1.05fr]">
        <SectionHead
          eyebrow="The overlooked problem"
          title={<>A sensor can detect the fire. <em className="text-muted-foreground">The warning still arrives too late.</em></>}
          text="Many places where environmental data matters most are rural or poorly connected. Once a wildfire starts it spreads fast — destroying habitats while releasing CO₂ and other pollutants. Detection without communication is just a log file."
        />
        <ScrollReveal delay={0.1}>
          <div className="mesh mesh-ember rounded-[28px] p-5 sm:p-7">
            <div className="space-y-3">
              {[
                {
                  title: "Without a mesh",
                  icon: SignalZero,
                  tone: "text-danger",
                  rows: [["14:02", "Sensor detects smoke"], ["14:02", "No cellular coverage"], ["17:40", "Smoke seen from town"]],
                  foot: "+3 h 38 min",
                },
                {
                  title: "With Climate Internet",
                  icon: Signal,
                  tone: "text-primary",
                  rows: [["14:02:00", "Sensor detects smoke"], ["14:02:03", "4 LoRa hops · 85 km"], ["14:02:04", "Civil defense notified"]],
                  foot: "4 seconds",
                },
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-[0_24px_60px_-28px_rgb(20_32_27/0.5)] backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-medium"><c.icon className={cn("size-4", c.tone)} />{c.title}</p>
                    <span className={cn("font-mono text-xs", c.tone)}>{c.foot}</span>
                  </div>
                  <ol className="mt-3 grid grid-cols-3 gap-2">
                    {c.rows.map(([t, label], i) => (
                      <li key={label} className="rounded-xl bg-muted/80 p-2.5">
                        <p className="font-mono text-[10px] text-muted-foreground">{t}</p>
                        <p className={cn("mt-1 text-xs leading-snug", i === 2 && c.tone)}>{label}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── How it works ────────────────────────── */}
      <section id="how" className="scroll-mt-24 border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-28">
          <SectionHead
            eyebrow="How it works"
            title={<>We don’t reinvent the radio. <em className="text-muted-foreground">We bring the mesh to life.</em></>}
            text="Instead of requiring every device to reach the internet, nearby nodes relay small packets until they reach a gateway, a connected station — or another person in the mesh."
          />
          <div className="mt-16">
            <HowItWorks />
          </div>
        </div>
      </section>

      {/* ── Platform bento ──────────────────────── */}
      <section id="platform" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow="The platform" title={<>One visual layer for the <em>whole</em> network.</>} />
          <ScrollReveal>
            <ButtonLink href="/platform" variant="secondary">
              Open the live demo <ArrowUpRight className="size-4" />
            </ButtonLink>
          </ScrollReveal>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3 md:grid-rows-[auto_auto]">
          <ScrollReveal className="md:col-span-2 md:row-span-2">
            <div className="mesh mesh-forest flex h-full flex-col justify-between gap-8 rounded-[28px] p-7">
              <div>
                <Network className="size-5" />
                <h3 className="mt-4 text-2xl font-semibold tracking-tight">Register & map every node</h3>
                <p className="mt-2 max-w-md text-foreground/70">Each sentinel sits on a real map with its guardian, location, sensors, battery and links — so the shape of the mesh is never a guess.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { id: "N-01", g: "Serra Verde Ranger Post", b: 82, s: "ok" },
                  { id: "N-04", g: "Sítio Três Pedras", b: 21, s: "low" },
                  { id: "N-06", g: "Municipal Civil Defense", b: 58, s: "ok" },
                  { id: "N-07", g: "UnB Climate Lab", b: 3, s: "critical" },
                ].map((n) => (
                  <div key={n.id} className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/85 p-3 shadow-sm backdrop-blur-md">
                    <span className={cn("size-2.5 shrink-0 rounded-full", n.s === "ok" ? "bg-primary" : n.s === "low" ? "bg-warn" : "bg-danger")} />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold">{n.id}</p>
                      <p className="truncate text-xs text-muted-foreground">{n.g}</p>
                    </div>
                    <div className="w-14">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", n.s === "ok" ? "bg-primary" : n.s === "low" ? "bg-warn" : "bg-danger")} style={{ width: `${n.b}%` }} />
                      </div>
                      <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground">{n.b}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.06}>
            <div className="flex h-full flex-col rounded-[28px] border border-border bg-card p-6">
              <BatteryCharging className="size-5" />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">Monitor status in real time</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Battery, link quality and health for every sentinel.</p>
              <div className="mt-6 flex items-end gap-1.5">
                {[82, 91, 64, 21, 76, 58, 3, 88].map((b, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-20 w-full items-end overflow-hidden rounded-md bg-muted">
                      <div className={cn("w-full rounded-md", b < 10 ? "bg-danger" : b < 30 ? "bg-warn" : "bg-foreground/80")} style={{ height: `${Math.max(b, 6)}%` }} />
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground">0{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.12}>
            <div className="flex h-full flex-col rounded-[28px] border border-border bg-card p-6">
              <Route className="size-5" />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">Trace alert routes</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Watch a packet move hop-by-hop — and around failures.</p>
              <ol className="mt-5 space-y-2.5 border-l border-border pl-4 text-xs">
                <li className="relative"><span className="absolute top-1 -left-[21px] size-2.5 rounded-full bg-danger ring-4 ring-card" />Alert at N-01 · smoke</li>
                <li className="relative text-muted-foreground"><span className="absolute top-1 -left-[21px] size-2.5 rounded-full bg-warn ring-4 ring-card" />Routing around N-07 (3%)</li>
                <li className="relative"><span className="absolute top-1 -left-[21px] size-2.5 rounded-full bg-primary ring-4 ring-card" />Delivered to gateway</li>
              </ol>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.06} className="md:col-span-3">
            <div className="mesh mesh-sky grid items-center gap-6 rounded-[28px] p-7 md:grid-cols-[1fr_1.2fr]">
              <div>
                <MessageSquareText className="size-5" />
                <h3 className="mt-4 text-2xl font-semibold tracking-tight">Text messages when cellular fails</h3>
                <p className="mt-2 max-w-md text-foreground/70">LoRa carries short text between guardians and the gateway. In an emergency, being part of the mesh isn’t just a contribution — it’s a safety net.</p>
              </div>
              <div className="space-y-2">
                {[
                  { from: "N-06 · Civil Defense", text: "Bridge road flooded near km 12 — use the north detour.", hops: 2 },
                  { from: "N-02 · Escola Rural Ipê", text: "Evacuation drill complete. All students safe.", hops: 3 },
                ].map((m, i) => (
                  <div key={m.from} className={cn("max-w-[88%] rounded-2xl border border-white/60 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-md", i === 1 && "ml-auto")}>
                    <p className="font-mono text-[10px] text-muted-foreground">{m.from}</p>
                    <p className="mt-0.5 text-sm">{m.text}</p>
                    <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-primary"><CheckCircle2 className="size-3" />delivered via {m.hops} hops</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Guardians ───────────────────────────── */}
      <section id="guardians" className="scroll-mt-24 border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-28">
          <SectionHead
            eyebrow="Environmental guardians"
            title={<>We scale through <em>collaboration,</em> not infrastructure.</>}
            text="A school, a farmer, an NGO or a municipality each hosts a sentinel node, configured with exactly the sensors their location needs. Same infrastructure — adapted to every collaborator’s problem."
          />
          <div className="mt-14">
            <GuardianCards />
          </div>

          <ScrollReveal className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-background px-6 py-4 text-sm text-muted-foreground">
            {[
              { icon: UserPlus, t: "Register collaborator" },
              { icon: Sprout, t: "Assign node" },
              { icon: Thermometer, t: "Configure sensors" },
              { icon: Network, t: "Node joins the mesh" },
            ].map(({ icon: Icon, t }, i, a) => (
              <span key={t} className="flex items-center gap-3">
                <span className="flex items-center gap-2"><Icon className="size-4 text-primary" />{t}</span>
                {i < a.length - 1 && <ArrowRight className="size-3.5 text-border" />}
              </span>
            ))}
          </ScrollReveal>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ScrollReveal>
              <div className="h-full rounded-[28px] border border-border bg-background p-7">
                <HeartHandshake className="size-5" />
                <h3 className="mt-4 text-xl font-semibold tracking-tight">Better decisions for authorities</h3>
                <p className="mt-2 text-muted-foreground">Guardians feed local, real-time data that helps authorities make faster, better-informed environmental decisions.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <div className="h-full rounded-[28px] border border-border bg-background p-7">
                <MessageSquareText className="size-5" />
                <h3 className="mt-4 text-xl font-semibold tracking-tight">A safety net for every guardian</h3>
                <p className="mt-2 text-muted-foreground">Joining the mesh gives each collaborator a resilient communication line of their own — even when cellular networks are down.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Hardware ────────────────────────────── */}
      <section id="hardware" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-28">
        <SectionHead
          eyebrow="Hardware"
          title={<>Off-the-shelf radios. <em className="text-muted-foreground">Our work is the software.</em></>}
          text="Commercial LoRa hardware from manufacturers like RAK Wireless and Elecrow already solves long-range radio. Low cost, versatile, and ready to scale."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {HARDWARE.map((h, i) => (
            <ScrollReveal key={h.name} delay={i * 0.08}>
              <div className="group flex h-full flex-col rounded-[28px] border border-border bg-card p-2 transition-shadow hover:shadow-[0_30px_60px_-30px_rgb(20_32_27/0.35)]">
                <div className={cn("mesh grid aspect-[16/10] place-items-center rounded-[22px]", ["mesh-sand", "mesh-sky", "mesh-forest"][i])}>
                  <span className="grid size-16 place-items-center rounded-2xl bg-white/85 shadow-lg backdrop-blur transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-4deg]">
                    <h.icon className="size-7" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold tracking-tight">{h.name}</h3>
                    <p className="font-display text-2xl leading-none font-semibold tracking-tight">
                      <span className="text-base text-muted-foreground">≈ $</span>{h.price}
                    </p>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{h.detail}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {h.specs.map((s) => (
                      <span key={s} className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <ScrollReveal>
          <div className="mesh mesh-ink relative overflow-hidden rounded-[32px] px-6 py-20 text-center text-white sm:px-12">
            <RadioTower className="mx-auto size-6 text-[#5fd3a0]" />
            <p className="mx-auto mt-6 max-w-3xl font-display text-[clamp(1.9rem,4vw,3rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-balance">
              One sensor can collect data. One node can transmit it. <em className="text-[#5fd3a0]">A network can make it useful.</em>
            </p>
            <p className="mx-auto mt-6 max-w-xl text-white/65">
              Not a replacement for monitoring systems, cellular networks or public authorities — a resilient layer where those systems don’t reach, or when they stop working.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/platform" size="lg" className="h-11 bg-white px-5 text-[15px] text-foreground hover:bg-white/90">
                Explore the platform <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="#guardians" size="lg" variant="outline" className="h-11 border-white/20 px-5 text-[15px] text-white hover:bg-white/10">
                Become a guardian
              </ButtonLink>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo subtitle="Monitor · Connect · Prevent" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">A distributed communication layer for climate monitoring and environmental resilience in Latin America.</p>
          </div>
          <div className="text-sm">
            <p className="font-medium">Project</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li><a href="#problem" className="hover:text-foreground">Problem</a></li>
              <li><a href="#how" className="hover:text-foreground">How it works</a></li>
              <li><a href="#guardians" className="hover:text-foreground">Guardians</a></li>
              <li><a href="#hardware" className="hover:text-foreground">Hardware</a></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-medium">Platform</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li><Link href="/platform" className="hover:text-foreground">Mesh monitor</Link></li>
              <li className="flex items-center gap-2"><BatteryWarning className="size-3.5" />Simulated data</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-5 font-mono text-[11px] text-muted-foreground">
            <span>Prototype · IEEE ComSoc LATAM Student Contest 2026</span>
            <span>Map data © OpenStreetMap contributors · OpenFreeMap</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
