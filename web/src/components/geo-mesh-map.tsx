"use client";

import type { GeoJSONSource, LngLatBoundsLike, Map as MLMap, Marker, StyleSpecification } from "maplibre-gl";
import { RadioTower } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { health, lngLat, type Link, type MeshNode, type NodeHealth } from "@/lib/mesh";
import { cn } from "@/lib/utils";

export type MapStyleKey = "light" | "terrain" | "satellite" | "dark";

/** Free, key-less basemaps: OpenFreeMap vector styles (OSM data) and Esri World Imagery. */
const SATELLITE: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    esri: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 18,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "esri", type: "raster", source: "esri" }],
};

export const MAP_STYLES: Record<MapStyleKey, { label: string; style: string | StyleSpecification }> = {
  light: { label: "Light", style: "https://tiles.openfreemap.org/styles/positron" },
  terrain: { label: "Streets", style: "https://tiles.openfreemap.org/styles/liberty" },
  satellite: { label: "Satellite", style: SATELLITE },
  dark: { label: "Dark", style: "https://tiles.openfreemap.org/styles/dark" },
};

/** Mirrors the CSS tokens in globals.css — map layers can't read CSS variables. */
export const HEALTH_HEX: Record<NodeHealth, string> = {
  ok: "#0d9468",
  low: "#d98a1c",
  critical: "#e0484d",
  offline: "#8a948f",
};
const PRIMARY = HEALTH_HEX.ok;

export type GeoMeshMapProps = {
  nodes: MeshNode[];
  links: Link[];
  /** Full planned route; the first `hops` edges are drawn as delivered. */
  route?: string[] | null;
  hops?: number;
  /** Node currently broadcasting — its other links light up faintly. */
  broadcasting?: string | null;
  selected?: string | null;
  onSelect?: (id: string) => void;
  mapStyle?: MapStyleKey;
  interactive?: boolean;
  /** Start on a globe over Latin America and fly into the mesh. */
  intro?: boolean;
  onIntroEnd?: () => void;
  /** Draw an approximate LoRa coverage radius around each node. */
  coverage?: boolean;
  /** Bump to re-fit the camera to the whole mesh. */
  fitKey?: number;
  /** Bump `n` to fly the camera to `id`. */
  focus?: { id: string; n: number } | null;
  padding?: number | { top: number; bottom: number; left: number; right: number };
  compact?: boolean;
  className?: string;
};

type Feature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>;
const collection = (features: Feature[]): GeoJSON.FeatureCollection => ({ type: "FeatureCollection", features });
const segment = (a: [number, number], b: [number, number], props: Record<string, unknown> = {}): Feature => ({
  type: "Feature",
  properties: props,
  geometry: { type: "LineString", coordinates: [a, b] },
});

function circle([lng, lat]: [number, number], km: number): Feature {
  const coords: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    coords.push([lng + (km / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(t), lat + (km / 110.574) * Math.sin(t)]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } };
}

function boundsOf(nodes: MeshNode[]): LngLatBoundsLike {
  const pts = nodes.map(lngLat);
  const lngs = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

/** Link/coverage colours flip to light strokes over satellite and dark basemaps. */
function addMeshLayers(map: MLMap, dark: boolean) {
  const empty = collection([]);
  const link = dark ? "#ffffff" : "#3c4a44";
  const deadLink = dark ? "#c9d1cd" : "#8a948f";
  const reach = dark ? "#5fd3a0" : PRIMARY;
  for (const id of ["coverage", "links", "bcast", "route"]) {
    if (!map.getSource(id)) map.addSource(id, { type: "geojson", data: empty });
  }
  map.addLayer({ id: "coverage-fill", type: "fill", source: "coverage", paint: { "fill-color": reach, "fill-opacity": dark ? 0.14 : 0.07 } });
  map.addLayer({ id: "coverage-line", type: "line", source: "coverage", paint: { "line-color": reach, "line-opacity": dark ? 0.6 : 0.35, "line-width": 1, "line-dasharray": [2, 3] } });
  map.addLayer({
    id: "links",
    type: "line",
    source: "links",
    layout: { "line-cap": "round" },
    paint: {
      "line-color": ["case", ["get", "dead"], deadLink, link],
      "line-opacity": ["case", ["get", "dead"], 0.25, dark ? 0.75 : 0.55],
      "line-width": 1.6,
      "line-dasharray": [2, 2.5],
    },
  });
  map.addLayer({ id: "bcast", type: "line", source: "bcast", layout: { "line-cap": "round" }, paint: { "line-color": reach, "line-width": 2.5, "line-opacity": 0.5 } });
  map.addLayer({ id: "route-glow", type: "line", source: "route", layout: { "line-cap": "round" }, paint: { "line-color": reach, "line-width": 14, "line-opacity": dark ? 0.35 : 0.22, "line-blur": 8 } });
  map.addLayer({ id: "route", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": reach, "line-width": 4 } });
}

function setData(map: MLMap, id: string, data: GeoJSON.FeatureCollection) {
  (map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
}

export function GeoMeshMap({
  nodes,
  links,
  route,
  hops = 0,
  broadcasting,
  selected,
  onSelect,
  mapStyle = "light",
  interactive = true,
  intro = false,
  onIntroEnd,
  coverage = false,
  fitKey = 0,
  focus,
  padding = 60,
  compact,
  className,
}: GeoMeshMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const prevHops = useRef(0);
  // Latest props for the one-time async init, without re-running it.
  const latest = useRef({ nodes, mapStyle, interactive, intro, padding, onIntroEnd });
  useEffect(() => {
    latest.current = { nodes, mapStyle, interactive, intro, padding, onIntroEnd };
  });
  const [pins, setPins] = useState<Record<string, HTMLElement>>({});
  /** Bumps on every (re)loaded style so layers and data re-sync. */
  const [styleGen, setStyleGen] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let map: MLMap | undefined;
    const markerMap = markers.current;
    import("maplibre-gl").then((ml) => {
      if (cancelled || !containerRef.current) return;
      const opts = latest.current;
      libRef.current = ml;
      const bounds = boundsOf(opts.nodes);
      map = new ml.Map({
        container: containerRef.current,
        style: MAP_STYLES[opts.mapStyle].style,
        ...(opts.intro ? { center: [-58, -16], zoom: 1.6 } : { bounds, fitBoundsOptions: { padding: opts.padding } }),
        interactive: opts.interactive,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        fadeDuration: 0,
      });
      if (opts.interactive) map.addControl(new ml.NavigationControl({ showCompass: false }), "bottom-right");
      map.on("style.load", () => {
        if (opts.intro) map!.setProjection({ type: "globe" });
        const style = latest.current.mapStyle;
        addMeshLayers(map!, style === "satellite" || style === "dark");
        setStyleGen((g) => g + 1);
      });
      map.once("load", () => {
        // Start with the attribution collapsed to its (i) button.
        map!.getContainer().querySelector(".maplibregl-compact-show")?.classList.remove("maplibregl-compact-show");
        // Padding may have changed (breakpoint) while the library was loading.
        if (!latest.current.intro) map!.fitBounds(boundsOf(latest.current.nodes), { padding: latest.current.padding, duration: 0 });
      });
      if (opts.intro) {
        map.once("load", () => {
          setTimeout(() => {
            map!.fitBounds(bounds, { padding: opts.padding, duration: 4200, essential: true, curve: 1.6 });
            map!.once("moveend", () => latest.current.onIntroEnd?.());
          }, 500);
        });
      }
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markerMap.clear();
    };
  }, []);

  // Basemap switch. A full style reload drops our layers; `style.load` re-adds them.
  const firstStyle = useRef(true);
  useEffect(() => {
    if (firstStyle.current) {
      firstStyle.current = false;
      return;
    }
    mapRef.current?.setStyle(MAP_STYLES[mapStyle].style, { diff: false });
  }, [mapStyle]);

  // Node markers: real DOM elements owned by MapLibre, filled with React via portals.
  useEffect(() => {
    const map = mapRef.current;
    const ml = libRef.current;
    if (!map || !ml || !styleGen) return;
    let changed = false;
    const seen = new Set<string>();
    for (const n of nodes) {
      seen.add(n.id);
      const existing = markers.current.get(n.id);
      if (existing) existing.setLngLat(lngLat(n));
      else {
        const el = document.createElement("div");
        markers.current.set(n.id, new ml.Marker({ element: el, anchor: "center" }).setLngLat(lngLat(n)).addTo(map));
        changed = true;
      }
    }
    for (const [id, m] of markers.current) {
      if (!seen.has(id)) {
        m.remove();
        markers.current.delete(id);
        changed = true;
      }
    }
    if (changed) setPins(Object.fromEntries([...markers.current].map(([id, m]) => [id, m.getElement()])));
  }, [nodes, styleGen]);

  // Links, coverage and the alert route.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleGen) return;
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const pos = (id: string) => lngLat(byId.get(id)!);
    const valid = links.filter((l) => byId.has(l.a) && byId.has(l.b));

    setData(map, "links", collection(valid.map((l) => segment(pos(l.a), pos(l.b), { dead: !byId.get(l.a)!.online || !byId.get(l.b)!.online }))));
    setData(map, "coverage", collection(coverage ? nodes.filter((n) => n.online).map((n) => circle(lngLat(n), n.gateway ? 12 : 8)) : []));
    setData(
      map,
      "bcast",
      collection(broadcasting ? valid.filter((l) => l.a === broadcasting || l.b === broadcasting).map((l) => segment(pos(l.a), pos(l.b))) : []),
    );

    const delivered = route ? Math.min(hops, route.length - 1) : 0;
    const segs = route ? Array.from({ length: delivered }, (_, i) => [pos(route[i]), pos(route[i + 1])] as const) : [];
    const grew = delivered > prevHops.current && delivered > 0;
    prevHops.current = delivered;
    if (!grew) {
      setData(map, "route", collection(segs.map(([a, b]) => segment(a, b))));
      return;
    }
    // Draw the newest hop progressively, like a packet crossing the link.
    let raf = 0;
    const start = performance.now();
    const frame = (t: number) => {
      const k = Math.min(1, (t - start) / 650);
      const e = 1 - (1 - k) ** 3;
      const [a, b] = segs[segs.length - 1];
      const tip: [number, number] = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
      setData(map, "route", collection([...segs.slice(0, -1).map(([p, q]) => segment(p, q)), segment(a, tip)]));
      if (k < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [nodes, links, route, hops, broadcasting, coverage, styleGen]);

  // Re-fit on request, or when the padding changes (e.g. side panels appear at a breakpoint).
  const paddingKey = JSON.stringify(padding);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || latest.current.intro) return;
    map.fitBounds(boundsOf(nodes), { padding, duration: fitKey ? 900 : 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, paddingKey]);

  useEffect(() => {
    const map = mapRef.current;
    const n = focus && nodes.find((x) => x.id === focus.id);
    if (!map || !n) return;
    map.easeTo({ center: lngLat(n), zoom: Math.max(map.getZoom(), 10.5), duration: 800, padding: typeof padding === "number" ? undefined : padding });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.n]);

  const head = route && hops > 0 ? route[Math.min(hops, route.length - 1)] : null;

  return (
    <div className={cn("relative h-full w-full bg-map", className)}>
      {/* MapLibre forces `position: relative` on its container, so size it explicitly. */}
      <div ref={containerRef} className="h-full w-full" />
      {nodes.map((n) => {
        const el = pins[n.id];
        if (!el) return null;
        const reached = !!route && route.includes(n.id) && route.indexOf(n.id) <= hops;
        return createPortal(
          <NodePin node={n} selected={selected === n.id} head={head === n.id} reached={reached} compact={compact} onSelect={onSelect} />,
          el,
          n.id,
        );
      })}
    </div>
  );
}

function NodePin({
  node,
  selected,
  head,
  reached,
  compact,
  onSelect,
}: {
  node: MeshNode;
  selected: boolean;
  head: boolean;
  reached: boolean;
  compact?: boolean;
  onSelect?: (id: string) => void;
}) {
  const h = health(node);
  const color = HEALTH_HEX[h];
  const Tag = onSelect ? "button" : "div";
  return (
    <Tag
      {...(onSelect ? { type: "button" as const, onClick: () => onSelect(node.id), "aria-label": `Select ${node.id}` } : {})}
      className="group relative grid place-items-center"
    >
      {(selected || head) && (
        <span className="ping-soft absolute size-8 rounded-full" style={{ background: color }} aria-hidden />
      )}
      {node.gateway ? (
        <span
          className={cn(
            "grid place-items-center rounded-[9px] bg-foreground text-background shadow-lg ring-2 ring-white transition-transform group-hover:scale-110",
            compact ? "size-6" : "size-7",
            selected && "ring-primary",
          )}
        >
          <RadioTower className={compact ? "size-3" : "size-3.5"} />
        </span>
      ) : (
        <span
          className={cn(
            "grid place-items-center rounded-full bg-white transition-transform group-hover:scale-110",
            compact ? "size-4" : "size-5",
            selected && "scale-110",
          )}
          style={{
            boxShadow: `0 0 0 ${compact ? 2.5 : 3}px ${color}, 0 4px 10px -2px rgb(20 32 27 / 0.45)`,
            outline: h === "offline" ? `2px dashed ${color}` : undefined,
            outlineOffset: 3,
          }}
        >
          {reached && <span className="size-2 rounded-full" style={{ background: color }} />}
        </span>
      )}
      <span
        className={cn(
          "pointer-events-none absolute top-full mt-1.5 rounded-md px-1.5 py-0.5 font-mono font-medium whitespace-nowrap shadow-sm ring-1 ring-black/5 backdrop-blur",
          compact ? "text-[9px]" : "text-[10px]",
          selected ? "bg-foreground text-background" : "bg-white/90 text-foreground",
          h === "offline" && "opacity-60",
        )}
      >
        {node.id}
      </span>
    </Tag>
  );
}
