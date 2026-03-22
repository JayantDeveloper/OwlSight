import type { Metadata } from "next";

import { MissionControlPage } from "@/components/pages/mission-control-page";

export const metadata: Metadata = {
  title: "Mission Control | OwlSight",
  description: "Bloomberg-terminal-style cross-chain execution dashboard.",
};

export default function AppPage() {
  return <MissionControlPage />;
}
