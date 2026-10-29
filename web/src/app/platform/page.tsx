import type { Metadata } from "next";
import { Platform } from "@/components/platform";

export const metadata: Metadata = { title: "Mesh Monitor — Climate Internet" };

export default function PlatformPage() {
  return <Platform />;
}
