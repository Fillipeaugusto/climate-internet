export type SensorKey =
  | "temperature"
  | "humidity"
  | "airQuality"
  | "smoke"
  | "riverLevel"
  | "soilMoisture"
  | "rainfall";

export type GuardianType = "School" | "Farmer" | "NGO" | "Municipality" | "Research";

export type MeshNode = {
  id: string;
  x: number; // 0–1000 map units
  y: number; // 0–700 map units
  battery: number | null; // null = mains powered
  online: boolean;
  gateway?: boolean;
  guardian: string;
  guardianType: GuardianType;
  location: string;
  sensors: SensorKey[];
};

export type Link = { a: string; b: string; rssi: number };

export const SENSORS: Record<SensorKey, { label: string; unit: string; base: number; spread: number; threshold: number; digits: number }> = {
  temperature: { label: "Temperature", unit: "°C", base: 27, spread: 4, threshold: 38, digits: 1 },
  humidity: { label: "Humidity", unit: "%", base: 58, spread: 10, threshold: 101, digits: 0 },
  airQuality: { label: "Air Quality", unit: "AQI", base: 34, spread: 12, threshold: 150, digits: 0 },
  smoke: { label: "Smoke / Particles", unit: "µg/m³", base: 18, spread: 8, threshold: 75, digits: 0 },
  riverLevel: { label: "River Level", unit: "m", base: 1.8, spread: 0.4, threshold: 3.5, digits: 2 },
  soilMoisture: { label: "Soil Moisture", unit: "%", base: 31, spread: 6, threshold: 101, digits: 0 },
  rainfall: { label: "Rainfall", unit: "mm/h", base: 2, spread: 3, threshold: 40, digits: 1 },
};

export const SENSOR_ORDER: SensorKey[] = [
  "temperature",
  "humidity",
  "smoke",
  "rainfall",
  "soilMoisture",
  "riverLevel",
  "airQuality",
];

export const INITIAL_NODES: MeshNode[] = [
  { id: "N-01", x: 80, y: 150, battery: 82, online: true, guardian: "Serra Verde Ranger Post", guardianType: "NGO", location: "Forest edge, Chapada", sensors: ["temperature", "humidity", "smoke"] },
  { id: "N-02", x: 340, y: 60, battery: 91, online: true, guardian: "Escola Rural Ipê", guardianType: "School", location: "Hilltop school", sensors: ["airQuality", "temperature"] },
  { id: "N-03", x: 460, y: 320, battery: 64, online: true, guardian: "Fazenda Boa Água", guardianType: "Farmer", location: "Central plateau", sensors: ["soilMoisture", "rainfall"] },
  { id: "N-04", x: 140, y: 500, battery: 21, online: true, guardian: "Sítio Três Pedras", guardianType: "Farmer", location: "Southwest valley", sensors: ["soilMoisture", "rainfall", "temperature"] },
  { id: "N-05", x: 420, y: 650, battery: 76, online: true, guardian: "River Watch Collective", guardianType: "NGO", location: "Riverbank crossing", sensors: ["riverLevel", "rainfall"] },
  { id: "N-06", x: 680, y: 440, battery: 58, online: true, guardian: "Municipal Civil Defense", guardianType: "Municipality", location: "Bridge district", sensors: ["riverLevel", "rainfall", "humidity"] },
  { id: "N-07", x: 790, y: 640, battery: 3, online: true, guardian: "UnB Climate Lab", guardianType: "Research", location: "Wetland transect", sensors: ["humidity", "temperature", "riverLevel"] },
  { id: "N-08", x: 900, y: 200, battery: 88, online: true, guardian: "Escola Estadual Cerrado", guardianType: "School", location: "Ridge school", sensors: ["airQuality", "smoke", "temperature"] },
  { id: "GW", x: 960, y: 590, battery: null, online: true, gateway: true, guardian: "Regional Gateway", guardianType: "Municipality", location: "City hall uplink", sensors: [] },
];

/**
 * Activation codes printed on the card inside each sensor box, as the shop's backend would issue them.
 * A code can only be activated once and fixes which sensors the node carries.
 */
export const SENSOR_CODES: Record<string, { kit: string; sensors: SensorKey[] }> = {
  "CI-4F7K-2QXM": { kit: "RAK 4-in-1 Solar Node · Fire kit", sensors: ["temperature", "humidity", "smoke"] },
  "CI-8RTD-5WNA": { kit: "RAK 4-in-1 Solar Node · Farm kit", sensors: ["soilMoisture", "rainfall", "temperature"] },
  "CI-3HPV-9LCE": { kit: "RAK 4-in-1 Solar Node · River kit", sensors: ["riverLevel", "rainfall"] },
  "CI-6YBG-1ZUJ": { kit: "RAK 4-in-1 Solar Node · Air kit", sensors: ["airQuality", "smoke", "temperature"] },
};

/** Formats free typing as `CI-XXXX-XXXX`. */
export function formatCode(raw: string) {
  const body = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^CI/, "").slice(0, 8);
  if (!body) return "";
  return `CI-${body.slice(0, 4)}${body.length > 4 ? `-${body.slice(4)}` : ""}`;
}

export const LINKS: Link[] = [
  { a: "N-01", b: "N-02", rssi: -92 },
  { a: "N-01", b: "N-03", rssi: -88 },
  { a: "N-01", b: "N-04", rssi: -95 },
  { a: "N-02", b: "N-03", rssi: -97 },
  { a: "N-03", b: "N-04", rssi: -101 },
  { a: "N-03", b: "N-05", rssi: -99 },
  { a: "N-03", b: "N-06", rssi: -86 },
  { a: "N-04", b: "N-05", rssi: -94 },
  { a: "N-05", b: "N-06", rssi: -96 },
  { a: "N-05", b: "N-07", rssi: -103 },
  { a: "N-06", b: "N-08", rssi: -90 },
  { a: "N-06", b: "N-07", rssi: -98 },
  { a: "N-06", b: "GW", rssi: -112 },
  { a: "N-07", b: "GW", rssi: -91 },
  { a: "N-08", b: "GW", rssi: -87 },
  { a: "N-02", b: "N-08", rssi: -114 },
];

export type NodeHealth = "ok" | "low" | "critical" | "offline";

export function health(n: MeshNode): NodeHealth {
  if (!n.online) return "offline";
  if (n.battery === null) return "ok";
  if (n.battery < 10) return "critical";
  if (n.battery < 30) return "low";
  return "ok";
}

/** Link cost: weaker RSSI costs more; low-battery relays are penalised, critical/offline ones skipped. */
function cost(link: Link, via: MeshNode) {
  const h = health(via);
  if (h === "offline" || (h === "critical" && !via.gateway)) return Infinity;
  const signal = Math.max(1, (-link.rssi - 80) / 4);
  return signal + (h === "low" ? 6 : 0);
}

export function neighbors(id: string, links: Link[]) {
  return links.filter((l) => l.a === id || l.b === id).map((l) => ({ id: l.a === id ? l.b : l.a, link: l }));
}

/** Dijkstra from source to gateway across healthy relays. */
export function findRoute(source: string, nodes: MeshNode[], links: Link[], target = "GW"): string[] | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const src = byId.get(source);
  if (!src || !src.online) return null;
  const dist = new Map<string, number>([[source, 0]]);
  const prev = new Map<string, string>();
  const open = new Set(nodes.map((n) => n.id));
  while (open.size) {
    let cur: string | null = null;
    for (const id of open) if (dist.has(id) && (cur === null || dist.get(id)! < dist.get(cur)!)) cur = id;
    if (cur === null) break;
    open.delete(cur);
    if (cur === target) break;
    for (const { id, link } of neighbors(cur, links)) {
      const node = byId.get(id);
      if (!node || !open.has(id)) continue;
      const d = dist.get(cur)! + cost(link, node);
      if (d < (dist.get(id) ?? Infinity)) {
        dist.set(id, d);
        prev.set(id, cur);
      }
    }
  }
  if (!dist.has(target) || !isFinite(dist.get(target)!)) return null;
  const path = [target];
  while (path[0] !== source) path.unshift(prev.get(path[0])!);
  return path;
}

/** Map units → real coordinates around Chapada dos Veadeiros (GO, Brazil); the gateway lands on Alto Paraíso. */
const BBOX = { west: -48.04, east: -47.49, north: -13.795, south: -14.195 };

export function lngLat(n: { x: number; y: number }): [number, number] {
  return [BBOX.west + (n.x / 1000) * (BBOX.east - BBOX.west), BBOX.north + (n.y / 700) * (BBOX.south - BBOX.north)];
}

/** Real coordinates → map units; the inverse of `lngLat`. */
export function mapUnits([lng, lat]: [number, number]) {
  return { x: ((lng - BBOX.west) / (BBOX.east - BBOX.west)) * 1000, y: ((lat - BBOX.north) / (BBOX.south - BBOX.north)) * 700 };
}

/** Beyond this, a point is treated as outside LoRa reach of the mesh. */
export const MESH_RANGE_KM = 25;

/** Great-circle distance between two [lng, lat] points, in km. */
export function haversineKm([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Great-circle distance between two nodes, in km. */
export function distanceKm(a: { x: number; y: number }, b: { x: number; y: number }) {
  return haversineKm(lngLat(a), lngLat(b));
}

/** Online sensor nodes sorted by distance from a point, closest first. */
export function nearestNodes(point: [number, number], nodes: MeshNode[]) {
  return nodes
    .filter((n) => !n.gateway && n.online)
    .map((node) => ({ node, km: haversineKm(point, lngLat(node)) }))
    .sort((a, b) => a.km - b.km);
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** Compass direction from `from` towards `to`. */
export function bearing([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) {
  const rad = Math.PI / 180;
  const y = Math.sin((lng2 - lng1) * rad) * Math.cos(lat2 * rad);
  const x = Math.cos(lat1 * rad) * Math.sin(lat2 * rad) - Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lng2 - lng1) * rad);
  const deg = (Math.atan2(y, x) / rad + 360) % 360;
  return COMPASS[Math.round(deg / 45) % 8];
}

export function fmtCoord([lng, lat]: [number, number]) {
  return `${Math.abs(lat).toFixed(4)}°${lat < 0 ? "S" : "N"} ${Math.abs(lng).toFixed(4)}°${lng < 0 ? "W" : "E"}`;
}

export function reading(key: SensorKey, t: number, seed: number) {
  const s = SENSORS[key];
  const wave = Math.sin(t / 6 + seed) * 0.6 + Math.sin(t / 2.3 + seed * 3) * 0.25;
  const noise = (Math.sin(t * 12.9898 + seed * 78.233) * 43758.5453) % 1;
  return Math.max(0, s.base + s.spread * (wave + noise * 0.3));
}

export type Tone = "ok" | "warn" | "danger";

/** Plain-language reading of a sensor value, for people rather than operators. */
export function condition(key: SensorKey, v: number): { label: string; tone: Tone } {
  switch (key) {
    case "temperature":
      return v >= 38 ? { label: "Extreme heat", tone: "danger" } : v >= 32 ? { label: "Hot", tone: "warn" } : v <= 12 ? { label: "Cold", tone: "warn" } : { label: "Comfortable", tone: "ok" };
    case "humidity":
      return v < 20 ? { label: "Critically dry", tone: "danger" } : v < 30 ? { label: "Very dry", tone: "warn" } : v < 40 ? { label: "Dry", tone: "warn" } : v <= 70 ? { label: "Comfortable", tone: "ok" } : { label: "Humid", tone: "ok" };
    case "airQuality":
      return v <= 50 ? { label: "Good", tone: "ok" } : v <= 100 ? { label: "Moderate", tone: "warn" } : { label: "Unhealthy", tone: "danger" };
    case "smoke":
      return v <= 25 ? { label: "Clear air", tone: "ok" } : v <= 50 ? { label: "Haze", tone: "warn" } : { label: "Heavy smoke", tone: "danger" };
    case "riverLevel":
      return v < 2.5 ? { label: "Normal", tone: "ok" } : v < 3.5 ? { label: "Rising", tone: "warn" } : { label: "Flood risk", tone: "danger" };
    case "soilMoisture":
      return v < 15 ? { label: "Very dry · fire risk", tone: "danger" } : v < 25 ? { label: "Dry", tone: "warn" } : { label: "Normal", tone: "ok" };
    case "rainfall":
      return v < 0.2 ? { label: "No rain", tone: "ok" } : v < 10 ? { label: "Light rain", tone: "ok" } : v < 40 ? { label: "Heavy rain", tone: "warn" } : { label: "Torrential", tone: "danger" };
  }
}

export function fmt(key: SensorKey, v: number) {
  return `${v.toFixed(SENSORS[key].digits)} ${SENSORS[key].unit}`;
}

export function clock(d = new Date()) {
  return d.toLocaleTimeString("en-GB", { hour12: false });
}
